const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME || '';
const MAX_VERIFICATION_FILES = 6;
const MAX_VERIFICATION_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_VERIFICATION_FILE_TYPES = ['application/pdf'];

export type VerificationRequestType = 'owner' | 'representative';
export type VerificationDocumentType = 'technicalPassport' | 'ownershipExtract' | 'representativeDocument';
export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected';
export type VerificationReviewDecision = 'documentsVerified' | 'representativeVerified' | 'rejected';

export interface VerificationFile {
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    originalName: string;
}

export interface CreateVerificationRequestPayload {
    requestType: VerificationRequestType;
    documentType: VerificationDocumentType;
    files: VerificationFile[];
    comment: string;
}

export interface AdminVerificationRequest {
    _id: string;
    listingId: string;
    userId: string;
    requestType: VerificationRequestType;
    documentType: VerificationDocumentType;
    files: VerificationFile[];
    comment: string;
    status: VerificationRequestStatus;
    rejectionReason?: string;
    reviewedBy?: string;
    reviewedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    listing?: Record<string, unknown> | null;
    user?: {
        _id: string;
        name?: string;
        email?: string;
        role?: string;
        subscribeType?: string;
        subscribeExpired?: string | null;
    } | null;
}

export interface ReviewVerificationRequestPayload {
    decision: VerificationReviewDecision;
    rejectionReason?: string;
}

export const getVerificationFileRulesText = (isEnglish = false) =>
    isEnglish
        ? 'Upload up to 6 files: images or PDF, up to 3 MB each.'
        : 'Завантажте до 6 файлів: зображення або PDF, до 3 МБ кожен.';

export const validateVerificationFiles = (files: File[], isEnglish = false) => {
    if (files.length > MAX_VERIFICATION_FILES) {
        return isEnglish ? 'Upload no more than 6 files.' : 'Завантажте не більше 6 файлів.';
    }

    const invalidType = files.find((file) => !file.type.startsWith('image/') && !ALLOWED_VERIFICATION_FILE_TYPES.includes(file.type));
    if (invalidType) {
        return isEnglish
            ? 'Only images and PDF files are allowed.'
            : 'Можна завантажувати лише зображення та PDF-файли.';
    }

    const oversized = files.find((file) => file.size > MAX_VERIFICATION_FILE_SIZE);
    if (oversized) {
        return isEnglish
            ? `File "${oversized.name}" is larger than 3 MB.`
            : `Файл "${oversized.name}" більший за 3 МБ.`;
    }

    return '';
};

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
        format: data.format as string,
        bytes: Number(data.bytes || 0),
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

export const fetchAdminVerificationRequests = async (status: VerificationRequestStatus | 'all' = 'pending') => {
    const search = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
    const response = await fetch(`${API_URL}/api/admin/verification-requests${search}`, {
        credentials: 'include',
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Could not load verification requests: ${response.status}`);
    }

    return data as AdminVerificationRequest[];
};

export const reviewVerificationRequest = async (requestId: string, payload: ReviewVerificationRequestPayload) => {
    const response = await fetch(`${API_URL}/api/admin/verification-requests/${encodeURIComponent(requestId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Could not review verification request: ${response.status}`);
    }

    return data;
};
