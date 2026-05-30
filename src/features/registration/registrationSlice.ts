import { createSlice, PayloadAction, Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../../store/store';

export type UserRole = 'admin' | 'user' | null;
export type SubscribeType = 'Free' | 'Standard' | 'Premium';

export const normalizeSubscribeType = (raw?: string): SubscribeType => {
    if (!raw) return 'Free';
    const lower = raw.toLowerCase();
    if (lower === 'standard') return 'Standard';
    if (lower === 'premium') return 'Premium';
    return 'Free';
};

export interface IRegistrationState {
    isRegistered: boolean;
    userName: string;
    userId: string;
    role: UserRole;
    subscribeType: SubscribeType;
    subscribeExpired: string | null;
}

const loadState = (): IRegistrationState => {
    try {
        const serializedState = localStorage.getItem('registrationState');
        if (!serializedState) {
            return {
                isRegistered: false,
                userName: '',
                userId: '',
                role: null,
                subscribeType: 'Free',
                subscribeExpired: null,
            };
        }

        const parsed = JSON.parse(serializedState);
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'isRegistered' in parsed &&
            'userName' in parsed &&
            'userId' in parsed &&
            typeof parsed.isRegistered === 'boolean' &&
            typeof parsed.userName === 'string' &&
            typeof parsed.userId === 'string'
        ) {
            return {
                ...parsed,
                role: parsed.role === 'admin' || parsed.role === 'user' ? parsed.role : null,
                subscribeType: normalizeSubscribeType(parsed.subscribeType),
                subscribeExpired: typeof parsed.subscribeExpired === 'string' ? parsed.subscribeExpired : null,
            };
        }

        return {
            isRegistered: false,
            userName: '',
            userId: '',
            role: null,
            subscribeType: 'Free',
            subscribeExpired: null,
        };
    } catch (e) {
        console.warn('Failed to load registration state:', e);
        return {
            isRegistered: false,
            userName: '',
            userId: '',
            role: null,
            subscribeType: 'Free',
            subscribeExpired: null,
        };
    }
};

const initialState: IRegistrationState = loadState();

export const registrationSlice = createSlice({
    name: 'registration',
    initialState,
    reducers: {
        setIsRegistration: (state, action: PayloadAction<boolean>) => {
            state.isRegistered = action.payload;
        },
        setUserName: (state, action: PayloadAction<string>) => {
            state.userName = action.payload;
        },
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
        },
        setRole: (state, action: PayloadAction<UserRole>) => {
            state.role = action.payload;
        },
        setSubscribeType: (state, action: PayloadAction<SubscribeType>) => {
            state.subscribeType = action.payload;
        },
        setSubscribeExpired: (state, action: PayloadAction<string | null>) => {
            state.subscribeExpired = action.payload;
        },
        resetRegistration: (state) => {
            state.isRegistered = false;
            state.userName = '';
            state.userId = '';
            state.role = null;
            state.subscribeType = 'Free';
            state.subscribeExpired = null;
        },
    },
});

export const registrationMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);
    const act = action as { type?: string };
    if (act.type?.startsWith('registration/')) {
        const state = store.getState().registration;
        localStorage.setItem('registrationState', JSON.stringify(state));
    }
    return result;
};

export const {
    setIsRegistration,
    setUserName,
    setUserId,
    setRole,
    setSubscribeType,
    setSubscribeExpired,
    resetRegistration,
} = registrationSlice.actions;
export const selectName = (state: RootState) => state.registration.userName;
export default registrationSlice.reducer;
