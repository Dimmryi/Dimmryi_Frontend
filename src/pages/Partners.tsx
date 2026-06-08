import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

const partnerTypes = [
    {
        titleUk: 'Рієлторські агентства',
        titleEn: 'Real estate agencies',
        textUk: 'Команди, які хочуть системно представляти своїх спеціалістів, оголошення та послуги на платформі.',
        textEn: 'Teams that want to present their specialists, listings, and services on the platform in a structured way.',
    },
    {
        titleUk: 'Забудовники та ЖК',
        titleEn: 'Developers and residential complexes',
        textUk: 'Партнери, яким важливо показувати новобудови, планування, умови продажу та актуальні пропозиції.',
        textEn: 'Partners who need to showcase new buildings, layouts, sales conditions, and current offers.',
    },
    {
        titleUk: 'Оцінювачі нерухомості',
        titleEn: 'Property valuers',
        textUk: 'Спеціалісти, чиї послуги можуть бути корисними власникам, покупцям і користувачам аналітичних сервісів.',
        textEn: 'Specialists whose services can help owners, buyers, and users of analytics tools.',
    },
    {
        titleUk: 'Юристи та нотаріуси',
        titleEn: 'Lawyers and notaries',
        textUk: 'Професійна підтримка для користувачів, яким потрібна консультація перед укладанням договору.',
        textEn: 'Professional support for users who need consultation before signing an agreement.',
    },
    {
        titleUk: 'Ремонт, дизайн, меблі',
        titleEn: 'Renovation, design, furniture',
        textUk: 'Сервіси, які природно доповнюють шлях користувача після оренди або купівлі житла.',
        textEn: 'Services that naturally continue the user journey after renting or buying a home.',
    },
    {
        titleUk: 'Медіа та локальна реклама',
        titleEn: 'Media and local advertising',
        textUk: 'Спільні матеріали, рекламні формати та інформаційні партнерства навколо ринку нерухомості.',
        textEn: 'Joint materials, advertising formats, and informational partnerships around the real estate market.',
    },
];

const formats = [
    {
        titleUk: 'Рекламне розміщення',
        titleEn: 'Advertising placements',
        textUk: 'Публікація пропозицій, сервісів або партнерських матеріалів у форматі, який не заважає користувачу шукати нерухомість.',
        textEn: 'Publishing offers, services, or partner materials in a format that does not interrupt property search.',
    },
    {
        titleUk: 'Партнерські добірки',
        titleEn: 'Partner selections',
        textUk: 'Добірки оголошень, сервісів або корисних матеріалів для окремих аудиторій: власників, орендарів, покупців, агентів.',
        textEn: 'Selections of listings, services, or useful materials for owners, renters, buyers, and agents.',
    },
    {
        titleUk: 'Інформаційні сторінки',
        titleEn: 'Information pages',
        textUk: 'Окремі сторінки або блоки для послуг, які справді допомагають користувачам у процесі пошуку чи оформлення житла.',
        textEn: 'Dedicated pages or blocks for services that genuinely help users during property search or paperwork.',
    },
    {
        titleUk: 'Соцмережі та контент',
        titleEn: 'Social media and content',
        textUk: 'Спільні пости, короткі пояснення, огляди або корисні матеріали для аудиторії Дім мрії.',
        textEn: 'Joint posts, short explainers, reviews, or useful materials for the Dream Home audience.',
    },
];

const principles = [
    {
        titleUk: 'Чесна роль платформи',
        titleEn: 'Honest platform role',
        textUk: 'Дім мрії є рекламною платформою і не виступає стороною або гарантом угод з нерухомістю.',
        textEn: 'Dream Home is an advertising platform and does not act as a party or guarantor of real estate transactions.',
    },
    {
        titleUk: 'Користь для аудиторії',
        titleEn: 'Usefulness for users',
        textUk: 'Партнерські пропозиції мають бути зрозумілими, доречними та не шкодити користувачам сайту.',
        textEn: 'Partner offers should be clear, relevant, and safe for website users.',
    },
    {
        titleUk: 'Прозорість формату',
        titleEn: 'Transparent format',
        textUk: 'Рекламні або партнерські матеріали повинні бути відокремлені від звичайної інформації платформи.',
        textEn: 'Advertising or partner materials should be separated from regular platform information.',
    },
];

