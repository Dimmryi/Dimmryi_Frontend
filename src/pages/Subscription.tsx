import { Link } from 'react-router-dom';
import { SubscriptionActionButton } from '../components/SubscriptionActionButton';
import { useAppSelector } from '../app/hooks';
import { useLanguage } from '../LanguageProvider';
import { useSubscription } from '../hooks/useSubscription';

type PlanId = 'Free' | 'Standard' | 'Premium';

interface Plan {
    id: PlanId;
    nameUk: string;
    nameEn: string;
    priceUk: string;
    priceEn: string;
    periodUk: string;
    periodEn: string;
    descriptionUk: string;
    descriptionEn: string;
    featuresUk: string[];
    featuresEn: string[];
    badgeUk?: string;
    badgeEn?: string;
}

const plans: Plan[] = [
    {
        id: 'Free',
        nameUk: 'Базовий',
        nameEn: 'Free',
        priceUk: '0 грн',
        priceEn: 'UAH 0',
        periodUk: 'завжди',
        periodEn: 'forever',
        descriptionUk: 'Стартовий доступ для пошуку, перегляду оголошень і базового розміщення.',
        descriptionEn: 'Starter access for search, browsing, and basic listing publishing.',
        featuresUk: ['Пошук по каталогу та мапі', 'Створення базового оголошення', 'До 6 фото в оголошенні', 'Обране та порівняння', 'AI-оцінка один раз на день'],
        featuresEn: ['Catalog and map search', 'Basic listing publishing', 'Up to 6 listing photos', 'Favorites and comparison', 'AI estimate once per day'],
    },
    {
        id: 'Standard',
        nameUk: 'Standard',
        nameEn: 'Standard',
        priceUk: '299 грн',
        priceEn: 'UAH 299',
        periodUk: 'за 3 місяці',
        periodEn: 'per 3 months',
        descriptionUk: 'Для власників, які хочуть швидше реагувати на попит і краще оформляти оголошення.',
        descriptionEn: 'For owners who want faster demand tracking and richer listing presentation.',
        featuresUk: ['Email-сповіщення про нові об’єкти', '1 активний запит на сповіщення', 'До 8 фото та відео', 'Базове просування сервісів', 'Доступ до майбутньої аналітики'],
        featuresEn: ['Email alerts for matching properties', '1 active notification request', 'Up to 8 photos and video', 'Basic service promotion', 'Access to future analytics'],
        badgeUk: 'популярний старт',
        badgeEn: 'popular start',
    },
    {
        id: 'Premium',
        nameUk: 'Premium',
        nameEn: 'Premium',
        priceUk: '599 грн',
        priceEn: 'UAH 599',
        periodUk: 'за 3 місяці',
        periodEn: 'per 3 months',
        descriptionUk: 'Для рієлторів і активних власників, яким потрібен повний набір преміум-функцій.',
        descriptionEn: 'For agents and active owners who need the full premium toolkit.',
        featuresUk: ['Усі можливості Standard', 'Профіль рієлтора в каталозі', 'Кілька активних запитів на сповіщення', 'Пріоритетні промо-інструменти', 'Покращене оформлення оголошень', 'Підготовка рекламних матеріалів'],
        featuresEn: ['Everything in Standard', 'Agent profile in the catalog', 'Multiple active notification requests', 'Priority promotion tools', 'Enhanced listing presentation', 'Advertising material preparation'],
        badgeUk: 'для професіоналів',
        badgeEn: 'for professionals',
    },
];

const faqs = [
    {
        qUk: 'Коли підписка стає активною?',
        qEn: 'When does the subscription become active?',
        aUk: 'Після підтвердження сервером. У тестовому режимі це миттєва активація без реального списання коштів.',
        aEn: 'After server confirmation. In test mode this is instant activation without real charging.',
    },
    {
        qUk: 'На який термін діють платні тарифи?',
        qEn: 'How long do paid plans last?',
        aUk: 'Standard і Premium діють 3 місяці. Після завершення терміну преміум-функції вимикаються.',
        aEn: 'Standard and Premium last 3 months. Premium features are disabled after expiry.',
    },
    {
        qUk: 'Чому LiqPay ще у тестовому режимі?',
        qEn: 'Why is LiqPay still in test mode?',
        aUk: 'Для бойових платежів потрібен договір з банком і реальні ключі. До цього тестуємо бізнес-логіку підписок окремим режимом backend.',
        aEn: 'Production payments need a bank agreement and real keys. Until then the backend test mode verifies subscription logic.',
    },
    {
        qUk: 'Що буде при переході на базовий тариф?',
        qEn: 'What happens when switching to Free?',
        aUk: 'Платні можливості вимикаються, але профіль, оголошення та збережені дані не видаляються.',
        aEn: 'Paid features are disabled, but profile, listings, and saved data are not deleted.',
    },
];

const planToAction = (id: PlanId) => {
    if (id === 'Standard') return 'standard';
    if (id === 'Premium') return 'premium';
    return 'free';
};

