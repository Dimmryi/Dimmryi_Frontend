import { memo, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Listing } from './ListingCard';
import type { IFilterMapState } from '../features/filterMap/filterMapSlice';
import { useCurrency } from '../CurrencyProvider';

const COORDS_CACHE_KEY = 'coordsCache';
const GEOCODE_DELAY_MS = 1100;

interface LeafletListingsMapProps {
    listings: Listing[];
    filter: IFilterMapState;
    activeId?: string;
    expanded?: boolean;
    command?: { type: 'zoomIn' | 'zoomOut' | 'locate'; id: number } | null;
    onPick: (listing: Listing) => void;
}

type Coordinates = { lat: number; lon: number };

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const radius = 6371;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

const makePriceIcon = (listing: Listing, isActive: boolean, formatListingPrice: (listing: Listing) => string) => {
    const isRent = listing.listingType === 'rent';
    const label = `${formatListingPrice(listing)}${isRent ? '/міс' : ''}`;

    return L.divIcon({
        className: 'dm-leaflet-marker',
        html: `
            <button class="dm-leaflet-marker__pin ${isActive ? 'is-active' : ''} ${isRent ? 'is-rent' : 'is-sale'}">
                <span>${label}</span>
            </button>
        `,
        iconSize: [82, 34],
        iconAnchor: [41, 34],
    });
};

