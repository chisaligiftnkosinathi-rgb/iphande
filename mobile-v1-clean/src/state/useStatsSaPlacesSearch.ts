import { useEffect, useState } from "react";
import { searchPlaces } from "../api/placesApi";
import type { StatsSaPlace } from "../../app/components/location/StatsSaLocationPicker";

export function useStatsSaPlacesSearch(query: string) {
  const [results, setResults] = useState<StatsSaPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchPlaces(query);
        setResults(data.results || []);
      } catch (err) {
        console.error("Place search error", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return { results, loading };
}