const formatDate = (value: string | null, isEnglish: boolean) => {
    if (!value) return isEnglish ? 'without expiry date' : 'без дати завершення';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'uk-UA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

export default function Subscription() {
    const { language } = useLanguage();
    const { subscribeType, subscribeExpired, isActive, isAdmin } = useSubscription();
    const isRegistered = useAppSelector((state) => state.registration.isRegistered);
    const isEnglish = language === 'en';

    return (
        <main className="dm-subscription-page">
            <section className="dm-section">
                <div className="dm-subscription-hero">
                    <div>
                        <div className="dm-eyebrow">{isEnglish ? 'Subscription' : 'Підписка'}</div>
                        <h1 className="dm-h2">{isEnglish ? 'Plans for premium services' : 'Тарифи на преміальні послуги'}</h1>
                    </div>
                    <p>
                        {isEnglish
                            ? 'Choose the level that fits your real estate workflow. Payment integration is prepared through the backend and can later be switched to production LiqPay keys.'
                            : 'Оберіть рівень доступу під ваш сценарій роботи з нерухомістю. Інтеграція оплати підготовлена через бекенд і пізніше перемикається на бойові ключі LiqPay.'}
                    </p>
                </div>

                <div className="dm-subscription-status">
                    <div>
                        <span>{isEnglish ? 'Current plan' : 'Поточний тариф'}</span>
                        <strong>{isAdmin ? 'Admin' : subscribeType}</strong>
                    </div>
                    <p>
                        {isRegistered
                            ? isActive || isAdmin
                                ? `${isEnglish ? 'Access active until' : 'Доступ активний до'} ${isAdmin ? (isEnglish ? 'unlimited' : 'без обмежень') : formatDate(subscribeExpired, isEnglish)}`
                                : isEnglish
                                  ? 'Paid access is not active now.'
                                  : 'Платний доступ зараз не активний.'
                            : isEnglish
                              ? 'Sign in to activate or change a plan.'
                              : 'Увійдіть, щоб активувати або змінити тариф.'}
                    </p>
                </div>

                <div className="dm-subscription-grid">
                    {plans.map((plan) => {
                        const isCurrent = !isAdmin && subscribeType === plan.id && (plan.id === 'Free' || isActive);
                        const isPremium = plan.id === 'Premium';

                        return (
                            <article className={`dm-subscription-card ${isPremium ? 'is-featured' : ''} ${isCurrent ? 'is-current' : ''}`} key={plan.id}>
                                <div className="dm-subscription-card__top">
                                    <span>{isEnglish ? plan.nameEn : plan.nameUk}</span>
                                    {(isCurrent || plan.badgeUk) && <em>{isCurrent ? (isEnglish ? 'Active' : 'Активний') : isEnglish ? plan.badgeEn : plan.badgeUk}</em>}
                                </div>
                                <div className="dm-subscription-card__price">
                                    <strong>{isEnglish ? plan.priceEn : plan.priceUk}</strong>
                                    <small>{isEnglish ? plan.periodEn : plan.periodUk}</small>
                                </div>
                                <p>{isEnglish ? plan.descriptionEn : plan.descriptionUk}</p>
                                <ul>
                                    {(isEnglish ? plan.featuresEn : plan.featuresUk).map((feature) => (
                                        <li key={feature}>
                                            <span>✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                {isCurrent ? (
                                    <button className="dm-btn dm-btn--ghost" type="button" disabled>
                                        {isEnglish ? 'Current plan' : 'Поточний тариф'}
                                    </button>
                                ) : (
                                    <SubscriptionActionButton
                                        plan={planToAction(plan.id)}
                                        label={
                                            plan.id === 'Free'
                                                ? isEnglish
                                                    ? 'Switch to Free'
                                                    : 'Перейти на базовий'
                                                : isEnglish
                                                  ? `Activate ${plan.nameEn}`
                                                  : `Активувати ${plan.nameUk}`
                                        }
                                        activeLabel={isEnglish ? 'Plan activated.' : 'Тариф активовано.'}
                                        className={isPremium ? 'dm-btn dm-btn--accent' : 'dm-btn dm-btn--ghost'}
                                    />
                                )}
                            </article>
                        );
                    })}
                </div>

                <div className="dm-subscription-note">
                    <strong>{isEnglish ? 'Payment mode' : 'Режим оплати'}</strong>
                    <p>
                        {isEnglish
                            ? 'The interface is ready for LiqPay. Until real merchant keys are issued, use controlled backend test mode only on development or staging.'
                            : 'Інтерфейс готовий до LiqPay. До отримання реальних merchant-ключів використовуйте контрольований тестовий режим backend лише на development або staging.'}
                    </p>
                </div>

                <div className="dm-subscription-faq">
                    <div className="dm-services-group__head">
                        <span>{isEnglish ? 'FAQ' : 'Питання та відповіді'}</span>
                        <Link to="/services">{isEnglish ? 'All services' : 'Усі сервіси'}</Link>
                    </div>
                    <div className="dm-subscription-faq__grid">
                        {faqs.map((item) => (
                            <article key={item.qUk}>
                                <h3>{isEnglish ? item.qEn : item.qUk}</h3>
                                <p>{isEnglish ? item.aEn : item.aUk}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
