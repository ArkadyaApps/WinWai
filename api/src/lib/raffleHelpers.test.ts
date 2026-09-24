import { describe, expect, it } from "vitest";
import {
  anonymousWinnerId,
  getCurrentRound,
  getDrawDelayMs,
  getRoundTickets,
  getScheduledDrawAt,
  hasReachedGoal,
  isRoundDue,
  nextRoundStartTickets,
  withRoundInfo,
} from "./raffleHelpers";

const DAY = 24 * 60 * 60 * 1000;

describe("getDrawDelayMs (USD tiers)", () => {
  it("is 1 day up to and including $15", () => {
    expect(getDrawDelayMs(0)).toBe(1 * DAY);
    expect(getDrawDelayMs(12.6)).toBe(1 * DAY);
    expect(getDrawDelayMs(15)).toBe(1 * DAY);
  });
  it("is 3 days above $15 up to and including $25", () => {
    expect(getDrawDelayMs(15.01)).toBe(3 * DAY);
    expect(getDrawDelayMs(25)).toBe(3 * DAY);
  });
  it("is 7 days above $25", () => {
    expect(getDrawDelayMs(25.01)).toBe(7 * DAY);
    expect(getDrawDelayMs(5000)).toBe(7 * DAY);
  });
});

describe("getScheduledDrawAt / isRoundDue", () => {
  const reached = new Date("2026-10-01T10:00:00Z");

  it("is null until the goal has been reached", () => {
    expect(getScheduledDrawAt(null, 10)).toBeNull();
    expect(getScheduledDrawAt(undefined, 10)).toBeNull();
    expect(isRoundDue(null, 10, new Date("2030-01-01"))).toBe(false);
  });

  it("is the goal-reached time plus the tier delay", () => {
    expect(getScheduledDrawAt(reached, 10)?.toISOString()).toBe("2026-10-02T10:00:00.000Z");
    expect(getScheduledDrawAt(reached, 20)?.toISOString()).toBe("2026-10-04T10:00:00.000Z");
    expect(getScheduledDrawAt(reached, 100)?.toISOString()).toBe("2026-10-08T10:00:00.000Z");
  });

  it("becomes due exactly at the scheduled moment, not before", () => {
    expect(isRoundDue(reached, 10, new Date("2026-10-02T09:59:59.999Z"))).toBe(false);
    expect(isRoundDue(reached, 10, new Date("2026-10-02T10:00:00.000Z"))).toBe(true);
    expect(isRoundDue(reached, 10, new Date("2026-10-03T00:00:00Z"))).toBe(true);
  });
});

describe("round ticket math", () => {
  it("counts only tickets collected since the round started", () => {
    expect(getRoundTickets(260, 200)).toBe(60);
    expect(getRoundTickets(200, 200)).toBe(0);
  });
  it("never goes negative", () => {
    expect(getRoundTickets(50, 200)).toBe(0);
  });

  it("reaches the goal at exactly the goal, not one ticket earlier", () => {
    expect(hasReachedGoal(199, 0, 200)).toBe(false);
    expect(hasReachedGoal(200, 0, 200)).toBe(true);
    expect(hasReachedGoal(260, 0, 200)).toBe(true);
  });
  it("measures the goal against the round, not the lifetime total", () => {
    expect(hasReachedGoal(300, 200, 200)).toBe(false);
    expect(hasReachedGoal(400, 200, 200)).toBe(true);
  });
  it("treats a goal of 0 (legacy rows) as met immediately", () => {
    expect(hasReachedGoal(0, 0, 0)).toBe(true);
  });
});

describe("getCurrentRound (one prize per round)", () => {
  it("is round 1 for a single-prize raffle", () => {
    expect(getCurrentRound(1, 1)).toBe(1);
  });
  it("advances as prizes are awarded", () => {
    expect(getCurrentRound(3, 3)).toBe(1);
    expect(getCurrentRound(3, 2)).toBe(2);
    expect(getCurrentRound(3, 1)).toBe(3);
  });
  it("never exceeds the number of prizes", () => {
    expect(getCurrentRound(3, 0)).toBe(3);
  });
});

