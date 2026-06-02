const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchListings = async () => {
    const response = await fetch(`${API_URL}/listings`);
    return response.json();
};

export const addListing = async (listingData: Record<string, unknown>) => {
    const response = await fetch(`${API_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(listingData),
    });
    return response.json();
};

export const addListingWithComparison = async (listingData: Record<string, unknown>) => {
    try {
        const response = await fetch(`${API_URL}/api/listingsWithComparison`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(listingData),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.message || data?.error || `Failed to add listing: ${response.status}`);
        }
        if (data?.success === false || data?.error) {
            throw new Error(data.message || data.error || 'Failed to add listing.');
        }
        return data;
    } catch (error) {
        console.error('Added Listing error:', error);
        throw error;
    }
};

export const fetchListingById = async (listingId: string) => {
    const response = await fetch(`${API_URL}/api/listings/${encodeURIComponent(listingId)}`, {
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to fetch listing: ${response.status}`);
    }

    return Array.isArray(data) ? data[0] : data;
};

export const updateListing = async (listingId: string, listingData: Record<string, unknown>) => {
    const response = await fetch(`${API_URL}/api/listing/${encodeURIComponent(listingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(listingData),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to update listing: ${response.status}`);
    }

    return data;
};

export const handleDeleteListingByUserName = async (userName: string) => {
    try {
        const response = await fetch(`${API_URL}/api/listings/owner/${encodeURIComponent(userName)}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Delete listings failed: ${errorText}`);
        }
        return (prev: { owner: string }[]) => prev.filter((l) => l.owner !== userName);
    } catch (error) {
        console.error('Deletion error:', error);
        throw error;
    }
};

export const handleDeleteUserDataByUserName = async (userName: string) => {
    try {
        const response = await fetch(`${API_URL}/api/users/name/${userName}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`Failed to delete User data: ${msg}`);
        throw error;
    }
};
