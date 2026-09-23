import type { APIRoute } from "astro";
import { json } from "../../../../lib/respond";

export const GET: APIRoute = async () => {
  return json({
    categories: [
      { id: "food", name: "Food & Dining", icon: "🍽️" },
      { id: "hotel", name: "Hotel Stays", icon: "🏨" },
      { id: "spa", name: "Spa & Wellness", icon: "💆" },
    ],
  });
};
