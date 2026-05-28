import { useLanguage } from '../LanguageProvider';

export const Nav = () => {
    const { language, setLanguage, translate } = useLanguage();
    const links = [
        translate('nav.buy'),
        translate('nav.rent'),
        translate('nav.newBuild'),
        translate('nav.agents'),
        translate('nav.about'),
    ];

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
                {links.map((l) => (
                    <li key={l}>
                        <a href="#">{l}</a>
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
                <button className="dm-btn dm-btn--ghost">{translate('nav.login')}</button>
                <button className="dm-btn dm-btn--accent">{translate('nav.post')}</button>
            </div>
        </nav>
    );
};
