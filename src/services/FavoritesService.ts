import type { Listing } from '../components/ListingCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchFavoriteListings = async (): Promise<Listing[]> => {
    const response = await fetch(`${API_URL}/api/favorites`, {
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to fetch favorites: ${response.status}`);
    }

    return Array.isArray(data) ? data : [];
};

export const fetchFavoriteIds = async (): Promise<string[]> => {
    const response = await fetch(`${API_URL}/api/favorites/ids`, {
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to fetch favorite ids: ${response.status}`);
    }

    return Array.isArray(data?.ids) ? data.ids.filter((item: unknown): item is string => typeof item === 'string') : [];
};

export const addFavorite = async (listingId: string) => {
    const response = await fetch(`${API_URL}/api/favorites/${encodeURIComponent(listingId)}`, {
        method: 'POST',
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to add favorite: ${response.status}`);
    }

    return data;
};

export const removeFavorite = async (listingId: string) => {
    const response = await fetch(`${API_URL}/api/favorites/${encodeURIComponent(listingId)}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to remove favorite: ${response.status}`);
    }

    return data;
};

export const syncFavorites = async (listingIds: string[]): Promise<string[]> => {
    const response = await fetch(`${API_URL}/api/favorites/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingIds }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to sync favorites: ${response.status}`);
    }

    return Array.isArray(data?.ids) ? data.ids.filter((item: unknown): item is string => typeof item === 'string') : [];
};
