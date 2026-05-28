import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TweakValues } from '../types';

interface TweaksState {
    values: TweakValues;
}

const initialState: TweaksState = {
    values: {
        accent: '#f5a623',
        bg: '#0a1322',
        fontDisplay: 'Unbounded',
        showHero: true,
    },
};

const tweaksSlice = createSlice({
    name: 'tweaks',
    initialState,
    reducers: {
        setTweak: (state, action: PayloadAction<Partial<TweakValues>>) => {
            state.values = { ...state.values, ...action.payload };
        },
        resetTweaks: (state) => {
            state.values = initialState.values;
        },
    },
});

export const { setTweak, resetTweaks } = tweaksSlice.actions;
export default tweaksSlice.reducer;
