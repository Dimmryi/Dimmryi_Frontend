import { FEATURED } from '../constants';
import { PlaceholderImage } from './PlaceholderImage';
import { Icons } from './Icons';
import { useLanguage } from '../LanguageProvider';

export const Featured = () => {
    const { translate } = useLanguage();

    return (
        <section className="dm-section">
            <div className="dm-section__head">
                <div>
                    <div className="dm-eyebrow">{translate('featured.eyebrow')}</div>
                    <h2 className="dm-h2">{translate('featured.title')}</h2>
                </div>
                <a href="#" className="dm-link">
                    {translate('featured.allRecommendations')} {Icons.arrow()}
                </a>
            </div>
            <div className="dm-feat">
                {FEATURED.map((p, i) => (
                    <article key={p.id} className={'dm-feat__card ' + (i === 0 ? 'is-large' : '')}>
                        <div className="dm-feat__media">
                            <PlaceholderImage label={p.title} tone="warm" />
                            <div className="dm-feat__tag">{p.tag}</div>
                            <button className="dm-feat__fav">{Icons.heart()}</button>
                        </div>
                        <div className="dm-feat__body">
                            <div className="dm-feat__price">{p.price}</div>
                            <div className="dm-feat__title">{p.title}</div>
                            <div className="dm-feat__spec">{p.spec}</div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};
