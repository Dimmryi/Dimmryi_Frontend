import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../LanguageProvider';
import { useAuth } from '../services/useAuth';
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

type IconName =
    | 'menu'
    | 'close'
    | 'home'
    | 'search'
    | 'map'
    | 'services'
    | 'user'
    | 'plus'
    | 'heart'
    | 'bell'
    | 'message'
    | 'logout'
    | 'globe'
    | 'chevron';

const CREATE_LISTING_PATH = '/listings/new';

const NavIcon = ({ name }: { name: IconName }) => {
    const common = {
        width: 18,
        height: 18,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.9,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true,
    };

    const paths: Record<IconName, ReactNode> = {
        menu: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>,
        close: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
        home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10.5V21h13V10.5" /><path d="M9.5 21v-6h5v6" /></>,
        search: <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>,
        map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15" /><path d="M15 6v15" /></>,
        services: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
        user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />,
        bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
        message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />,
        logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></>,
        globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></>,
        chevron: <path d="m6 9 6 6 6-6" />,
    };

    return <svg {...common}>{paths[name]}</svg>;
};

export const Nav = () => {
    const { language, setLanguage, translate } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { checkAuth, handleResetUserData } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [sessionExpiry, setSessionExpiry] = useState(() => Number(localStorage.getItem('sessionExpiry') || 0));

    const isRegistered = useSelector((state: RootState) => state.registration.isRegistered);
    const userName = useSelector((state: RootState) => state.registration.userName);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isLogin);
    const isSessionAlive = isAuthenticated && sessionExpiry > Date.now();

    const primaryLinks = useMemo(
        () => [
            { label: translate('nav.buy'), to: '/listings?listingType=sale', icon: 'home' as const },
            { label: translate('nav.rent'), to: '/listings?listingType=rent', icon: 'search' as const },
            { label: 'Мапа', to: '#map', icon: 'map' as const },
        ],
        [translate],
    );

    const serviceLinks = [
        { label: 'Усі сервіси', to: '/services', icon: 'services' as const },
        { label: 'Рієлтори', to: '/agents', icon: 'user' as const },
        { label: 'AI-оцінка', to: '/real-estate-estimator', icon: 'search' as const },
        { label: 'Сповіщення', to: '/notification', icon: 'bell' as const },
        { label: 'Договір', to: '/agreement', icon: 'message' as const },
    ];

    const accountLinks = [
        { label: 'Обране', to: '/favorites', icon: 'heart' as const },
        { label: 'Мій профіль рієлтора', to: '/my-agent', icon: 'user' as const },
        { label: 'Мої оголошення', to: '/my-listings', icon: 'home' as const },
        { label: 'Мої коментарі', to: '/my-comments', icon: 'message' as const },
        { label: 'Мої сповіщення', to: '/my-notifications', icon: 'bell' as const },
    ];

    const authCta = useMemo(() => {
        if (isRegistered && isSessionAlive) {
            return { label: translate('nav.profile') || 'Мій профіль', to: '/my-listings', mode: 'profile' };
        }

        if (isRegistered && !isSessionAlive) {
            return { label: translate('nav.login'), to: '/login', mode: 'login' };
        }

        return { label: translate('nav.register') || 'Зареєструватись', to: '/registration', mode: 'register' };
    }, [isRegistered, isSessionAlive, translate]);

    const postLabel = (translate('nav.post') || 'Розмістити').replace(/^\s*\+\s*/, '');

    useEffect(() => {
        checkAuth().then(({ isAuthenticated: serverAuth, user, expiresAt }) => {
            if (serverAuth && user) {
                const nextExpiry = expiresAt ? new Date(expiresAt).getTime() : Number(localStorage.getItem('sessionExpiry') || 0);
                if (nextExpiry) {
                    localStorage.setItem('sessionExpiry', String(nextExpiry));
                    setSessionExpiry(nextExpiry);
                }
                localStorage.setItem('user', JSON.stringify(user));
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
                setSessionExpiry(Number(localStorage.getItem('sessionExpiry') || 0));
            }
            dispatch(setAuthChecking(false));
        });
        // Auth status is intentionally refreshed once per Nav mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMobileOpen(false);
                setIsProfileOpen(false);
                setIsServicesOpen(false);
            }
        };

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, []);

    useEffect(() => {
        document.body.classList.toggle('dm-nav-lock', isMobileOpen);
        return () => document.body.classList.remove('dm-nav-lock');
    }, [isMobileOpen]);

    const closeMenus = () => {
        setIsMobileOpen(false);
        setIsProfileOpen(false);
        setIsServicesOpen(false);
    };

    const handleMapNavigate = () => {
        closeMenus();
        navigate('/');
        window.setTimeout(() => {
            document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    };

    const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
        closeMenus();
        if (location.pathname === '/') {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleLogout = async () => {
        await handleResetUserData();
        closeMenus();
    };

    const handlePostListing = () => {
        closeMenus();

        if (!isRegistered) {
            navigate('/registration', {
                state: {
                    notice: 'Вам потрібно зареєструватись, щоб розмістити оголошення.',
                    from: CREATE_LISTING_PATH,
                },
            });
            return;
        }

        if (!isSessionAlive) {
            navigate('/login', {
                state: {
                    notice: 'Вам потрібно увійти, щоб розмістити оголошення.',
                    from: CREATE_LISTING_PATH,
                },
            });
            return;
        }

        navigate(CREATE_LISTING_PATH);
    };

    const renderPrimaryItem = (link: (typeof primaryLinks)[number]) => (
        <li key={link.to}>
            {link.to === '#map' ? (
                <button type="button" onClick={handleMapNavigate}>
                    <NavIcon name={link.icon} />
                    {link.label}
                </button>
            ) : (
                <NavLink to={link.to}>
                    <NavIcon name={link.icon} />
                    {link.label}
                </NavLink>
            )}
        </li>
    );

    const renderMobilePrimaryItem = (link: (typeof primaryLinks)[number]) =>
        link.to === '#map' ? (
            <button key={link.to} type="button" onClick={handleMapNavigate}>
                <NavIcon name={link.icon} />
                {link.label}
            </button>
        ) : (
            <NavLink key={link.to} to={link.to} onClick={closeMenus}>
                <NavIcon name={link.icon} />
                {link.label}
            </NavLink>
        );

    const renderProfileMenu = (isMobile = false) => {
        if (authCta.mode !== 'profile') {
            return (
                <Link className={isMobile ? 'dm-mobile-menu__auth' : 'dm-btn dm-btn--ghost'} to={authCta.to} onClick={closeMenus}>
                    <NavIcon name="user" />
                    {authCta.label}
                </Link>
            );
        }

        if (isMobile) {
            return (
                <div className="dm-mobile-menu__group">
                    <div className="dm-mobile-menu__label">{userName || authCta.label}</div>
                    {accountLinks.map((link) => (
                        <NavLink key={link.to} to={link.to} onClick={closeMenus}>
                            <NavIcon name={link.icon} />
                            {link.label}
                        </NavLink>
                    ))}
                    <button type="button" onClick={handleLogout}>
                        <NavIcon name="logout" />
                        Вийти
                    </button>
                </div>
            );
        }

        return (
            <div className="dm-profile-menu">
                <button
                    className="dm-btn dm-btn--ghost"
                    onClick={() => setIsProfileOpen((value) => !value)}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="menu"
                    type="button"
                >
                    <NavIcon name="user" />
                    {authCta.label}
                    <NavIcon name="chevron" />
                </button>
                {isProfileOpen && (
                    <div className="dm-profile-menu__panel" role="menu">
                        <div className="dm-profile-menu__user">{userName || authCta.label}</div>
                        {accountLinks.map((link) => (
                            <Link key={link.to} to={link.to} onClick={closeMenus}>
                                <NavIcon name={link.icon} />
                                {link.label}
                            </Link>
                        ))}
                        <button onClick={handleLogout} type="button">
                            <NavIcon name="logout" />
                            Вийти
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <nav className="dm-nav">
            <Link className="dm-nav__brand" to="/" onClick={handleBrandClick}>
                <div className="dm-nav__logo" aria-hidden>
                    <svg viewBox="0 0 32 32" width="28" height="28">
                        <path d="M5 16 L16 6 L27 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <rect x="8" y="14" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
                        <circle cx="22" cy="11" r="2.4" fill="var(--accent)" />
                    </svg>
                </div>
                <div className="dm-nav__brand-text">
                    <div className="dm-nav__brand-name">Дім&nbsp;мрії</div>
                    <div className="dm-nav__brand-sub">est. 2024 · Україна</div>
                </div>
            </Link>

            <ul className="dm-nav__links" aria-label="Primary navigation">
                {primaryLinks.map(renderPrimaryItem)}
                <li className="dm-nav-services">
                    <button
                        type="button"
                        onClick={() => setIsServicesOpen((value) => !value)}
                        aria-expanded={isServicesOpen}
                        aria-haspopup="menu"
                    >
                        <NavIcon name="services" />
                        {translate('nav.services') || 'Послуги'}
                        <NavIcon name="chevron" />
                    </button>
                    {isServicesOpen && (
                        <div className="dm-nav-services__panel" role="menu">
                            {serviceLinks.map((link) => (
                                <Link key={link.to} to={link.to} onClick={closeMenus}>
                                    <NavIcon name={link.icon} />
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </li>
            </ul>

            <div className="dm-nav__cta">
                <button
                    className="dm-lang"
                    onClick={() => setLanguage(language === 'uk' ? 'en' : 'uk')}
                    aria-label={translate('nav.languageSwitch')}
                    type="button"
                >
                    <NavIcon name="globe" />
                    {language === 'uk' ? 'EN' : 'UA'}
                </button>
                {renderProfileMenu()}
                <button className="dm-btn dm-btn--accent dm-nav__post" type="button" onClick={handlePostListing}>
                    <NavIcon name="plus" />
                    {postLabel}
                </button>
            </div>

            <div className="dm-nav__mobile-actions">
                <button className="dm-nav__mobile-post" type="button" onClick={handlePostListing} aria-label="Розмістити оголошення">
                    <NavIcon name="plus" />
                </button>
                <button
                    className="dm-nav__menu-btn"
                    type="button"
                    onClick={() => setIsMobileOpen((value) => !value)}
                    aria-expanded={isMobileOpen}
                    aria-controls="dm-mobile-menu"
                    aria-label={isMobileOpen ? 'Закрити меню' : 'Відкрити меню'}
                >
                    <NavIcon name={isMobileOpen ? 'close' : 'menu'} />
                </button>
            </div>

            {isMobileOpen && <button className="dm-mobile-menu__scrim" type="button" aria-label="Закрити меню" onClick={closeMenus} />}

            <aside id="dm-mobile-menu" className={'dm-mobile-menu ' + (isMobileOpen ? 'is-open' : '')} aria-hidden={!isMobileOpen}>
                <div className="dm-mobile-menu__handle" />
                <div className="dm-mobile-menu__top">
                    <div>
                        <strong>Навігація</strong>
                        <span>{userName || authCta.label}</span>
                    </div>
                    <button type="button" onClick={closeMenus} aria-label="Закрити меню">
                        <NavIcon name="close" />
                    </button>
                </div>

                <button className="dm-mobile-menu__post" type="button" onClick={handlePostListing}>
                    <NavIcon name="plus" />
                    {postLabel}
                </button>

                <div className="dm-mobile-menu__group">
                    <div className="dm-mobile-menu__label">Пошук</div>
                    {primaryLinks.map(renderMobilePrimaryItem)}
                </div>

                <div className="dm-mobile-menu__group">
                    <div className="dm-mobile-menu__label">Сервіси</div>
                    {serviceLinks.map((link) => (
                        <NavLink key={link.to} to={link.to} onClick={closeMenus}>
                            <NavIcon name={link.icon} />
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                {renderProfileMenu(true)}

                <div className="dm-mobile-menu__group">
                    <div className="dm-mobile-menu__label">Система</div>
                    <button type="button" onClick={() => setLanguage(language === 'uk' ? 'en' : 'uk')}>
                        <NavIcon name="globe" />
                        {language === 'uk' ? 'English' : 'Українська'}
                    </button>
                </div>
            </aside>
        </nav>
    );
};
