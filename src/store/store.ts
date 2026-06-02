import { configureStore } from '@reduxjs/toolkit';
import tweaksReducer from './tweaksSlice';
import authReducer from '../features/auth/authSlice';
import registrationReducer, { registrationMiddleware } from '../features/registration/registrationSlice';
import counterReducer from '../features/counter/counterSlice';
import upLoadImagesReducer from '../features/upLoadImages/upLoadImagesSlice';
import filterReducer from '../features/filter/filterSlice';
import filterMapReducer from '../features/filterMap/filterMapSlice';
import scrollReducer from '../features/scroll/scrollSlice';
import notificationReducer from '../features/notification/notificationSlice';
import favoritesReducer from '../features/favorites/favoritesSlice';

export const store = configureStore({
    reducer: {
        tweaks: tweaksReducer,
        auth: authReducer,
        registration: registrationReducer,
        counter: counterReducer,
        upLoadImages: upLoadImagesReducer,
        filter: filterReducer,
        filterMap: filterMapReducer,
        scroll: scrollReducer,
        notification: notificationReducer,
        favorites: favoritesReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(registrationMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
