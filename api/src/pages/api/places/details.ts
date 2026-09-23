import type { APIRoute } from "astro";
import { json } from "../../../lib/respond";

interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface PlaceDetailsResponse {
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: AddressComponent[];
}

export const GET: APIRoute = async ({ url, locals }) => {
  const env = locals.runtime.env;
  if (!env.GOOGLE_PLACES_API_KEY) return json({ error: "Google Places API key not configured" }, 500);

  const placeId = url.searchParams.get("place_id");
  if (!placeId) return json({ status: "NOT_FOUND", result: null });

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "displayName,formattedAddress,location,addressComponents",
      },
    });
    const data = (await response.json()) as PlaceDetailsResponse;

    if (!data.displayName && !data.formattedAddress) {
      return json({ status: "NOT_FOUND", result: null });
    }

    const addressComponents = data.addressComponents ?? [];
    return json({
      status: "OK",
      result: {
        name: data.displayName?.text ?? "",
        formatted_address: data.formattedAddress ?? "",
        geometry: {
          location: {
            lat: data.location?.latitude ?? 0,
            lng: data.location?.longitude ?? 0,
          },
        },
        address_components: addressComponents.map((c) => ({
          long_name: c.longText ?? "",
          short_name: c.shortText ?? "",
          types: c.types ?? [],
        })),
      },
    });
  } catch (e) {
    console.error("Error calling Google Places API:", e);
    return json({ error: "Failed to fetch place details" }, 500);
  }
};
