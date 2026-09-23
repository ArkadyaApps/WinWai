import type { APIRoute } from "astro";
import { json } from "../../../lib/respond";

interface PlacePrediction {
  text?: { text?: string };
  placeId?: string;
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
}

interface AutocompleteResponse {
  suggestions?: Array<{ placePrediction?: PlacePrediction }>;
}

export const GET: APIRoute = async ({ url, locals }) => {
  const env = locals.runtime.env;
  if (!env.GOOGLE_PLACES_API_KEY) return json({ error: "Google Places API key not configured" }, 500);

  const input = url.searchParams.get("input");
  const country = (url.searchParams.get("country") ?? "th").toUpperCase();
  if (!input) return json({ status: "ZERO_RESULTS", predictions: [] });

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY },
      body: JSON.stringify({ input, includedRegionCodes: [country], languageCode: "en" }),
    });
    const data = (await response.json()) as AutocompleteResponse;

    if (data.suggestions) {
      const predictions = data.suggestions
        .filter((s): s is { placePrediction: PlacePrediction } => Boolean(s.placePrediction))
        .map(({ placePrediction: pred }) => ({
          description: pred.text?.text ?? "",
          place_id: pred.placeId ?? "",
          structured_formatting: {
            main_text: pred.structuredFormat?.mainText?.text ?? "",
            secondary_text: pred.structuredFormat?.secondaryText?.text ?? "",
          },
        }));
      return json({ status: "OK", predictions });
    }
    return json({ status: "ZERO_RESULTS", predictions: [] });
  } catch (e) {
    console.error("Error calling Google Places API:", e);
    return json({ error: "Failed to search places" }, 500);
  }
};
