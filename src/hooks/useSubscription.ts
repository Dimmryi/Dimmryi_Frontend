import { useAppSelector } from '../app/hooks';

export const useSubscription = () => {
    const subscribeType = useAppSelector((state) => state.registration.subscribeType);
    const subscribeExpired = useAppSelector((state) => state.registration.subscribeExpired);
    const role = useAppSelector((state) => state.registration.role);

    const isAdmin = role === 'admin';

    const isActive =
        subscribeType !== 'Free' &&
        (subscribeExpired === null || new Date(subscribeExpired) > new Date());

    const canUseStandard = isAdmin || isActive;
    const canUsePremium = isAdmin || (isActive && subscribeType === 'Premium');

    return { subscribeType, subscribeExpired, isActive, isAdmin, canUseStandard, canUsePremium };
};
