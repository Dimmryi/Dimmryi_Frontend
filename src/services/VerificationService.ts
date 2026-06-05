const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME || '';

export type VerificationRequestType = 'owner' | 'representative';
export type VerificationDocumentType = 'technicalPassport' | 'ownershipExtract' | 'representativeDocument';

export interface VerificationFile {
    url: string;
    publicId: string;
    resourceType: string;
    originalName: string;
}

export interface CreateVerificationRequestPayload {
    requestType: VerificationRequestType;
    documentType: VerificationDocumentType;
    files: VerificationFile[];
    comment: string;
}

interface VerificationUploadSignature {
    signature: string;
    timestamp: number;
    api_key: string;
    folder: string;
    upload_preset: string;
}

const fetchVerificationUploadSignature = async (): Promise<VerificationUploadSignature> => {
    const response = await fetch(`${API_URL}/api/cloudinary/verification-signature`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Could not sign verification upload: ${response.status}`);
    }

    return data as VerificationUploadSignature;
};

export const uploadVerificationFile = async (file: File): Promise<VerificationFile> => {
    if (!CLOUD_NAME) {
        throw new Error('Cloudinary cloud name is not configured.');
    }

    const signedUpload = await fetchVerificationUploadSignature();
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', signedUpload.api_key);
    body.append('timestamp', String(signedUpload.timestamp));
    body.append('signature', signedUpload.signature);
    body.append('upload_preset', signedUpload.upload_preset);
    body.append('folder', signedUpload.folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body,
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || 'Could not upload verification document.');
    }

    return {
        url: data.secure_url as string,
        publicId: data.public_id as string,
        resourceType: data.resource_type as string,
        originalName: file.name,
    };
};

export const createVerificationRequest = async (listingId: string, payload: CreateVerificationRequestPayload) => {
    const response = await fetch(`${API_URL}/api/listings/${encodeURIComponent(listingId)}/verification-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Verification request failed: ${response.status}`);
    }

    return data;
};
