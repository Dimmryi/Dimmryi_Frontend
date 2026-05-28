import { useState } from 'react';
import { PlaceholderImage } from './PlaceholderImage';
import { Icons } from './Icons';
import { useLanguage } from '../LanguageProvider';

interface HeroProps {
    accent: string;
}

export const Hero = ({ accent }: HeroProps) => {
    const { translate } = useLanguage();
    const [tab, setTab] = useState<'buy' | 'rent' | 'comm' | 'new'>('buy');
    const tabs = [
        { k: 'buy' as const, l: translate('hero.tabs.buy') },
        { k: 'rent' as const, l: translate('hero.tabs.rent') },
        { k: 'comm' as const, l: translate('hero.tabs.comm') },
        { k: 'new' as const, l: translate('hero.tabs.new') },
    ];

    const stats = [
        { n: '12 480', l: translate('hero.stats.offers') },
        { n: '384', l: translate('hero.stats.agents') },
        { n: '98%', l: translate('hero.stats.satisfied') },
        { n: '24 год', l: translate('hero.stats.response') },
    ];

    return (
        <section className="dm-hero">
            <div className="dm-hero__bg" aria-hidden>
                <div className="dm-hero__bg-grad" />
                <PlaceholderImage label={translate('hero.placeholders.hero')} tone="dark" />
            </div>

            <div className="dm-hero__inner">
                <div className="dm-hero__eyebrow">
                    <span className="dm-dot" style={{ backgroundColor: accent }} /> {translate('hero.eyebrow')}
                </div>

                <h1 className="dm-hero__title">
                    <span>{translate('hero.title1')}</span>
                    <span className="dm-hero__title-it">{translate('hero.title2')}</span>
                    <span>{translate('hero.title3')}</span>
                </h1>

                <p className="dm-hero__lede">{translate('hero.lede')}</p>

                <div className="dm-search">
                    <div className="dm-search__tabs">
                        {tabs.map((t) => (
                            <button
                                key={t.k}
                                className={'dm-search__tab ' + (tab === t.k ? 'is-active' : '')}
                                onClick={() => setTab(t.k)}
                            >
                                {t.l}
                            </button>
                        ))}
                    </div>
                    <div className="dm-search__row">
                        <div className="dm-search__field dm-search__field--wide">
                            <label>{translate('hero.search.location')}</label>
                            <div className="dm-search__input">
                                {Icons.loc()}
                                <input
                                    placeholder={translate('hero.search.placeholder')}
                                    defaultValue={translate('hero.search.defaultLocation')}
                                />
                            </div>
                        </div>
                        <div className="dm-search__field">
                            <label>{translate('hero.search.type')}</label>
                            <div className="dm-search__input">
                                <select defaultValue="any">
                                    <option value="any">{translate('hero.search.selectAny')}</option>
                                    <option value="apartment">{translate('hero.search.apartment')}</option>
                                    <option value="house">{translate('hero.search.house')}</option>
                                    <option value="townhouse">{translate('hero.search.townhouse')}</option>
                                    <option value="penthouse">{translate('hero.search.penthouse')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="dm-search__field">
                            <label>{translate('hero.search.price')}</label>
                            <div className="dm-search__input">
                                <select defaultValue="priceAny">
                                    <option value="priceAny">{translate('hero.search.priceAny')}</option>
                                    <option value="price250">{translate('hero.search.price250')}</option>
                                    <option value="price250to500">{translate('hero.search.price250to500')}</option>
                                    <option value="price500to1">{translate('hero.search.price500to1')}</option>
                                    <option value="price1plus">{translate('hero.search.price1plus')}</option>
                                </select>
                            </div>
                        </div>
                        <button className="dm-search__go">
                            {Icons.search()}
                            <span>{translate('hero.search.go')}</span>
                        </button>
                    </div>
                </div>

                <div className="dm-hero__stats">
                    {stats.map((s) => (
                        <Stat key={s.l} n={s.n} l={s.l} />
                    ))}
                </div>
            </div>

            <div className="dm-hero__scroll">
                <div className="dm-hero__scroll-line" />
                <span>{translate('hero.scroll')}</span>
            </div>
        </section>
    );
};

interface StatProps {
    n: string;
    l: string;
}

function Stat({ n, l }: StatProps) {
    return (
        <div className="dm-stat">
            <div className="dm-stat__n">{n}</div>
            <div className="dm-stat__l">{l}</div>
        </div>
    );
}
