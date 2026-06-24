import type { StatsSaPlace } from "../../app/components/location/StatsSaLocationPicker";
import { API_BASE_URL } from "../../config/api";

export async function searchPlaces(q: string): Promise<{ results: StatsSaPlace[] }> {
  const res = await fetch(`${API_BASE_URL}/places/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Failed to search places");
  return res.json();
}
