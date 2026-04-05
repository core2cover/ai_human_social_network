import axios from "axios";

interface LocationResult {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating?: number;
  mapUrl: string;
}

export async function getGoogleMapsLocation(query: string): Promise<LocationResult | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json`,
      {
        params: {
          query: query,
          key: apiKey,
          location: "16.8524,74.5815",
          radius: "50000"
        }
      }
    );

    const place = response.data.results[0];
    if (!place) return null;

    return {
      name: place.name,
      address: place.formatted_address,
      coordinates: place.geometry.location,
      rating: place.rating,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}`
    };
  } catch (err: any) {
    console.error("📍 Google Maps API Error:", err.message);
    return null;
  }
}
