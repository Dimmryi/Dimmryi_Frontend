import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const COORDS_CACHE_KEY = 'coordsCache';

type Coordinates = { lat: number; lon: number };

interface DetailsMapProps {
    location: string;
    title: string;
}

const readCoordsCache = (): Record<string, Coordinates> => {
    try {
        return JSON.parse(localStorage.getItem(COORDS_CACHE_KEY) || '{}');
    } catch {
        return {};
    }
};

const writeCoordsCache = (cache: Record<string, Coordinates>) => {
    localStorage.setItem(COORDS_CACHE_KEY, JSON.stringify(cache));
};

const geocode = async (location: string): Promise<Coordinates | null> => {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`,
    );
    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;

    if (!first?.lat || !first?.lon) return null;
    return { lat: Number(first.lat), lon: Number(first.lon) };
};

const makeMarkerIcon = () =>
    L.divIcon({
        className: 'dm-details-map-marker',
        html: '<span></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });

const DetailsMap = ({ location, title }: DetailsMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    const [isUnavailable, setIsUnavailable] = useState(false);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            zoomControl: true,
            attributionControl: true,
        }).setView([50.4501, 30.5234], 11);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !location) return;

        let cancelled = false;

        const render = async () => {
            setIsResolving(true);
            setIsUnavailable(false);

            const cache = readCoordsCache();
            let coords: Coordinates | null | undefined = cache[location];

            if (!coords) {
                coords = await geocode(location).catch(() => null);
                if (coords) {
                    cache[location] = coords;
                    writeCoordsCache(cache);
                }
            }

            if (cancelled) return;

            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }

            if (!coords) {
                setIsUnavailable(true);
                setIsResolving(false);
                return;
            }

            const resolvedCoords = coords;

            markerRef.current = L.marker([resolvedCoords.lat, resolvedCoords.lon], { icon: makeMarkerIcon() })
                .addTo(map)
                .bindPopup(`<strong>${title}</strong><br/>${location}`);

            map.setView([resolvedCoords.lat, resolvedCoords.lon], 13, { animate: true });
            markerRef.current.openPopup();
            setIsResolving(false);
        };

        render();

        return () => {
            cancelled = true;
        };
    }, [location, title]);

    return (
        <div className="dm-details-map-wrap">
            <div ref={containerRef} className="dm-details-map" />
            {isResolving ? <div className="dm-details-map-status">Шукаю адресу на мапі…</div> : null}
            {isUnavailable ? <div className="dm-details-map-status">Не вдалося точно визначити координати цієї адреси.</div> : null}
        </div>
    );
};

export default DetailsMap;
