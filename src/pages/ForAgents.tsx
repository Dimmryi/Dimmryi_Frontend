import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

const steps = [
    {
        titleUk: 'Створіть звичайний акаунт',
        titleEn: 'Create a regular account',
        textUk: 'Профіль рієлтора прив’язується до користувача сайту, тому спочатку потрібно зареєструватися або увійти.',
        textEn: 'An agent profile is linked to a site user, so first you need to register or sign in.',
    },
    {
        titleUk: 'Активуйте відповідний тариф',
        titleEn: 'Activate the right plan',
        textUk: 'Створення профілю рієлтора доступне користувачам із платною підпискою або адміністратору.',
        textEn: 'Creating an agent profile is available to users with a paid subscription or to an administrator.',
    },
    {
        titleUk: 'Заповніть професійний профіль',
        titleEn: 'Complete your professional profile',
        textUk: 'Додайте фото, контакти, опис досвіду та інформацію, яка допоможе клієнту швидко зрозуміти вашу спеціалізацію.',
        textEn: 'Add a photo, contacts, experience summary, and details that help clients understand your specialization quickly.',
    },
];

const links = [
    {
        to: '/agents',
        titleUk: 'Усі рієлтори',
        titleEn: 'All agents',
        textUk: 'Подивіться, як виглядають профілі спеціалістів на сайті та яку інформацію бачать користувачі.',
        textEn: 'See how specialist profiles look on the site and what information users can view.',
    },
    {
        to: '/my-agent',
        titleUk: 'Створити або редагувати профіль',
        titleEn: 'Create or edit profile',
        textUk: 'Перейдіть до особистої сторінки рієлтора, щоб створити профіль або оновити вже додані дані.',
        textEn: 'Go to your personal agent page to create a profile or update existing information.',
    },
    {
        to: '/subscription',
        titleUk: 'Тарифні плани',
        titleEn: 'Pricing plans',
        textUk: 'Перегляньте доступні підписки та оберіть план, який відкриває професійні можливості сайту.',
        textEn: 'Review available subscriptions and choose a plan that unlocks professional site features.',
    },
];

export default function ForAgents() {
    const { language } = useLanguage();
    const isEnglish = language === 'en';

    return (
        <main className="dm-for-agents-page">
            <section className="dm-for-agents-hero">
                <div>
                    <div className="dm-eyebrow">{isEnglish ? 'For agents' : 'Для рієлторів'}</div>
                    <h1>{isEnglish ? 'A professional profile for real estate specialists' : 'Професійний профіль для спеціалістів з нерухомості'}</h1>
                    <p>
                        {isEnglish
                            ? 'Dream Home helps agents present their services, contacts, and experience in a clear format next to real estate search tools.'
                            : 'Дім мрії допомагає рієлторам презентувати свої послуги, контакти та досвід у зрозумілому форматі поруч із сервісами пошуку нерухомості.'}
                    </p>
                    <div className="dm-for-agents-hero__actions">
                        <Link className="dm-btn dm-btn--accent" to="/my-agent">
                            {isEnglish ? 'Create agent profile' : 'Створити профіль рієлтора'}
                        </Link>
                        <Link className="dm-btn dm-btn--ghost" to="/agents">
                            {isEnglish ? 'View agents' : 'Переглянути рієлторів'}
                        </Link>
                    </div>
                </div>
                <aside className="dm-for-agents-note">
                    <span>{isEnglish ? 'Access' : 'Доступ'}</span>
                    <strong>{isEnglish ? 'Registration + active paid plan' : 'Реєстрація + активний платний тариф'}</strong>
                    <p>
                        {isEnglish
                            ? 'The profile is created from a regular user account. A paid plan gives access to professional features; admins can manage profiles without plan limits.'
                            : 'Профіль створюється зі звичайного акаунта користувача. Платний тариф відкриває професійні можливості; адміністратор може керувати профілями без обмежень тарифу.'}
                    </p>
                </aside>
            </section>

            <section className="dm-for-agents-steps">
                <div className="dm-for-agents-section-head">
                    <span>{isEnglish ? 'How it works' : 'Як це працює'}</span>
                    <h2>{isEnglish ? 'Three steps to appear as an agent on the site' : 'Три кроки, щоб з’явитися на сайті як рієлтор'}</h2>
                </div>
                <div className="dm-for-agents-grid">
                    {steps.map((step, index) => (
                        <article key={step.titleEn}>
                            <strong>{String(index + 1).padStart(2, '0')}</strong>
                            <h3>{isEnglish ? step.titleEn : step.titleUk}</h3>
                            <p>{isEnglish ? step.textEn : step.textUk}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dm-for-agents-links">
                <div className="dm-for-agents-section-head">
                    <span>{isEnglish ? 'Useful links' : 'Корисні переходи'}</span>
                    <h2>{isEnglish ? 'Choose what you need right now' : 'Оберіть, що потрібно саме зараз'}</h2>
                </div>
                <div className="dm-for-agents-link-list">
                    {links.map((item) => (
                        <Link to={item.to} key={item.to}>
                            <div>
                                <h3>{isEnglish ? item.titleEn : item.titleUk}</h3>
                                <p>{isEnglish ? item.textEn : item.textUk}</p>
                            </div>
                            <span>{isEnglish ? 'Open' : 'Перейти'}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="dm-for-agents-cta">
                <div>
                    <span>{isEnglish ? 'Ready to start?' : 'Готові почати?'}</span>
                    <h2>{isEnglish ? 'Create a profile that helps clients understand why they should contact you' : 'Створіть профіль, який допоможе клієнтам зрозуміти, чому варто звернутися саме до вас'}</h2>
                </div>
                <Link className="dm-btn dm-btn--accent" to="/subscription">
                    {isEnglish ? 'View plans' : 'Переглянути тарифи'}
                </Link>
            </section>
        </main>
    );
}
