import { CATEGORIES } from '../constants';
import { Icons, CatIcon } from './Icons';
import { useLanguage } from '../LanguageProvider';

export const Categories = () => {
    const { translate } = useLanguage();

    return (
        <section className="dm-section">
            <div className="dm-section__head">
                <div>
                    <div className="dm-eyebrow">{translate('categories.eyebrow')}</div>
                    <h2 className="dm-h2">{translate('categories.title')}</h2>
                </div>
            </div>
            <div className="dm-cats">
                {CATEGORIES.map((c) => (
                    <a key={c.key} href="#" className="dm-cat">
                        <div className="dm-cat__icon">
                            <CatIcon kind={c.icon} />
                        </div>
                        <div className="dm-cat__body">
                            <div className="dm-cat__label">{translate(`categories.labels.${c.key}`)}</div>
                            <div className="dm-cat__count">
                                {translate('categories.objectsCount', { count: Number(c.count.replace(/\s/g, '')) })}
                            </div>
                        </div>
                        <div className="dm-cat__arrow">{Icons.arrow()}</div>
                    </a>
                ))}
            </div>
        </section>
    );
};
