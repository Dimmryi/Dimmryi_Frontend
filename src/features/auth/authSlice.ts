import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IAuthState {
    isLogin: boolean;
    isChecking: boolean;
}

const sessionExpiry = Number(localStorage.getItem('sessionExpiry') || 0);
const isSessionValid = sessionExpiry > Date.now();

const initialState: IAuthState = {
    isLogin: isSessionValid,
    isChecking: !isSessionValid,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthProperty: (state, action: PayloadAction<boolean>) => {
            state.isLogin = action.payload;
        },
        setAuthChecking: (state, action: PayloadAction<boolean>) => {
            state.isChecking = action.payload;
        },
        resetAuthProperty: () => ({ isLogin: false, isChecking: false }),
    },
});

export const { setAuthProperty, setAuthChecking, resetAuthProperty } = authSlice.actions;
export default authSlice.reducer;
