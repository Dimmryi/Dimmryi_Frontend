import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

interface FooterLink {
    label: string;
    to: string;
}

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
                        { label: translate('footer.links.buyApartment'), to: '/listings?listingType=sale&propertyType=flat' },
                        { label: translate('footer.links.rent'), to: '/listings?listingType=rent' },
                        { label: translate('footer.links.newBuilds'), to: '/listings?typeOfNovelty=newBuilding' },
                        { label: translate('footer.links.commercial'), to: '/listings?propertyType=commercial+real+estate' },
                        { label: translate('footer.links.today'), to: '/listings?today=1' },
                    ]}
                />
                <FooterCol
                    h={translate('footer.sections.owners')}
                    links={[
                        { label: translate('footer.links.list'), to: '/listings/new' },
                        { label: translate('footer.links.tariffs'), to: '/subscription' },
                        { label: translate('footer.links.verification'), to: '/verification' },
                        { label: translate('footer.links.priceAnalytics'), to: '/price-analytics' },
                        { label: translate('footer.links.dealSecurity'), to: '/agreement' },
                    ]}
                />
                <FooterCol
                    h={translate('footer.sections.company')}
                    links={[
                        { label: translate('footer.links.about'), to: '/about' },
                        { label: translate('footer.links.careers'), to: '/for-agents' },
                        { label: translate('footer.links.press'), to: '/socials' },
                        { label: translate('footer.links.partners'), to: '/services' },
                        { label: translate('footer.links.contacts'), to: '/contacts' },
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
    links: FooterLink[];
}

function FooterCol({ h, links }: FooterColProps) {
    return (
        <div className="dm-foot__col">
            <div className="dm-foot__h">{h}</div>
            <ul>
                {links.map((link) => (
                    <li key={link.label}>
                        <Link to={link.to}>{link.label}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