const partnerLinks = [
    {
        to: '/contacts',
        titleUk: 'Обговорити партнерство',
        titleEn: 'Discuss partnership',
        textUk: 'Перейдіть на сторінку контактів, щоб скопіювати email і написати нам коротко про вашу ідею співпраці.',
        textEn: 'Open contacts, copy the email, and write a short message about your partnership idea.',
    },
    {
        to: '/for-agents',
        titleUk: 'Для рієлторів',
        titleEn: 'For agents',
        textUk: 'Якщо ви спеціаліст з нерухомості, почніть із професійного профілю рієлтора.',
        textEn: 'If you are a real estate specialist, start with a professional agent profile.',
    },
    {
        to: '/subscription',
        titleUk: 'Тарифні плани',
        titleEn: 'Pricing plans',
        textUk: 'Перегляньте доступні підписки та можливості, які відкриваються для професійних користувачів.',
        textEn: 'Review available plans and the features they unlock for professional users.',
    },
];

export default function Partners() {
    const { language } = useLanguage();
    const isEnglish = language === 'en';

    return (
        <main className="dm-partners-page">
            <section className="dm-partners-hero">
                <div>
                    <div className="dm-eyebrow">{isEnglish ? 'Partners' : 'Партнерам'}</div>
                    <h1>
                        {isEnglish
                            ? 'Partnerships around real estate services'
                            : 'Партнерства навколо сервісів нерухомості'}
                    </h1>
                    <p>
                        {isEnglish
                            ? 'Dream Home is open to cooperation with specialists and companies that help people search, rent, buy, sell, evaluate, or prepare property for living.'
                            : 'Дім мрії відкритий до співпраці зі спеціалістами та компаніями, які допомагають людям шукати, орендувати, купувати, продавати, оцінювати або готувати нерухомість до життя.'}
                    </p>
                    <div className="dm-partners-hero__actions">
                        <Link className="dm-btn dm-btn--accent" to="/contacts">
                            {isEnglish ? 'Contact us' : 'Написати нам'}
                        </Link>
                        <Link className="dm-btn dm-btn--ghost" to="/for-agents">
                            {isEnglish ? 'For agents' : 'Для рієлторів'}
                        </Link>
                    </div>
                </div>
                <aside className="dm-partners-note">
                    <span>{isEnglish ? 'Important' : 'Важливо'}</span>
                    <strong>{isEnglish ? 'Partnership is not a transaction guarantee' : 'Партнерство не є гарантією угоди'}</strong>
                    <p>
                        {isEnglish
                            ? 'The platform can promote useful services and specialists, but users make transaction decisions independently.'
                            : 'Платформа може рекламувати корисні сервіси та спеціалістів, але користувачі самостійно ухвалюють рішення щодо угод.'}
                    </p>
                </aside>
            </section>

            <section className="dm-partners-section">
                <div className="dm-partners-section-head">
                    <span>{isEnglish ? 'Who we work with' : 'З ким співпрацюємо'}</span>
                    <h2>{isEnglish ? 'Partners that fit the real estate journey' : 'Партнери, які доповнюють шлях користувача'}</h2>
                </div>
                <div className="dm-partners-grid">
                    {partnerTypes.map((partner) => (
                        <article key={partner.titleEn}>
                            <h3>{isEnglish ? partner.titleEn : partner.titleUk}</h3>
                            <p>{isEnglish ? partner.textEn : partner.textUk}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dm-partners-section">
                <div className="dm-partners-section-head">
                    <span>{isEnglish ? 'Formats' : 'Формати'}</span>
                    <h2>{isEnglish ? 'How cooperation can look' : 'Як може виглядати співпраця'}</h2>
                </div>
                <div className="dm-partners-format-list">
                    {formats.map((format) => (
                        <article key={format.titleEn}>
                            <div>
                                <h3>{isEnglish ? format.titleEn : format.titleUk}</h3>
                                <p>{isEnglish ? format.textEn : format.textUk}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dm-partners-principles">
                <div className="dm-partners-section-head">
                    <span>{isEnglish ? 'Principles' : 'Принципи'}</span>
                    <h2>{isEnglish ? 'Clear boundaries make cooperation healthier' : 'Чіткі межі роблять співпрацю здоровішою'}</h2>
                </div>
                <div className="dm-partners-principles__grid">
                    {principles.map((principle) => (
                        <article key={principle.titleEn}>
                            <h3>{isEnglish ? principle.titleEn : principle.titleUk}</h3>
                            <p>{isEnglish ? principle.textEn : principle.textUk}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dm-partners-links">
                <div className="dm-partners-section-head">
                    <span>{isEnglish ? 'Next step' : 'Наступний крок'}</span>
                    <h2>{isEnglish ? 'Choose the route that matches your idea' : 'Оберіть маршрут, який відповідає вашій ідеї'}</h2>
                </div>
                <div className="dm-partners-link-list">
                    {partnerLinks.map((link) => (
                        <Link to={link.to} key={link.to}>
                            <div>
                                <h3>{isEnglish ? link.titleEn : link.titleUk}</h3>
                                <p>{isEnglish ? link.textEn : link.textUk}</p>
                            </div>
                            <span>{isEnglish ? 'Open' : 'Перейти'}</span>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
