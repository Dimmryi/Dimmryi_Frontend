import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const FAVORITES_STORAGE_KEY = 'favoriteListings';

export interface FavoritesState {
    ids: string[];
    isReady: boolean;
}

export const readStoredFavoriteIds = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
        return [];
    }
};

export const writeStoredFavoriteIds = (ids: string[]) => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
};

const initialState: FavoritesState = {
    ids: readStoredFavoriteIds(),
    isReady: false,
};

const favoritesSlice = createSlice({
    name: 'favorites',
    initialState,
    reducers: {
        setFavoriteIds: (state, action: PayloadAction<string[]>) => {
            state.ids = Array.from(new Set(action.payload));
            state.isReady = true;
            writeStoredFavoriteIds(state.ids);
        },
        addFavoriteId: (state, action: PayloadAction<string>) => {
            if (!state.ids.includes(action.payload)) {
                state.ids.push(action.payload);
                writeStoredFavoriteIds(state.ids);
            }
        },
        removeFavoriteId: (state, action: PayloadAction<string>) => {
            state.ids = state.ids.filter((id) => id !== action.payload);
            writeStoredFavoriteIds(state.ids);
        },
        resetFavorites: (state) => {
            state.ids = [];
            state.isReady = true;
            writeStoredFavoriteIds([]);
        },
    },
});

export const { addFavoriteId, removeFavoriteId, resetFavorites, setFavoriteIds } = favoritesSlice.actions;
export default favoritesSlice.reducer;
