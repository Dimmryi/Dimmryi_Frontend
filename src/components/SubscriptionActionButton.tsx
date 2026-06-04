import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSubscribeExpired, setSubscribeType } from '../features/registration/registrationSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useAuth } from '../services/useAuth';
import { normalizeSubscribeType } from '../features/registration/registrationSlice';

type Plan = 'free' | 'standard' | 'premium';

interface SubscriptionActionButtonProps {
    plan: Plan;
    label: string;
    activeLabel: string;
    className?: string;
}

type PaymentResponse = {
    subscribeType?: string;
    subscribeExpired?: string | null;
    error?: string;
};

export const SubscriptionActionButton = ({ plan, label, activeLabel, className }: SubscriptionActionButtonProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { checkAuth, API_URL } = useAuth();
    const isRegistered = useAppSelector((state) => state.registration.isRegistered);
    const isAuthenticated = useAppSelector((state) => state.auth.isLogin);
    const sessionExpiry = Number(localStorage.getItem('sessionExpiry') || 0);
    const isSessionAlive = isAuthenticated && sessionExpiry > Date.now();

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const refreshSubscriptionState = async (fallback?: PaymentResponse) => {
        const auth = await checkAuth();
        const user = auth.user;
        const subscribeType = normalizeSubscribeType(user?.subscribeType || fallback?.subscribeType);
        const subscribeExpired = user?.subscribeExpired ?? fallback?.subscribeExpired ?? null;

        dispatch(setSubscribeType(subscribeType));
        dispatch(setSubscribeExpired(subscribeExpired));
    };

    const handleSubscription = async () => {
        if (!isRegistered || !isSessionAlive) {
            navigate('/login', {
                state: {
                    notice: 'Увійдіть, щоб змінити тариф.',
                    from: '/subscription',
                },
            });
            return;
        }

        if (status === 'loading') return;

        try {
            setStatus('loading');
            setMessage('');

            let payload: Record<string, unknown>;
            if (plan === 'free') {
                payload = { plan: 'Free', amount: 0 };
            } else {
                const paramsResponse = await fetch(`${API_URL}/api/liqpay-params?plan=${plan}`, {
                    credentials: 'include',
                });
                const liqpayParams = await paramsResponse.json();
                if (!paramsResponse.ok) {
                    throw new Error(liqpayParams?.error || 'Не вдалося підготувати параметри оплати.');
                }
                payload = {
                    data: liqpayParams.data,
                    signature: liqpayParams.signature,
                };
            }

            const payResponse = await fetch(`${API_URL}/api/subscribe/pay`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = (await payResponse.json().catch(() => ({}))) as PaymentResponse;

            if (!payResponse.ok) {
                throw new Error(data.error || 'Не вдалося оновити тариф.');
            }

            await refreshSubscriptionState(data);
            setStatus('success');
            setMessage(plan === 'free' ? 'Ви перейшли на базовий тариф.' : activeLabel);
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Помилка зміни тарифу.');
        }
    };

    return (
        <div className="dm-subscription-action">
            <button className={className || 'dm-btn dm-btn--accent'} type="button" onClick={handleSubscription} disabled={status === 'loading'}>
                {status === 'loading' ? 'Оновлюємо...' : label}
            </button>
            {message && <p className={`dm-subscription-action__msg is-${status}`}>{message}</p>}
        </div>
    );
};
