import { configureStore } from '@reduxjs/toolkit';
import tweaksReducer from './tweaksSlice';

export const store = configureStore({
    reducer: {
        tweaks: tweaksReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
