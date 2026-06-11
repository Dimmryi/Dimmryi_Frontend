const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export type PromotionRequestType = 'existing-listing-promotion' | 'new-property-shoot';
export type PromotionRequestStatus = 'new' | 'inProgress' | 'completed' | 'rejected';

export interface CreatePromotionRequestPayload {
    requestType: PromotionRequestType;
    listingId?: string | null;
}

export interface PromotionRequestCounts {
    new?: number;
    inProgress?: number;
    completed?: number;
    rejected?: number;
    [key: string]: number | undefined;
}

export interface AdminPromotionRequest {
    _id: string;
    userId: string;
    name: string;
    email: string;
    role?: string;
    subscribeType?: string;
    requestType: PromotionRequestType;
    listingId?: string;
    listingNumber?: number;
    listing?: {
        listingNumber?: number;
        listingType?: string;
        propertyType?: string;
        location?: string;
        price?: number;
        currency?: string;
    } | null;
    status: PromotionRequestStatus;
    adminNote?: string;
    reviewedBy?: string;
    reviewedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminPromotionRequestsResponse {
    items: AdminPromotionRequest[];
    total: number;
    counts: PromotionRequestCounts;
}

export interface UpdatePromotionRequestPayload {
    status: PromotionRequestStatus;
    adminNote?: string;
}

const readJson = async (response: Response) => response.json().catch(() => null);

export const createPromotionRequest = async (payload: CreatePromotionRequestPayload) => {
    const response = await fetch(`${API_URL}/api/promotion-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await readJson(response);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Promotion request failed: ${response.status}`);
    }

    return data;
};

export const fetchAdminPromotionRequests = async (
    status: PromotionRequestStatus | 'all' = 'new',
): Promise<AdminPromotionRequestsResponse> => {
    const search = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
    const response = await fetch(`${API_URL}/api/admin/promotion-requests${search}`, {
        credentials: 'include',
    });
    const data = await readJson(response);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Could not load promotion requests: ${response.status}`);
    }

    return {
        items: Array.isArray(data?.items) ? data.items : [],
        total: Number(data?.total || 0),
        counts: data?.counts || {},
    };
};

export const updatePromotionRequest = async (requestId: string, payload: UpdatePromotionRequestPayload) => {
    const response = await fetch(`${API_URL}/api/admin/promotion-requests/${encodeURIComponent(requestId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await readJson(response);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Could not update promotion request: ${response.status}`);
    }

    return data;
};
