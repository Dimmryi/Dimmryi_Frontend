import { PlaceholderImage } from './PlaceholderImage';
import { useLanguage } from '../LanguageProvider';

export const ListCta = () => {
    const { translate } = useLanguage();

    return (
        <section className="dm-cta">
            <div className="dm-cta__inner">
                <div>
                    <div className="dm-eyebrow dm-eyebrow--light">{translate('listCta.eyebrow')}</div>
                    <h2 className="dm-h2 dm-h2--light">
                        {translate('listCta.title')}<br />
                        <span className="dm-it">{translate('listCta.titleIt')}</span>
                    </h2>
                    <p className="dm-cta__lede">{translate('listCta.lede')}</p>
                    <div className="dm-cta__row">
                        <button className="dm-btn dm-btn--accent dm-btn--lg">{translate('listCta.buttons.rent')}</button>
                        <button className="dm-btn dm-btn--light dm-btn--lg">{translate('listCta.buttons.sell')}</button>
                    </div>
                    <div className="dm-cta__meta">
                        <span>{translate('listCta.meta.rating')}</span>
                        <span>· {translate('listCta.meta.support')}</span>
                    </div>
                </div>
                <div className="dm-cta__art">
                    <div className="dm-cta__phone">
                        <div className="dm-cta__phone-screen">
                            <div className="dm-cta__phone-bar" />
                            <div className="dm-cta__phone-img">
                                <PlaceholderImage label={translate('listCta.phone.label')} tone="warm" />
                            </div>
                            <div className="dm-cta__phone-row" />
                            <div className="dm-cta__phone-row" />
                            <div className="dm-cta__phone-btn">{translate('listCta.phone.publishBtn')}</div>
                        </div>
                    </div>
                    <div className="dm-cta__badge dm-cta__badge--1">
                        <strong>{translate('listCta.badges.viewsIncrease')}</strong>
                        <span>{translate('listCta.badges.viewsIncreaseText')}</span>
                    </div>
                    <div className="dm-cta__badge dm-cta__badge--2">
                        <strong>{translate('listCta.badges.newRequests')}</strong>
                        <span>{translate('listCta.badges.newRequestsText')}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
