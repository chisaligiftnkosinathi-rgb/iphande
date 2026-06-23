import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../config/api';

export interface Place {
    place_code: string;
    suburb_or_area: string;
    town_or_city: string;
    province: string;
}

export function useLocations() {
    const [provinces, setProvinces] = useState<string[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>('');

    const [towns, setTowns] = useState<string[]>([]);
    const [selectedTown, setSelectedTown] = useState<string>('');

    const [places, setPlaces] = useState<Place[]>([]);
    const [selectedPlaceCode, setSelectedPlaceCode] = useState<string>('');

    // 1. Load provinces on mount
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const data = await fetchWithAuth('/locations/provinces');
                setProvinces(data.provinces || []);
            } catch (error) {
                console.error("Failed to load provinces", error);
            }
        };
        loadProvinces();
    }, []);

    // 2. On province select, load towns
    useEffect(() => {
        if (!selectedProvince) {
            setTowns([]);
            setSelectedTown('');
            return;
        }
        const loadTowns = async () => {
            try {
                const data = await fetchWithAuth(`/locations/provinces/${encodeURIComponent(selectedProvince)}/towns`);
                setTowns(data.towns || []);
            } catch (error) {
                console.error("Failed to load towns", error);
            }
        };
        loadTowns();
    }, [selectedProvince]);

    // 3. On town select, load suburbs/places
    useEffect(() => {
        if (!selectedTown) {
            setPlaces([]);
            setSelectedPlaceCode('');
            return;
        }
        const loadPlaces = async () => {
            try {
                const data = await fetchWithAuth(`/locations/towns/${encodeURIComponent(selectedTown)}/places`);
                setPlaces(data.places || []);
            } catch (error) {
                console.error("Failed to load places", error);
            }
        };
        loadPlaces();
    }, [selectedTown]);

    return {
        provinces,
        selectedProvince,
        setSelectedProvince,
        towns,
        selectedTown,
        setSelectedTown,
        places,
        selectedPlaceCode,
        setSelectedPlaceCode,
    };
}
