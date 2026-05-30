import { useLanguage } from '../LanguageProvider';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthProperty, resetAuthProperty, setAuthChecking } from '../features/auth/authSlice';
import {
    normalizeSubscribeType,
    setIsRegistration,
    setUserName,
    setUserId,
    setRole,
    setSubscribeType,
    setSubscribeExpired,
} from '../features/registration/registrationSlice';
import type { RootState } from '../store/store';

export const Nav = () => {
    const { language, setLanguage, translate } = useLanguage();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const links = [
        { label: translate('nav.buy'), to: '/listings?listingType=sale' },
        { label: translate('nav.rent'), to: '/listings?listingType=rent' },
        { label: translate('nav.services') || 'Послуги', to: '/services' },
        { label: translate('nav.agents'), to: '/agents' },
        { label: translate('nav.about'), to: '/about' },
    ];
    const dispatch = useDispatch();
    const { checkAuth, handleResetUserData } = useAuth();
    const isRegistered = useSelector((state: RootState) => state.registration.isRegistered);
    const userName = useSelector((state: RootState) => state.registration.userName);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isLogin);
    const sessionExpiry = Number(localStorage.getItem('sessionExpiry') || 0);
    const isSessionAlive = isAuthenticated && sessionExpiry > Date.now();

    const authCta = useMemo(() => {
        if (isRegistered && isSessionAlive) {
            return {
                label: translate('nav.profile') || 'Мій профіль',
                to: '/my-listings',
                mode: 'profile',
            };
        }

        if (isRegistered && !isSessionAlive) {
            return {
                label: translate('nav.login'),
                to: '/login',
                mode: 'login',
            };
        }

        return {
            label: translate('nav.register') || 'Зареєструватись',
            to: '/registration',
            mode: 'register',
        };
    }, [isRegistered, isSessionAlive, translate]);

    useEffect(() => {
        checkAuth().then(({ isAuthenticated: serverAuth, user, expiresAt }) => {
            if (serverAuth && user) {
                if (expiresAt) {
                    localStorage.setItem('sessionExpiry', String(new Date(expiresAt).getTime()));
                }
                dispatch(setAuthProperty(true));
                dispatch(setIsRegistration(true));
                dispatch(setUserName(user.name));
                dispatch(setUserId(user.id));
                dispatch(setRole(user.role === 'admin' ? 'admin' : 'user'));
                if (user.subscribeType !== undefined) {
                    dispatch(setSubscribeType(normalizeSubscribeType(user.subscribeType)));
                    dispatch(setSubscribeExpired(user.subscribeExpired ?? null));
                }
            } else {
                dispatch(resetAuthProperty());
            }
            dispatch(setAuthChecking(false));
        });
        // Auth status is intentionally refreshed once per Nav mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = async () => {
        await handleResetUserData();
        setIsProfileOpen(false);
    };

    return (
        <nav className="dm-nav">
            <div className="dm-nav__brand">
                <div className="dm-nav__logo" aria-hidden>
                    <svg viewBox="0 0 32 32" width="28" height="28">
                        <path
                            d="M5 16 L16 6 L27 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                        />
                        <rect
                            x="8"
                            y="14"
                            width="16"
                            height="12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <circle cx="22" cy="11" r="2.4" fill="var(--accent)" />
                    </svg>
                </div>
                <div className="dm-nav__brand-text">
                    <div className="dm-nav__brand-name">Дім&nbsp;мрії</div>
                    <div className="dm-nav__brand-sub">est. 2024 · Україна</div>
                </div>
            </div>
            <ul className="dm-nav__links">
                {links.map((link) => (
                    <li key={link.to}>
                        <Link to={link.to}>{link.label}</Link>
                    </li>
                ))}
            </ul>
            <div className="dm-nav__cta">
                <button
                    className="dm-lang"
                    onClick={() => setLanguage(language === 'uk' ? 'en' : 'uk')}
                    aria-label={translate('nav.languageSwitch')}
                >
                    {translate('nav.languageSwitch')}
                </button>
                {authCta.mode === 'profile' ? (
                    <div className="dm-profile-menu">
                        <button
                            className="dm-btn dm-btn--ghost"
                            onClick={() => setIsProfileOpen((value) => !value)}
                            aria-expanded={isProfileOpen}
                            aria-haspopup="menu"
                        >
                            {authCta.label}
                        </button>
                        {isProfileOpen && (
                            <div className="dm-profile-menu__panel" role="menu">
                                <div className="dm-profile-menu__user">{userName || authCta.label}</div>
                                <Link to="/my-listings" onClick={() => setIsProfileOpen(false)}>MyListings</Link>
                                <Link to="/my-comments" onClick={() => setIsProfileOpen(false)}>MyComments</Link>
                                <Link to="/my-notifications" onClick={() => setIsProfileOpen(false)}>MyNotification</Link>
                                <button onClick={handleLogout}>LogOut</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link className="dm-btn dm-btn--ghost" to={authCta.to}>{authCta.label}</Link>
                )}
                <button className="dm-btn dm-btn--accent">{translate('nav.post')}</button>
            </div>
        </nav>
    );
};
