import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';
import { useAppSelector } from '../app/hooks';
import { useSubscription } from '../hooks/useSubscription';
import { createPromotionRequest, type PromotionRequestType } from '../services/PromotionRequestService';
import livingRoomImage from '../assets/promotion/living-room.jpg';
import kitchenImage from '../assets/promotion/kitchen.jpg';
import bedroomImage from '../assets/promotion/bedroom.jpg';
import bathroomImage from '../assets/promotion/bathroom.jpg';
import exteriorImage from '../assets/promotion/exterior.jpg';
import beforeAfterImage from '../assets/promotion/before-after.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const NEW_LISTING_CHOICE = 'new-listing-shoot';

type PromotionFormState = {
    name: string;
    email: string;
    listingChoice: string;
};

type PromotionListing = {
    _id: string;
    listingNumber?: number | string;
    listingType?: string;
    propertyType?: string;
    location?: string;
};

const getStoredUserEmail = () => {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return '';
        const user = JSON.parse(raw) as { email?: unknown };
        return typeof user.email === 'string' ? user.email : '';
    } catch {
        return '';
    }
};

const copy = {
    uk: {
        heroEyebrow: 'Преміум просування',
        heroHeadline: 'Ваш об’єкт заслуговує на найкраще',
        heroSubtitle: 'Професійна зйомка, 3D-тур та експертний опис — усе, що потрібно, щоб ваше оголошення виділялось серед тисяч.',
        heroCta: 'Залишити заявку',
        heroScroll: 'Переглянути послуги',
        offerEyebrow: 'Що входить',
        offerTitle: 'Три кроки до сильного оголошення',
        included: 'Входить у пакет',
        service1Title: 'Професійна фотозйомка',
        service1Desc: 'Наші фотографи знімають кожен кут у найкращому світлі. Якісні знімки збільшують кількість переглядів оголошення втричі.',
        service2Title: '3D відео-тур',
        service2Desc: 'Занурте потенційних покупців у простір ще до першого перегляду. Панорамний відео-тур з повним оглядом об’єкта.',
        service3Title: 'Експертний опис',
        service3Desc: 'Наші рієлтори складуть продаючий текст, який підкреслить переваги та прискорить перший контакт.',
        galleryEyebrow: 'Портфоліо',
        galleryTitle: 'Як це виглядає',
        gallerySubtitle: 'Приклади роботи — від звичайного оголошення до преміального пакета',
        before: 'До',
        after: 'Після',
        formEyebrow: 'Почати',
        formTitle: 'Залишити заявку',
        formSubtitle: 'Ми зв’яжемось з вами протягом 24 годин',
        labelName: 'Ваше ім’я',
        labelEmail: 'Електронна пошта',
        labelListing: 'Оголошення для просування',
        newListingOption: 'Ще немає оголошення — потрібна професійна зйомка нового об’єкта',
        listingHelp: 'Для готового оголошення виберіть його зі списку. Якщо оголошення ще не створене, залиште варіант із новою зйомкою.',
        listingsLoading: 'Завантажуємо ваші оголошення...',
        listingsError: 'Не вдалося завантажити ваші оголошення. Можна залишити заявку для нового об’єкта.',
        submitBtn: 'Надіслати заявку',
        submitting: 'Надсилання...',
        successMsg: 'Дякуємо! Ми зв’яжемось з вами найближчим часом.',
        back: 'Повернутись до форми',
        requiredMsg: 'Не вдалося підтягнути ім’я або email з акаунта. Перезайдіть у профіль і спробуйте ще раз.',
        stat1Value: '3x',
        stat1Label: 'більше переглядів',
        stat2Value: '98%',
        stat2Label: 'задоволених клієнтів',
        stat3Value: '24h',
        stat3Label: 'до виходу в ефір',
        lockedTitle: 'Заявка доступна для Standard та Premium',
        lockedText: 'Рекламну частину можна переглядати безкоштовно. Щоб надіслати заявку на просування або професійну зйомку, перейдіть на Standard чи Premium.',
        plans: 'Переглянути тарифи',
    },
    en: {
        heroEyebrow: 'Premium promotion',
        heroHeadline: 'Your property deserves the best',
        heroSubtitle: 'Professional photography, 3D video tour, and expert description — everything you need to stand out among thousands.',
        heroCta: 'Submit a request',
        heroScroll: 'Explore services',
        offerEyebrow: 'What we offer',
        offerTitle: 'Three steps to a stronger listing',
        included: 'Included in package',
        service1Title: 'Professional photography',
        service1Desc: 'Our photographers capture every angle in the best light. Quality photos can triple the number of listing views.',
        service2Title: '3D video tour',
        service2Desc: 'Let potential buyers experience the space before the first visit with a panoramic full-property video tour.',
        service3Title: 'Expert description',
        service3Desc: 'Our real estate specialists prepare persuasive copy that highlights advantages and speeds up the first contact.',
        galleryEyebrow: 'Portfolio',
        galleryTitle: 'See the difference',
        gallerySubtitle: 'Examples of work — from a regular listing to a premium package',
        before: 'Before',
        after: 'After',
        formEyebrow: 'Get started',
        formTitle: 'Submit a request',
        formSubtitle: 'We will contact you within 24 hours',
        labelName: 'Your name',
        labelEmail: 'Email address',
        labelListing: 'Listing to promote',
        newListingOption: 'No listing yet — I need a professional shoot for a new property',
        listingHelp: 'Choose an existing listing from your account, or keep the new-shoot option if the listing is not published yet.',
        listingsLoading: 'Loading your listings...',
        listingsError: 'Could not load your listings. You can still request a new-property shoot.',
        submitBtn: 'Send request',
        submitting: 'Sending...',
        successMsg: 'Thank you! We will contact you shortly.',
        back: 'Back to form',
        requiredMsg: 'We could not read your name or email from the account. Please sign in again and try once more.',
        stat1Value: '3x',
        stat1Label: 'more views',
        stat2Value: '98%',
        stat2Label: 'satisfied clients',
        stat3Value: '24h',
        stat3Label: 'to go live',
        lockedTitle: 'Requests are available for Standard and Premium',
        lockedText: 'You can view the promotion page for free. To submit a promotion or professional shoot request, switch to Standard or Premium.',
        plans: 'View plans',
    },
};

