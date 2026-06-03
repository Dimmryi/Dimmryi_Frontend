export interface Agent {
    _id: string;
    userId?: string;
    name: string;
    jobTitle: string;
    email: string;
    image: string | string[];
    saleVolume?: string;
    totalDeal?: string;
    rating?: string;
    license?: string;
    phone?: string;
    date?: string;
    isActive?: boolean;
    status?: 'active' | 'hidden';
    createdAt?: string;
    updatedAt?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export type AgentPayload = {
    image: string[];
    name: string;
    jobTitle: string;
    email: string;
    saleVolume?: string;
    totalDeal?: string;
    rating?: string;
    license?: string;
    phone?: string;
    date?: string;
};

export const fetchAgents = async (): Promise<Agent[]> => {
    const response = await fetch(`${API_URL}/agents`, {
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to fetch agents: ${response.status}`);
    }

    return Array.isArray(data) ? data : [];
};

export const getAgentImage = (image: Agent['image']) => {
    if (Array.isArray(image)) {
        return image.find((item) => typeof item === 'string' && item.trim().length > 0) || '';
    }

    return typeof image === 'string' ? image : '';
};

export const fetchMyAgent = async (): Promise<Agent | null> => {
    const response = await fetch(`${API_URL}/api/my-agent`, {
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to fetch agent profile: ${response.status}`);
    }

    return data?.agent || null;
};

export const createMyAgent = async (payload: AgentPayload): Promise<Agent> => {
    const response = await fetch(`${API_URL}/api/my-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to create agent profile: ${response.status}`);
    }

    return data.agent;
};

export const updateMyAgent = async (payload: AgentPayload): Promise<Agent> => {
    const response = await fetch(`${API_URL}/api/my-agent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to update agent profile: ${response.status}`);
    }

    return data.agent;
};

export const hideMyAgent = async (): Promise<Agent> => {
    const response = await fetch(`${API_URL}/api/my-agent`, {
        method: 'DELETE',
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to hide agent profile: ${response.status}`);
    }

    return data.agent;
};
