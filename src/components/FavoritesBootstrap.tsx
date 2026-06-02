import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { readStoredFavoriteIds, setFavoriteIds } from '../features/favorites/favoritesSlice';
import { syncFavorites } from '../services/FavoritesService';

export const FavoritesBootstrap = () => {
    const dispatch = useAppDispatch();
    const isRegistered = useAppSelector((state) => state.registration.isRegistered);

    useEffect(() => {
        let cancelled = false;
        const storedIds = readStoredFavoriteIds();

        if (!isRegistered) {
            dispatch(setFavoriteIds(storedIds));
            return () => {
                cancelled = true;
            };
        }

        syncFavorites(storedIds)
            .then((ids) => {
                if (!cancelled) dispatch(setFavoriteIds(ids));
            })
            .catch(() => {
                if (!cancelled) dispatch(setFavoriteIds(storedIds));
            });

        return () => {
            cancelled = true;
        };
    }, [dispatch, isRegistered]);

    return null;
};