const makeCenterIcon = () =>
    L.divIcon({
        className: 'dm-leaflet-center',
        html: '<span></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });

const LeafletListingsMap = ({ listings, filter, activeId, expanded = false, command, onPick }: LeafletListingsMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerGroupRef = useRef<L.FeatureGroup | null>(null);
    const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
    const markerListingByIdRef = useRef<Map<string, Listing>>(new Map());
    const circleRef = useRef<L.Circle | null>(null);
    const centerMarkerRef = useRef<L.Marker | null>(null);
    const activeIdRef = useRef(activeId);
    const onPickRef = useRef(onPick);
    const { displayCurrency, formatPrice } = useCurrency();
    const [isResolving, setIsResolving] = useState(false);
    const formatListingPrice = (listing: Listing) => formatPrice(listing.price, listing.currency, { compact: true });

    const filterKey = useMemo(() => JSON.stringify(filter), [filter]);
    const listingsKey = useMemo(
        () => listings.map((listing) => `${listing._id}:${listing.location}:${listing.price}`).join('|'),
        [listings],
    );

    useEffect(() => {
        onPickRef.current = onPick;
    }, [onPick]);

    useEffect(() => {
        activeIdRef.current = activeId;
        markerListingByIdRef.current.forEach((listing, id) => {
            markerByIdRef.current.get(id)?.setIcon(makePriceIcon(listing, id === activeId, formatListingPrice));
        });
    }, [activeId, displayCurrency]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            zoomControl: false,
            attributionControl: true,
        }).setView([49.0, 31.0], 6);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            className: 'dm-map-blue-tile-layer',
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
        if (!mapRef.current) return;
        const timer = window.setTimeout(() => mapRef.current?.invalidateSize(), expanded ? 360 : 180);
        return () => window.clearTimeout(timer);
    }, [expanded]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !command) return;

        if (command.type === 'zoomIn') {
            map.zoomIn();
            return;
        }

        if (command.type === 'zoomOut') {
            map.zoomOut();
            return;
        }

        if (command.type === 'locate' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const coords: Coordinates = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                };

                if (centerMarkerRef.current) map.removeLayer(centerMarkerRef.current);
                centerMarkerRef.current = L.marker([coords.lat, coords.lon], { icon: makeCenterIcon() }).addTo(map);
                map.setView([coords.lat, coords.lon], Math.max(map.getZoom(), 13));
            });
        }
    }, [command]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        let cancelled = false;

        const render = async () => {
            const parsedFilter = JSON.parse(filterKey) as IFilterMapState;
            const hasDestinationFilter = Boolean(parsedFilter.destination);
            const effectiveRange = hasDestinationFilter ? parsedFilter.rangeValue || 20 : Infinity;

            setIsResolving(true);
            markerByIdRef.current.clear();
            markerListingByIdRef.current.clear();

            let center: Coordinates = { lat: 49.0, lon: 31.0 };
            let zoom = 6;
            const cache = readCoordsCache();

            if (parsedFilter.destination) {
                const cachedDestination = cache[`destination:${parsedFilter.destination}`];
                const resolved = cachedDestination || (await geocode(parsedFilter.destination).catch(() => null));

                if (resolved) {
                    center = resolved;
                    cache[`destination:${parsedFilter.destination}`] = resolved;
                    writeCoordsCache(cache);
                    zoom = 12;
                }
            }

            const visibleMarkers: L.Marker[] = [];
            const missing: Listing[] = [];

            const passes = (listing: Listing, coords: Coordinates) =>
                (!hasDestinationFilter || haversineKm(center.lat, center.lon, coords.lat, coords.lon) <= effectiveRange) &&
                (!parsedFilter.listingType || listing.listingType === parsedFilter.listingType) &&
                (!parsedFilter.propertyType || listing.propertyType === parsedFilter.propertyType);

            const addMarker = (listing: Listing, coords: Coordinates) => {
                if (!passes(listing, coords)) return;
                const marker = L.marker([coords.lat, coords.lon], {
                    icon: makePriceIcon(listing, listing._id === activeIdRef.current, formatListingPrice),
                });

                marker.on('click', () => onPickRef.current(listing));
                markerByIdRef.current.set(listing._id, marker);
                markerListingByIdRef.current.set(listing._id, listing);
                visibleMarkers.push(marker);
            };

            for (const listing of listings) {
                if (!listing.location) continue;
                const coords = cache[listing.location];
                if (coords) addMarker(listing, coords);
                else missing.push(listing);
            }

            if (!parsedFilter.destination && visibleMarkers.length > 0) {
                const latLngs = visibleMarkers.map((marker) => marker.getLatLng());
                center = {
                    lat: latLngs.reduce((sum, item) => sum + item.lat, 0) / latLngs.length,
                    lon: latLngs.reduce((sum, item) => sum + item.lng, 0) / latLngs.length,
                };
                zoom = 10;
            }

            if (cancelled) return;

            if (markerGroupRef.current) map.removeLayer(markerGroupRef.current);
            if (circleRef.current) map.removeLayer(circleRef.current);
            if (centerMarkerRef.current) map.removeLayer(centerMarkerRef.current);

            markerGroupRef.current = L.featureGroup(visibleMarkers).addTo(map);
            map.setView([center.lat, center.lon], zoom);

            if (hasDestinationFilter) {
                circleRef.current = L.circle([center.lat, center.lon], {
                    radius: effectiveRange * 1000,
                    color: '#f5a623',
                    fillColor: '#f5a623',
                    fillOpacity: 0.14,
                    weight: 1.5,
                }).addTo(map);
                centerMarkerRef.current = L.marker([center.lat, center.lon], { icon: makeCenterIcon() }).addTo(map);
            }

            if (visibleMarkers.length > 1) {
                map.fitBounds(markerGroupRef.current.getBounds(), { padding: [46, 46], maxZoom: 13 });
            }

            for (const listing of missing) {
                if (cancelled) break;
                const coords = await geocode(listing.location).catch(() => null);

                if (coords) {
                    cache[listing.location] = coords;
                    if (!cancelled && passes(listing, coords)) {
                        const marker = L.marker([coords.lat, coords.lon], {
                            icon: makePriceIcon(listing, listing._id === activeIdRef.current, formatListingPrice),
                        });
                        marker.on('click', () => onPickRef.current(listing));
                        markerByIdRef.current.set(listing._id, marker);
                        markerListingByIdRef.current.set(listing._id, listing);
                        markerGroupRef.current?.addLayer(marker);
                    }
                }

                await sleep(GEOCODE_DELAY_MS);
            }

            writeCoordsCache(cache);
            if (!cancelled) setIsResolving(false);
        };

        render();

        return () => {
            cancelled = true;
            setIsResolving(false);
        };
    }, [filterKey, listings, listingsKey]);

    return (
        <>
            <div ref={containerRef} className="dm-leaflet-map" />
            {isResolving && (
                <div className="dm-leaflet-status">
                    <span />
                    Координую адреси
                </div>
            )}
        </>
    );
};

export default memo(LeafletListingsMap);
