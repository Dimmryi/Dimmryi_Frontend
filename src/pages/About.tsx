import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

const stats = [
    { uk: '2024', en: '2024', labelUk: 'рік запуску платформи', labelEn: 'platform launch year' },
    { uk: 'Харків', en: 'Kharkiv', labelUk: 'місто, з якого розвиваємо сервіс', labelEn: 'the city where we grow the service' },
    { uk: '14 років', en: '14 years', labelUk: 'досвіду у рекламі нерухомості', labelEn: 'of real estate advertising experience' },
];

const values = [
    {
        titleUk: 'Працюємо з реальним сценарієм пошуку',
        titleEn: 'Built around real search behavior',
        textUk:
            'Ми розвиваємо каталог, карту, фільтри, сповіщення та сторінки оголошень так, щоб користувач швидко переходив від інтересу до контакту з власником або рієлтором.',
        textEn:
            'We develop listings, map search, filters, alerts, and detail pages so users can move quickly from interest to contacting an owner or agent.',
    },
    {
        titleUk: 'Не підміняємо собою угоду',
        titleEn: 'We do not replace the transaction',
        textUk:
            'Дім мрії є рекламною платформою для оголошень про нерухомість. Ми не виступаємо стороною чи гарантом угоди, але створюємо інструменти, які допомагають краще підготувати оголошення та комунікацію.',
        textEn:
            'Dream Home is an advertising platform for real estate listings. We are not a party to the transaction or a guarantor, but we provide tools that support clearer listings and communication.',
    },
    {
        titleUk: 'Додаємо корисні сервіси поступово',
        titleEn: 'Useful services, added step by step',
        textUk:
            'Окрім пошуку, ми впроваджуємо перевірку оголошень, шаблон договору оренди, аналітику цін, email-сповіщення та профілі рієлторів.',
        textEn:
            'Beyond search, we add listing verification, a rental agreement template, price analytics, email alerts, and agent profiles.',
    },
];

const milestones = [
    {
        year: '2024',
        titleUk: 'Старт ідеї',
        titleEn: 'The idea begins',
        textUk: 'У Харкові команда почала створювати український сервіс для реклами нерухомості з акцентом на зручну подачу оголошень.',
        textEn: 'In Kharkiv, the team started building a Ukrainian real estate advertising service focused on clear listing presentation.',
    },
    {
        year: '2025',
        titleUk: 'Розвиток інструментів',
        titleEn: 'Tools take shape',
        textUk: 'До платформи додаються карта, фільтри, сторінки послуг, профілі рієлторів та сервіси для власників.',
        textEn: 'The platform gains map search, filters, service pages, agent profiles, and owner-focused tools.',
    },
    {
        year: '2026',
        titleUk: 'Фокус на практичній користі',
        titleEn: 'Practical value first',
        textUk: 'Платформа переходить до більш зрілої логіки: сповіщення, перевірка оголошень, аналітика та зрозумілі сценарії для користувача.',
        textEn: 'The platform moves toward mature workflows: alerts, listing verification, analytics, and clearer user journeys.',
    },
];