describe("nextRoundStartTickets (carry-over)", () => {
  it("consumes one goal and carries the surplus into the next round", () => {
    const start = nextRoundStartTickets(0, 200, 260);
    expect(start).toBe(200);
    expect(getRoundTickets(260, start)).toBe(60);
  });

  it("can leave the next round's goal already met when the surplus is big enough", () => {
    const start = nextRoundStartTickets(0, 100, 250);
    expect(start).toBe(100);
    expect(hasReachedGoal(250, start, 100)).toBe(true);
  });

  it("caps at the total so a draw forced before the goal doesn't create a negative round", () => {
    const start = nextRoundStartTickets(0, 200, 50);
    expect(start).toBe(50);
    expect(getRoundTickets(50, start)).toBe(0);
  });

  it("walks correctly through several rounds", () => {
    const goal = 200;
    let total = 450;
    let start = 0;
    const roundsMet: boolean[] = [];
    for (let round = 0; round < 3; round++) {
      const met = hasReachedGoal(total, start, goal);
      roundsMet.push(met);
      // A round only advances when it is actually drawn, i.e. its goal was met.
      if (met) start = nextRoundStartTickets(start, goal, total);
    }
    // 450 tickets fund two full rounds; the third has only 50 of 200.
    expect(roundsMet).toEqual([true, true, false]);
    expect(getRoundTickets(total, start)).toBe(50);
  });
});

describe("threshold crossing by successive entries", () => {
  it("is crossed by exactly one entry per round", () => {
    const goal = 200;
    let total = 0;
    const crossings: number[] = [];
    [60, 60, 60, 60, 60].forEach((tickets, i) => {
      const before = hasReachedGoal(total, 0, goal);
      total += tickets;
      if (!before && hasReachedGoal(total, 0, goal)) crossings.push(i);
    });
    expect(crossings).toEqual([3]); // 4th entry takes the total to 240
  });

  it("counts an overshooting single entry as the crossing entry", () => {
    expect(hasReachedGoal(0, 0, 200)).toBe(false);
    expect(hasReachedGoal(0 + 500, 0, 200)).toBe(true);
  });
});

describe("withRoundInfo", () => {
  const base = {
    prizesAvailable: 3,
    prizesRemaining: 2,
    prizeValueUsd: 20,
    totalTicketsCollected: 260,
    roundStartTickets: 200,
    thresholdReachedAt: null as Date | null,
  };

  it("derives round, round tickets, and no schedule while the goal is unmet", () => {
    const info = withRoundInfo(base);
    expect(info.currentRound).toBe(2);
    expect(info.roundTickets).toBe(60);
    expect(info.scheduledDrawAt).toBeNull();
    expect(info.drawDelayMs).toBe(3 * DAY);
  });

  it("adds the scheduled draw time once the goal was reached", () => {
    const reached = new Date("2026-10-01T00:00:00Z");
    const info = withRoundInfo({ ...base, thresholdReachedAt: reached });
    expect(info.scheduledDrawAt?.toISOString()).toBe("2026-10-04T00:00:00.000Z"); // $20 tier = 3 days
  });

  it("keeps the original fields", () => {
    expect(withRoundInfo({ ...base, extra: "x" }).extra).toBe("x");
  });
});

describe("anonymousWinnerId", () => {
  it("is a stable 6-char uppercase hex label", async () => {
    const id = await anonymousWinnerId("WW-2026-12345", "raffle-1");
    expect(id).toMatch(/^[0-9A-F]{6}$/);
    expect(await anonymousWinnerId("WW-2026-12345", "raffle-1")).toBe(id);
  });

  it("differs per voucher and per raffle", async () => {
    const a = await anonymousWinnerId("WW-2026-12345", "raffle-1");
    expect(await anonymousWinnerId("WW-2026-12346", "raffle-1")).not.toBe(a);
    expect(await anonymousWinnerId("WW-2026-12345", "raffle-2")).not.toBe(a);
  });

  it("does not embed the voucher reference", async () => {
    const id = await anonymousWinnerId("WW-2026-12345", "raffle-1");
    expect(id).not.toContain("12345");
  });
});
