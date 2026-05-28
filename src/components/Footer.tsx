import { useLanguage } from '../LanguageProvider';

export const Footer = () => {
    const { translate } = useLanguage();

    return (
        <footer className="dm-foot">
            <div className="dm-foot__top">
                <div className="dm-foot__brand">
                    <div className="dm-nav__logo">
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
                    <div className="dm-foot__brand-name">{translate('footer.brand')}</div>
                    <p>{translate('footer.tagline')}</p>
                </div>
                <FooterCol
                    h={translate('footer.sections.search')}
                    links={[
                        translate('footer.links.buyApartment'),
                        translate('footer.links.rent'),
                        translate('footer.links.newBuilds'),
                        translate('footer.links.commercial'),
                        translate('footer.links.suburbs'),
                    ]}
                />
                <FooterCol
                    h={translate('footer.sections.owners')}
                    links={[
                        translate('footer.links.list'),
                        translate('footer.links.tariffs'),
                        translate('footer.links.verification'),
                        translate('footer.links.priceAnalytics'),
                        translate('footer.links.dealSecurity'),
                    ]}
                />
                <FooterCol
                    h={translate('footer.sections.company')}
                    links={[
                        translate('footer.links.about'),
                        translate('footer.links.careers'),
                        translate('footer.links.press'),
                        translate('footer.links.partners'),
                        translate('footer.links.contacts'),
                    ]}
                />
            </div>
            <div className="dm-foot__bot">
                <span>{translate('footer.copyright')}</span>
                <span>{translate('footer.made')}</span>
            </div>
        </footer>
    );
};

interface FooterColProps {
    h: string;
    links: string[];
}

function FooterCol({ h, links }: FooterColProps) {
    return (
        <div className="dm-foot__col">
            <div className="dm-foot__h">{h}</div>
            <ul>
                {links.map((l) => (
                    <li key={l}>
                        <a href="#">{l}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