export default function About() {
    const { language } = useLanguage();
    const isEnglish = language === 'en';

    return (
        <main className="dm-about-page">
            <section className="dm-about-hero">
                <div>
                    <div className="dm-eyebrow">{isEnglish ? 'About us' : 'Про нас'}</div>
                    <h1>
                        {isEnglish
                            ? 'Dream Home is a Ukrainian real estate advertising platform'
                            : 'Дім мрії — українська платформа для реклами нерухомості'}
                    </h1>
                    <p>
                        {isEnglish
                            ? 'We are a small Ukrainian company based in Kharkiv and founded in 2024 by specialists with 14 years of practical experience in real estate advertising, digital products, and customer communication.'
                            : 'Ми невелика українська компанія з Харкова, заснована у 2024 році спеціалістами з 14-річним практичним досвідом у сфері реклами нерухомості, цифрових продуктів і комунікації з клієнтами.'}
                    </p>
                    <div className="dm-about-hero__actions">
                        <Link className="dm-btn dm-btn--accent" to="/listings">
                            {isEnglish ? 'Browse listings' : 'Перейти до оголошень'}
                        </Link>
                        <Link className="dm-btn dm-btn--ghost" to="/services">
                            {isEnglish ? 'View services' : 'Переглянути сервіси'}
                        </Link>
                    </div>
                </div>

                <aside className="dm-about-card" aria-label={isEnglish ? 'Company summary' : 'Коротко про компанію'}>
                    <span>{isEnglish ? 'Our role' : 'Наша роль'}</span>
                    <strong>{isEnglish ? 'Clear advertising, useful tools, honest expectations.' : 'Зрозуміла реклама, корисні інструменти, чесні очікування.'}</strong>
                    <p>
                        {isEnglish
                            ? 'We help owners, agents, tenants, and buyers meet around well-structured listings, but the final agreement remains between the parties.'
                            : 'Ми допомагаємо власникам, рієлторам, орендарям і покупцям знаходити одне одного через якісно оформлені оголошення, але фінальна домовленість залишається між сторонами.'}
                    </p>
                </aside>
            </section>

            <section className="dm-about-stats" aria-label={isEnglish ? 'Company facts' : 'Факти про компанію'}>
                {stats.map((item) => (
                    <article key={item.en}>
                        <strong>{isEnglish ? item.en : item.uk}</strong>
                        <span>{isEnglish ? item.labelEn : item.labelUk}</span>
                    </article>
                ))}
            </section>

            <section className="dm-about-mission">
                <div>
                    <span>{isEnglish ? 'Our mission' : 'Наша місія'}</span>
                    <h2>
                        {isEnglish
                            ? 'To make the search for a home feel clearer, calmer, and more human'
                            : 'Зробити пошук дому зрозумілішим, спокійнішим і людянішим'}
                    </h2>
                </div>
                <p>
                    {isEnglish
                        ? 'A home is never just square meters and a price. It is a decision about safety, rhythm, family, work, and the next chapter of life. Our mission is to help people see property offers without noise, compare options more thoughtfully, and contact the right person with more confidence.'
                        : 'Дім — це не лише квадратні метри й ціна. Це рішення про безпеку, ритм життя, родину, роботу і наступний етап. Наша місія — допомогти людям бачити пропозиції без зайвого шуму, спокійніше порівнювати варіанти й упевненіше виходити на контакт із потрібною людиною.'}
                </p>
            </section>

            <section className="dm-about-section">
                <div className="dm-about-section__head">
                    <span>{isEnglish ? 'What we build' : 'Що ми створюємо'}</span>
                    <h2>{isEnglish ? 'A practical service for property advertising and search' : 'Практичний сервіс для реклами та пошуку нерухомості'}</h2>
                </div>
                <div className="dm-about-values">
                    {values.map((item) => (
                        <article key={item.titleEn}>
                            <h3>{isEnglish ? item.titleEn : item.titleUk}</h3>
                            <p>{isEnglish ? item.textEn : item.textUk}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dm-about-section dm-about-section--split">
                <div>
                    <span>{isEnglish ? 'Our path' : 'Наш шлях'}</span>
                    <h2>{isEnglish ? 'From a focused idea to a growing product' : 'Від сфокусованої ідеї до продукту, що розвивається'}</h2>
                    <p>
                        {isEnglish
                            ? 'We keep the platform compact and practical: first we make the core journey work, then we add services that genuinely help owners and searchers.'
                            : 'Ми тримаємо платформу компактною і практичною: спочатку доводимо до ладу основний шлях користувача, а потім додаємо сервіси, які справді допомагають власникам і тим, хто шукає нерухомість.'}
                    </p>
                </div>
                <div className="dm-about-timeline">
                    {milestones.map((item) => (
                        <article key={item.year}>
                            <strong>{item.year}</strong>
                            <div>
                                <h3>{isEnglish ? item.titleEn : item.titleUk}</h3>
                                <p>{isEnglish ? item.textEn : item.textUk}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dm-about-cta">
                <div>
                    <span>{isEnglish ? 'For owners and agents' : 'Для власників і рієлторів'}</span>
                    <h2>{isEnglish ? 'List property with a clear structure and helpful services nearby' : 'Розміщуйте нерухомість зі зрозумілою структурою та корисними сервісами поруч'}</h2>
                    <p>
                        {isEnglish
                            ? 'Create a listing, request verification, use a rental agreement template, or set up alerts for market movement.'
                            : 'Створіть оголошення, подайте заявку на перевірку, скористайтесь шаблоном договору оренди або налаштуйте сповіщення про нові об’єкти на ринку.'}
                    </p>
                </div>
                <Link className="dm-btn dm-btn--accent" to="/listings/new">
                    {isEnglish ? 'List property' : 'Розмістити оголошення'}
                </Link>
            </section>
        </main>
    );
}
