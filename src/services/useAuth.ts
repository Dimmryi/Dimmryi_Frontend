import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    setIsRegistration,
    setUserName,
    setUserId,
    setRole,
    setSubscribeType,
    setSubscribeExpired,
    resetRegistration,
    normalizeSubscribeType,
} from '../features/registration/registrationSlice';
import type { SubscribeType } from '../features/registration/registrationSlice';
import { setAuthProperty, resetAuthProperty, setAuthChecking } from '../features/auth/authSlice';
import { fetchListings } from './ListingService';
import { RootState } from '../store/store';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role?: string;
    authMethod?: string;
    subscribeType?: string;      // undefined якщо бекенд не повернув поле
    subscribeExpired?: string | null;
}

interface AuthSuccessData {
    user: AuthUser;
    message?: string;
    expiresAt?: string;
}

export const useAuth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const userId = useSelector((state: RootState) => state.registration.userId);

    const handleAuthSuccess = (data: AuthSuccessData, redirectTo: string = '/') => {
        const { user } = data;

        const SESSION_DAYS = 7;
        const sessionExpiry = data.expiresAt
            ? new Date(data.expiresAt).getTime()
            : Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem('sessionExpiry', String(sessionExpiry));
        localStorage.setItem('user', JSON.stringify(user));

        const role = user.role === 'admin' ? 'admin' : 'user';
        const subscribeType: SubscribeType = normalizeSubscribeType(user.subscribeType);
        const subscribeExpired = user.subscribeExpired ?? null;

        localStorage.setItem('registrationState', JSON.stringify({
            isRegistered: true,
            userName: user.name,
            userId: user.id,
            role,
            subscribeType,
            subscribeExpired,
        }));

        dispatch(setIsRegistration(true));
        dispatch(setUserName(user.name));
        dispatch(setUserId(user.id));
        dispatch(setRole(role));
        dispatch(setSubscribeType(subscribeType));
        dispatch(setSubscribeExpired(subscribeExpired));
        dispatch(setAuthProperty(true));

        setTimeout(() => navigate(redirectTo), 1500);
    };

    interface ListingItem { image: string[];[key: string]: unknown }
    const handleFullLogout = async (setListings: (data: ListingItem[]) => void, setMessage: (msg: string) => void) => {
        if (!confirm('Confirm continue deleting data!')) return;

        try {
            const listingsResponse = await fetch(
                `${API_URL}/api/listings/ownerId/${encodeURIComponent(userId)}`,
                { credentials: 'include' }
            );
            if (!listingsResponse.ok) throw new Error(await listingsResponse.text());
            const userListings = await listingsResponse.json();

            if (userListings.length > 0) {
                await fetch(`${API_URL}/listings/ownerId/${encodeURIComponent(userId)}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                const allImages: string[] = userListings.flatMap((l: ListingItem) => l.image);
                const cloudName = import.meta.env.VITE_CLOUD_NAME || 'dndnmla09';
                await Promise.all(
                    allImages.map(async (url) => {
                        if (!url) return;
                        const publicId = url.split('/').pop()?.split('.')[0];
                        if (!publicId) return;
                        const sigRes = await fetch(`${API_URL}/generate-signature`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ public_id: publicId, timestamp: Math.floor(Date.now() / 1000) }),
                        });
                        const sig = await sigRes.json();
                        await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ public_id: publicId, api_key: sig.api_key, timestamp: sig.timestamp, signature: sig.signature }),
                        });
                    })
                );
            }

            await fetch(`${API_URL}/api/comments/author/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const logoutRes = await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (!logoutRes.ok) throw new Error(await logoutRes.text());

            dispatch(resetRegistration());
            dispatch(resetAuthProperty());
            localStorage.removeItem('user');
            localStorage.removeItem('registrationState');
            localStorage.removeItem('userImages');
            localStorage.removeItem('sessionExpiry');

            const freshData = await fetchListings();
            setListings(freshData);
        } catch (error: unknown) {
            setMessage(`Logout error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleResetUserData = async (setListings?: (data: ListingItem[]) => void) => {
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // clear locally anyway
        }
        localStorage.removeItem('registrationState');
        localStorage.removeItem('userImages');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionExpiry');
        dispatch(resetRegistration());
        dispatch(resetAuthProperty());
        dispatch(setAuthChecking(false));
        if (setListings) {
            const freshData = await fetchListings();
            setListings(freshData);
        }
    };

    const checkAuth = async (): Promise<{ isAuthenticated: boolean; user?: AuthUser; expiresAt?: string }> => {
        try {
            const response = await fetch(`${API_URL}/check-auth`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (data.isAuthenticated && data.user) {
                if (data.expiresAt) {
                    localStorage.setItem('sessionExpiry', String(new Date(data.expiresAt).getTime()));
                }
                return {
                    isAuthenticated: true,
                    expiresAt: data.expiresAt,
                    user: {
                        id: data.id,
                        name: data.user,
                        email: data.email ?? '',
                        role: data.role,
                        subscribeType: normalizeSubscribeType(data.subscribeType),
                        subscribeExpired: data.subscribeExpired ?? null,
                    },
                };
            }
            return { isAuthenticated: false };
        } catch {
            return { isAuthenticated: false };
        }
    };

    return { handleAuthSuccess, handleFullLogout, handleResetUserData, checkAuth, API_URL };
};
