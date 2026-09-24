ALTER TABLE `raffles` ADD `threshold_reached_at` integer;--> statement-breakpoint
ALTER TABLE `raffles` ADD `round_start_tickets` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `winners` ADD `round` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
-- Backfill for the round-based draw rule (draw a tier delay AFTER the ticket goal is reached).
-- 1) The old "extend" branch set draw_status = 'extended', which nothing ever re-selected, so those raffles were stuck. Treat them as pending.
UPDATE `raffles` SET `draw_status` = 'pending' WHERE `draw_status` = 'extended';--> statement-breakpoint
-- 2) Rounds already awarded under the old logic consumed their goal's worth of tickets.
UPDATE `raffles` SET `round_start_tickets` = MIN(`total_tickets_collected`, (`prizes_available` - `prizes_remaining`) * `game_price`) WHERE `prizes_remaining` < `prizes_available`;--> statement-breakpoint
-- 3) Active raffles whose current round already met its goal: stamp the time of the entry that crossed it (running ticket total by entry time); fall back to now if entries can't account for it.
UPDATE `raffles` SET `threshold_reached_at` = COALESCE((
  SELECT MIN(`e`.`ts`) FROM (
    SELECT `raffle_id`, `timestamp` AS `ts`, SUM(`tickets_used`) OVER (PARTITION BY `raffle_id` ORDER BY `timestamp`, `id`) AS `running` FROM `entries`
  ) AS `e`
  WHERE `e`.`raffle_id` = `raffles`.`id` AND `e`.`running` >= `raffles`.`round_start_tickets` + `raffles`.`game_price`
), unixepoch() * 1000)
WHERE `active` = 1 AND `draw_status` IN ('pending', 'eligible') AND `total_entries` > 0 AND `total_tickets_collected` - `round_start_tickets` >= `game_price`;--> statement-breakpoint
UPDATE `raffles` SET `draw_status` = 'eligible' WHERE `active` = 1 AND `draw_status` = 'pending' AND `threshold_reached_at` IS NOT NULL;
