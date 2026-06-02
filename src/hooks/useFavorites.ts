import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addFavorite, removeFavorite } from '../services/FavoritesService';
import { addFavoriteId, removeFavoriteId } from '../features/favorites/favoritesSlice';

export const useFavorites = () => {
    const dispatch = useAppDispatch();
    const favoriteIds = useAppSelector((state) => state.favorites.ids);
    const isRegistered = useAppSelector((state) => state.registration.isRegistered);

    const isFavorite = useCallback((listingId?: string) => Boolean(listingId && favoriteIds.includes(listingId)), [favoriteIds]);

    const toggleFavorite = useCallback(
        async (listingId?: string) => {
            if (!listingId) return;
            const wasFavorite = favoriteIds.includes(listingId);

            if (wasFavorite) {
                dispatch(removeFavoriteId(listingId));
            } else {
                dispatch(addFavoriteId(listingId));
            }

            if (!isRegistered) return;

            try {
                if (wasFavorite) {
                    await removeFavorite(listingId);
                } else {
                    await addFavorite(listingId);
                }
            } catch {
                if (wasFavorite) {
                    dispatch(addFavoriteId(listingId));
                } else {
                    dispatch(removeFavoriteId(listingId));
                }
            }
        },
        [dispatch, favoriteIds, isRegistered],
    );

    return { favoriteIds, isFavorite, toggleFavorite };
};