const galleryItems = [
    { label: 'Living room', className: 'is-living', image: livingRoomImage },
    { label: 'Kitchen', className: 'is-kitchen', image: kitchenImage },
    { label: 'Bathroom', className: 'is-bathroom', image: bathroomImage },
    { label: 'Bedroom', className: 'is-bedroom', image: bedroomImage },
    { label: 'Exterior', className: 'is-exterior', image: exteriorImage },
];

const tourScenes = [
    { label: 'Exterior', image: exteriorImage },
    { label: 'Living room', image: livingRoomImage },
    { label: 'Kitchen', image: kitchenImage },
    { label: 'Bedroom', image: bedroomImage },
    { label: 'Bathroom', image: bathroomImage },
];

const CameraIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8h3l2-2h6l2 2h3v12H4z" />
        <circle cx="12" cy="14" r="4" />
    </svg>
);

const VideoIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m16 10 5-3v10l-5-3z" />
    </svg>
);

const TextIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14M5 12h14M5 17h9" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12 4 4 10-10" />
    </svg>
);

const ArrowDownIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export default function PromotionYourListing() {
    const { language } = useLanguage();
    const { canUseStandard, subscribeType, isAdmin } = useSubscription();
    const userId = useAppSelector((state) => state.registration.userId);
    const userName = useAppSelector((state) => state.registration.userName);
    const t = copy[language === 'en' ? 'en' : 'uk'];
    const tour = language === 'en'
        ? {
            eyebrow: '3D tour preview',
            title: 'A short apartment walkthrough',
            subtitle: 'A 30-second visual preview built from the same portfolio photos. Later, it can be replaced with a generated MP4 from Runway, Luma, or Kling without changing the page layout.',
            duration: 'up to 30 sec',
        }
        : {
            eyebrow: '3D-тур preview',
            title: 'Короткий огляд квартири',
            subtitle: '30-секундний візуальний preview з тих самих фото портфоліо. Пізніше його можна замінити згенерованим MP4 з Runway, Luma або Kling без зміни структури сторінки.',
            duration: 'до 30 сек',
        };
    const [userEmail, setUserEmail] = useState(getStoredUserEmail);
    const [form, setForm] = useState<PromotionFormState>({
        name: userName,
        email: userEmail,
        listingChoice: NEW_LISTING_CHOICE,
    });
    const [userListings, setUserListings] = useState<PromotionListing[]>([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [listingsError, setListingsError] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [fieldError, setFieldError] = useState('');
    const formRef = useRef<HTMLDivElement>(null);
    const services = [
        { icon: <CameraIcon />, title: t.service1Title, desc: t.service1Desc, tone: 'is-amber' },
        { icon: <VideoIcon />, title: t.service2Title, desc: t.service2Desc, tone: 'is-teal' },
        { icon: <TextIcon />, title: t.service3Title, desc: t.service3Desc, tone: 'is-violet' },
    ];
    const stats = [
        { value: t.stat1Value, label: t.stat1Label },
        { value: t.stat2Value, label: t.stat2Label },
        { value: t.stat3Value, label: t.stat3Label },
    ];
    const hasAccess = canUseStandard || isAdmin;
    const selectedListing = useMemo(
        () => userListings.find((listing) => listing._id === form.listingChoice),
        [form.listingChoice, userListings],
    );

    useEffect(() => {
        setUserEmail(getStoredUserEmail());
    }, [userId]);

    useEffect(() => {
        setForm((current) => ({
            ...current,
            name: userName,
            email: userEmail,
        }));
    }, [userEmail, userName]);

    useEffect(() => {
        if (!hasAccess || !userId) {
            setUserListings([]);
            setListingsError('');
            setListingsLoading(false);
            return;
        }

        let isMounted = true;
        setListingsLoading(true);
        setListingsError('');

        fetch(`${API_URL}/api/listings/ownerId/${encodeURIComponent(userId)}`, { credentials: 'include' })
            .then(async (response) => {
                const data = await response.json().catch(() => null);
                if (!response.ok) throw new Error(data?.message || data?.error || `Listings request failed: ${response.status}`);
                return Array.isArray(data) ? data.filter((item): item is PromotionListing => Boolean(item?._id)) : [];
            })
            .then((listings) => {
                if (!isMounted) return;
                setUserListings(listings);
            })
            .catch(() => {
                if (!isMounted) return;
                setUserListings([]);
                setListingsError(t.listingsError);
            })
            .finally(() => {
                if (!isMounted) return;
                setListingsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [hasAccess, t.listingsError, userId]);

    const formatListingOption = (listing: PromotionListing) => {
        const number = listing.listingNumber ? `№${listing.listingNumber}` : `ID ${listing._id.slice(-6)}`;
        const type = listing.listingType === 'rent'
            ? (language === 'en' ? 'Rent' : 'Оренда')
            : (language === 'en' ? 'Sale' : 'Продаж');
        return `${number} · ${type}${listing.location ? ` · ${listing.location}` : ''}`;
    };

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
        setFieldError('');
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!hasAccess) return;
        if (!form.name.trim() || !form.email.trim()) {
            setFieldError(t.requiredMsg);
            return;
        }

        setStatus('submitting');
        try {
            const requestType: PromotionRequestType = selectedListing ? 'existing-listing-promotion' : 'new-property-shoot';
            await createPromotionRequest({
                requestType,
                listingId: selectedListing?._id ?? null,
            });
            setStatus('success');
            setForm((current) => ({ ...current, listingChoice: NEW_LISTING_CHOICE }));
        } catch (submitError) {
            setStatus('idle');
            setFieldError(submitError instanceof Error ? submitError.message : t.requiredMsg);
        }
    };

    const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return (
        <main className="dm-promo-page">
            <div className="dm-promo-content">
                <section className="dm-promo-hero">
                    <div className="dm-promo-orb is-one" />
                    <div className="dm-promo-orb is-two" />
                    <div className="dm-promo-grid-bg" />

                    <div className="dm-promo-hero__inner">
                        <span className="dm-promo-eyebrow">
                            <i />
                            {t.heroEyebrow}
                        </span>
                        <h1>
                            <span>{t.heroHeadline.split(' ').slice(0, 2).join(' ')}</span>
                            <strong>{t.heroHeadline.split(' ').slice(2).join(' ')}</strong>
                        </h1>
                        <p>{t.heroSubtitle}</p>

                        <div className="dm-promo-stats">
                            {stats.map((stat) => (
                                <div key={stat.label}>
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="dm-promo-actions">
                            <button className="dm-promo-btn dm-promo-btn--primary" type="button" onClick={scrollToForm}>
                                {t.heroCta}
                            </button>
                            <button className="dm-promo-btn dm-promo-btn--ghost" type="button" onClick={() => document.getElementById('promo-gallery')?.scrollIntoView({ behavior: 'smooth' })}>
                                {t.heroScroll}
                                <ArrowDownIcon />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="dm-promo-section">
                    <div className="dm-promo-section__head">
                        <span>{t.offerEyebrow}</span>
                        <h2>{t.offerTitle}</h2>
                    </div>
                    <div className="dm-promo-services">
                        {services.map((service, index) => (
                            <article className="dm-promo-service" key={service.title}>
                                <div className={`dm-promo-service__icon ${service.tone}`}>{service.icon}</div>
                                <div className="dm-promo-service__number">0{index + 1}</div>
                                <h3>{service.title}</h3>
                                <p>{service.desc}</p>
                                <div className="dm-promo-service__included">
                                    <CheckIcon />
                                    <span>{t.included}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="dm-promo-section" id="promo-gallery">
                    <div className="dm-promo-section__head">
                        <span>{t.galleryEyebrow}</span>
                        <h2>{t.galleryTitle}</h2>
                        <p>{t.gallerySubtitle}</p>
                    </div>
                    <div className="dm-promo-gallery">
                        {galleryItems.map((item, index) => (
                            <article className={`dm-promo-gallery__item ${item.className} ${index === 0 ? 'is-tall' : ''}`} key={item.label}>
                                <img src={item.image} alt={item.label} loading="lazy" />
                                <span>{item.label}</span>
                                {index === 0 ? <em>Premium</em> : null}
                            </article>
                        ))}
                        <article className="dm-promo-gallery__compare">
                            <img src={beforeAfterImage} alt={`${t.before} / ${t.after}`} loading="lazy" />
                            <span>{t.before}</span>
                            <strong>vs</strong>
                            <span>{t.after}</span>
                        </article>
                    </div>
                    <div className="dm-promo-tour">
                        <div className="dm-promo-tour__copy">
                            <span>{tour.eyebrow}</span>
                            <h3>{tour.title}</h3>
                            <p>{tour.subtitle}</p>
                        </div>
                        <div className="dm-promo-tour__screen" aria-label={tour.title}>
                            {tourScenes.map((scene, index) => (
                                <img
                                    key={scene.label}
                                    src={scene.image}
                                    alt={scene.label}
                                    loading="lazy"
                                    style={{ animationDelay: `${index * 6}s` }}
                                />
                            ))}
                            <div className="dm-promo-tour__shade" />
                            <div className="dm-promo-tour__badge">{tour.duration}</div>
                            <div className="dm-promo-tour__progress" aria-hidden="true">
                                {tourScenes.map((scene, index) => (
                                    <span key={scene.label} style={{ animationDelay: `${index * 6}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="dm-promo-section dm-promo-form-section" ref={formRef}>
                    <div className="dm-promo-section__head">
                        <span>{t.formEyebrow}</span>
                        <h2>{t.formTitle}</h2>
                        <p>{t.formSubtitle}</p>
                    </div>
                    <div className="dm-promo-form-card">
                        {!hasAccess ? (
                            <div className="dm-promo-form-lock">
                                <span>{subscribeType} plan</span>
                                <h3>{t.lockedTitle}</h3>
                                <p>{t.lockedText}</p>
                                <Link className="dm-promo-btn dm-promo-btn--ghost" to="/subscription">{t.plans}</Link>
                            </div>
                        ) : status === 'success' ? (
                            <div className="dm-promo-success">
                                <div><CheckIcon /></div>
                                <h3>{t.successMsg}</h3>
                                <button type="button" onClick={() => setStatus('idle')}>{t.back}</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <label>
                                    <span>{t.labelName}</span>
                                    <input name="name" type="text" value={form.name} readOnly />
                                </label>
                                <label>
                                    <span>{t.labelEmail}</span>
                                    <input name="email" type="email" value={form.email} readOnly />
                                </label>
                                <label>
                                    <span>{t.labelListing}</span>
                                    <select
                                        name="listingChoice"
                                        value={form.listingChoice}
                                        onChange={handleChange}
                                        disabled={status === 'submitting'}
                                    >
                                        <option value={NEW_LISTING_CHOICE}>{t.newListingOption}</option>
                                        {userListings.map((listing) => (
                                            <option key={listing._id} value={listing._id}>
                                                {formatListingOption(listing)}
                                            </option>
                                        ))}
                                    </select>
                                    <small>{listingsLoading ? t.listingsLoading : listingsError || t.listingHelp}</small>
                                </label>

                                {fieldError ? <p className="dm-promo-error">{fieldError}</p> : null}

                                <button className="dm-promo-btn dm-promo-btn--primary" type="submit" disabled={status === 'submitting'}>
                                    {status === 'submitting' ? t.submitting : t.submitBtn}
                                </button>
                            </form>
                        )}
                    </div>
                </section>

                <div className="dm-promo-bottom">
                    <div className="dm-promo-footer-line" />
                </div>
            </div>
        </main>
    );
}
