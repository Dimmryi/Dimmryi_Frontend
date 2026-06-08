import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

const CONTACT_EMAIL = 'dimmryi@gmail.com';

const contactTopics = [
    {
        titleUk: 'Загальні питання',
        titleEn: 'General questions',
        textUk: 'Напишіть нам, якщо маєте питання щодо роботи сайту, пошуку нерухомості, сторінок сервісів або загальної логіки платформи.',
        textEn: 'Write to us if you have questions about the website, property search, service pages, or the general platform logic.',
        actionUk: 'Скопіювати email',
        actionEn: 'Copy email',
        href: '',
        copyEmail: true,
    },
    {
        titleUk: 'Підтримка оголошень',
        titleEn: 'Listing support',
        textUk: 'Для питань про створення, редагування, перевірку оголошення або роботу підписки скористайтеся відповідними сервісами сайту.',
        textEn: 'For questions about creating, editing, verifying a listing, or using subscriptions, use the relevant website services.',
        actionUk: 'Перейти до сервісів',
        actionEn: 'Open services',
        href: '/services',
    },
    {
        titleUk: 'Соцмережі',
        titleEn: 'Social media',
        textUk: 'У соцмережах публікуємо короткі оновлення, рекламні пости, добірки та практичний контент про нерухомість.',
        textEn: 'On social media we publish short updates, advertising posts, selections, and practical real estate content.',
        actionUk: 'Відкрити соцмережі',
        actionEn: 'Open social media',
        href: '/socials',
    },
];

const quickLinks = [
    { to: '/verification', uk: 'Перевірка оголошення', en: 'Listing verification' },
    { to: '/notification', uk: 'Пошукові сповіщення', en: 'Search alerts' },
    { to: '/subscription', uk: 'Тарифні плани', en: 'Pricing plans' },
    { to: '/for-agents', uk: 'Для рієлторів', en: 'For agents' },
];

export default function Contacts() {
    const { language } = useLanguage();
    const isEnglish = language === 'en';
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

    const copyEmail = async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(CONTACT_EMAIL);
            } else {
                const input = document.createElement('textarea');
                input.value = CONTACT_EMAIL;
                input.setAttribute('readonly', '');
                input.style.position = 'fixed';
                input.style.opacity = '0';
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }

            setCopyStatus('copied');
            window.setTimeout(() => setCopyStatus('idle'), 2200);
        } catch {
            setCopyStatus('error');
        }
    };

    const copyMessage =
        copyStatus === 'copied'
            ? isEnglish
                ? 'Email copied to clipboard.'
                : 'Email скопійовано.'
            : copyStatus === 'error'
              ? isEnglish
                  ? 'Could not copy automatically. Select and copy the email manually.'
                  : 'Не вдалося скопіювати автоматично. Виділіть і скопіюйте email вручну.'
              : '';

    return (
        <main className="dm-contacts-page">
            <section className="dm-contacts-hero">
                <div>
                    <div className="dm-eyebrow">{isEnglish ? 'Contacts' : 'Контакти'}</div>
                    <h1>{isEnglish ? 'Get in touch with Dream Home' : 'Зв’яжіться з Дім мрії'}</h1>
                    <p>
                        {isEnglish
                            ? 'We help with questions about the platform, listings, services, subscriptions, and public pages. The website is an advertising platform and does not act as a party or guarantor of real estate transactions.'
                            : 'Ми допомагаємо з питаннями щодо роботи платформи, оголошень, сервісів, підписок і публічних сторінок. Сайт є рекламною платформою і не виступає стороною чи гарантом угод з нерухомістю.'}
                    </p>
                    <div className="dm-contacts-hero__actions">
                        <button className="dm-btn dm-btn--accent" type="button" onClick={copyEmail}>
                            {copyStatus === 'copied' ? (isEnglish ? 'Copied' : 'Скопійовано') : CONTACT_EMAIL}
                        </button>
                        <Link className="dm-btn dm-btn--ghost" to="/socials">
                            {isEnglish ? 'Social media' : 'Соцмережі'}
                        </Link>
                    </div>
                    {copyMessage ? (
                        <p
                            className={`dm-contacts-copy ${copyStatus === 'error' ? 'is-error' : ''}`}
                            aria-live="polite"
                        >
                            {copyMessage}
                        </p>
                    ) : null}
                </div>
                <aside className="dm-contacts-note">
                    <span>{isEnglish ? 'Main email' : 'Основний email'}</span>
                    <strong>{CONTACT_EMAIL}</strong>
                    <p>
                        {isEnglish
                            ? 'Use this address for support questions, service feedback, and business communication about the website.'
                            : 'Використовуйте цю адресу для питань підтримки, відгуків про сервіси та ділової комунікації щодо роботи сайту.'}
                    </p>
                </aside>
            </section>

            <section className="dm-contacts-grid">
                {contactTopics.map((topic) => (
                    <article key={topic.titleEn}>
                        <h2>{isEnglish ? topic.titleEn : topic.titleUk}</h2>
                        <p>{isEnglish ? topic.textEn : topic.textUk}</p>
                        {topic.copyEmail ? (
                            <button className="dm-btn dm-btn--ghost" type="button" onClick={copyEmail}>
                                {isEnglish ? topic.actionEn : topic.actionUk}
                            </button>
                        ) : (
                            <Link className="dm-btn dm-btn--ghost" to={topic.href}>
                                {isEnglish ? topic.actionEn : topic.actionUk}
                            </Link>
                        )}
                    </article>
                ))}
            </section>

            <section className="dm-contacts-quick">
                <div>
                    <span>{isEnglish ? 'Common paths' : 'Популярні переходи'}</span>
                    <h2>{isEnglish ? 'Find the right section faster' : 'Швидше знайдіть потрібний розділ'}</h2>
                    <p>
                        {isEnglish
                            ? 'Many questions are solved directly through platform services. These links lead to the most common scenarios.'
                            : 'Багато питань вирішуються одразу через сервіси платформи. Ці посилання ведуть до найчастіших сценаріїв.'}
                    </p>
                </div>
                <div className="dm-contacts-quick__links">
                    {quickLinks.map((link) => (
                        <Link key={link.to} to={link.to}>
                            {isEnglish ? link.en : link.uk}
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
