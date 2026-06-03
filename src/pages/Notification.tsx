import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setNotificationProperty } from '../features/notification/notificationSlice';
import { Icons } from '../components/Icons';
import { useSubscription } from '../hooks/useSubscription';

type NotificationForm = {
    listingType: string;
    propertyType: string;
    typeOfNovelty: string;
    minNumbersOfRoom: string;
    maxNumbersOfRoom: string;
    minTotalArea: string;
    maxTotalArea: string;
    minFloor: string;
    maxFloor: string;
    minPrice: string;
    maxPrice: string;
    locationSought: string;
    locationRange: number;
    email: string;
    userId: string;
    lat: number;
    lon: number;
};

const emptyForm = (email: string, userId: string): NotificationForm => ({
    listingType: '',
    propertyType: '',
    typeOfNovelty: '',
    minNumbersOfRoom: '',
    maxNumbersOfRoom: '',
    minTotalArea: '',
    maxTotalArea: '',
    minFloor: '',
    maxFloor: '',
    minPrice: '',
    maxPrice: '',
    locationSought: '',
    locationRange: 10,
    email,
    userId,
    lat: 0,
    lon: 0,
});

const readStoredEmail = () => {
    try {
        const user = localStorage.getItem('user');
        const parsed = user ? JSON.parse(user) : null;
        return typeof parsed?.email === 'string' ? parsed.email : '';
    } catch {
        return '';
    }
};

const toNumber = (value: string) => (value === '' ? 0 : Number(value));

const requiredRangeFields = [
    'minNumbersOfRoom',
    'maxNumbersOfRoom',
    'minTotalArea',
    'maxTotalArea',
    'minFloor',
    'maxFloor',
    'minPrice',
    'maxPrice',
] as const;

const chipGroups = [
    {
        label: 'Операція',
        name: 'listingType',
        options: [
            { value: 'rent', label: 'Оренда' },
            { value: 'sale', label: 'Продаж' },
        ],
    },
    {
        label: 'Тип нерухомості',
        name: 'propertyType',
        options: [
            { value: 'flat', label: 'Квартира' },
            { value: 'private house', label: 'Будинок' },
            { value: 'commercial real estate', label: 'Комерція' },
        ],
    },
    {
        label: 'Фонд',
        name: 'typeOfNovelty',
        options: [
            { value: 'newBuilding', label: 'Новобудова' },
            { value: 'secondaryHousing', label: 'Вторинне житло' },
        ],
    },
];

const rangeFields = [
    ['Кімнати', 'minNumbersOfRoom', 'maxNumbersOfRoom', 'від', 'до'],
    ['Площа, м2', 'minTotalArea', 'maxTotalArea', 'від', 'до'],
    ['Поверх', 'minFloor', 'maxFloor', 'від', 'до'],
    ['Ціна, $', 'minPrice', 'maxPrice', 'від', 'до'],
] as const;

const Notification = () => {
    const { notificationId } = useParams<{ notificationId?: string }>();
    const isEditMode = Boolean(notificationId);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const dispatch = useAppDispatch();
    const userId = useAppSelector((state) => state.registration.userId);
    const subscribeType = useAppSelector((state) => state.registration.subscribeType);
    const { canUseStandard, isAdmin } = useSubscription();
    const canManageNotifications = canUseStandard || isAdmin;

    const initialEmail = useMemo(readStoredEmail, []);
    const [formData, setFormData] = useState<NotificationForm>(() => emptyForm(initialEmail, userId));
    const [saveMessage, setSaveMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData((current) => ({ ...current, userId }));
    }, [userId]);

    useEffect(() => {
        if (!isEditMode || !notificationId) return;

        const controller = new AbortController();
        setErrorMessage('');

        fetch(`${API_URL}/api/notification/${notificationId}`, {
            credentials: 'include',
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
                return response.json();
            })
            .then((data) => {
                setFormData((current) => ({
                    ...current,
                    listingType: data.listingType || '',
                    propertyType: data.propertyType || '',
                    typeOfNovelty: data.typeOfNovelty || '',
                    minNumbersOfRoom: String(data.minNumbersOfRoom || ''),
                    maxNumbersOfRoom: String(data.maxNumbersOfRoom || ''),
                    minTotalArea: String(data.minTotalArea || ''),
                    maxTotalArea: String(data.maxTotalArea || ''),
                    minFloor: String(data.minFloor || ''),
                    maxFloor: String(data.maxFloor || ''),
                    minPrice: String(data.minPrice || ''),
                    maxPrice: String(data.maxPrice || ''),
                    locationSought: data.locationSought || data.location || '',
                    locationRange: Number(data.locationRange || 10),
                    email: data.email || current.email,
                    userId: data.userId || current.userId,
                    lat: Number(data.lat || 0),
                    lon: Number(data.lon || 0),
                }));
            })
            .catch((error) => {
                if (error.name !== 'AbortError') setErrorMessage('Не вдалося завантажити сповіщення для редагування.');
            });

        return () => controller.abort();
    }, [API_URL, isEditMode, notificationId]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: name === 'locationRange' ? Number(value) : value,
        }));
    };

    const handleChipSelect = (name: string, value: string) => {
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleCheckLocation = async () => {
        if (!formData.locationSought.trim()) {
            setErrorMessage('Вкажіть адресу або район для пошуку.');
            return;
        }

        setIsCheckingLocation(true);
        setErrorMessage('');
        setSaveMessage('');

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(formData.locationSought)}`,
            );
            const results = await response.json();
            const first = Array.isArray(results) ? results[0] : null;

            if (!first?.lat || !first?.lon) {
                setErrorMessage('Локацію не знайдено. Спробуйте уточнити адресу.');
                return;
            }

            setFormData((current) => ({
                ...current,
                lat: Number(first.lat),
                lon: Number(first.lon),
                locationSought: first.display_name || current.locationSought,
            }));
        } catch {
            setErrorMessage('Не вдалося перевірити локацію. Спробуйте ще раз.');
        } finally {
            setIsCheckingLocation(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setErrorMessage('');
        setSaveMessage('');

        if (!canManageNotifications) {
            setErrorMessage('Email-сповіщення доступні для активної підписки Standard або Premium.');
            return;
        }

        const hasMissingRequiredFields =
            !formData.listingType ||
            !formData.propertyType ||
            !formData.typeOfNovelty ||
            !formData.locationSought.trim() ||
            !formData.email.trim() ||
            requiredRangeFields.some((field) => formData[field] === '');

        if (hasMissingRequiredFields) {
            setErrorMessage('Заповніть тип угоди, тип нерухомості, фонд, усі діапазони, локацію та email.');
            return;
        }

        const notificationPayload = {
            ...formData,
            minNumbersOfRoom: toNumber(formData.minNumbersOfRoom),
            maxNumbersOfRoom: toNumber(formData.maxNumbersOfRoom),
            minTotalArea: toNumber(formData.minTotalArea),
            maxTotalArea: toNumber(formData.maxTotalArea),
            minFloor: toNumber(formData.minFloor),
            maxFloor: toNumber(formData.maxFloor),
            minPrice: toNumber(formData.minPrice),
            maxPrice: toNumber(formData.maxPrice),
        };

        setIsSaving(true);

        dispatch(
            setNotificationProperty({
                listingType: notificationPayload.listingType,
                propertyType: notificationPayload.propertyType,
                typeOfNovelty: notificationPayload.typeOfNovelty,
                minNumbersOfRoom: notificationPayload.minNumbersOfRoom,
                maxNumbersOfRoom: notificationPayload.maxNumbersOfRoom,
                minTotalArea: notificationPayload.minTotalArea,
                maxTotalArea: notificationPayload.maxTotalArea,
                minFloor: notificationPayload.minFloor,
                maxFloor: notificationPayload.maxFloor,
                minPrice: notificationPayload.minPrice,
                maxPrice: notificationPayload.maxPrice,
                location: notificationPayload.locationSought,
                locationRange: notificationPayload.locationRange,
                email: notificationPayload.email,
            }),
        );

        try {
            const response = await fetch(
                isEditMode && notificationId ? `${API_URL}/api/notification/${notificationId}` : `${API_URL}/api/notification`,
                {
                    method: isEditMode ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(notificationPayload),
                },
            );

            if (!response.ok) throw new Error(`Save error: ${response.status}`);

            setSaveMessage(isEditMode ? 'Сповіщення оновлено.' : 'Сповіщення створено.');
            if (!isEditMode) setFormData(emptyForm(initialEmail, userId));
        } catch {
            setErrorMessage('Не вдалося зберегти сповіщення. Перевірте сервер або спробуйте пізніше.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="dm-notification-page">
            <section className="dm-section dm-notification-hero">
                <div>
                    <span className="dm-kicker">Smart alerts</span>
                    <h1>{isEditMode ? 'Редагувати сповіщення' : 'Сповіщення про нові обʼєкти'}</h1>
                    <p>
                        Збережіть критерії пошуку, і сервіс повідомить вас, коли зʼявляться відповідні оголошення.
                    </p>
                </div>
                <div className="dm-notification-note">
                    <Icons.info />
                    <div>
                        <strong>{canManageNotifications ? 'Доступ активний' : 'Сервіс для Standard/Premium'}</strong>
                        <span>
                            {canManageNotifications
                                ? subscribeType === 'Standard'
                                    ? 'Standard дозволяє 1 активний запит. Premium дозволяє кілька запитів. Для кожного email діє ліміт 4 листи за 24 години.'
                                    : 'Premium дозволяє створювати кілька запитів. Для кожного email діє ліміт 4 листи за 24 години.'
                                : 'Оформіть Standard або Premium, щоб отримувати листи, коли нове оголошення відповідає вашим критеріям.'}
                        </span>
                    </div>
                </div>
            </section>

            {!canManageNotifications && (
                <section className="dm-section dm-notification-gate">
                    <div>
                        <span>Потрібна підписка</span>
                        <h2>Автоматичні email-сповіщення доступні з тарифу Standard</h2>
                        <p>Після активації підписки ви зможете зберегти параметри пошуку і отримувати листи з відповідними новими оголошеннями.</p>
                    </div>
                    <Link className="dm-btn dm-btn--accent" to="/subscription">Перейти до тарифів</Link>
                </section>
            )}

            <section className="dm-section dm-notification-layout">
                <form className={canManageNotifications ? 'dm-notification-form' : 'dm-notification-form is-locked'} onSubmit={handleSubmit}>
                    {chipGroups.map((group) => (
                        <div className="dm-form-block" key={group.name}>
                            <label>{group.label}</label>
                            <div className="dm-chip-row">
                                {group.options.map((option) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        className={`dm-chip ${formData[group.name as keyof NotificationForm] === option.value ? 'is-active' : ''}`}
                                        onClick={() => handleChipSelect(group.name, option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="dm-notification-ranges">
                        {rangeFields.map(([label, minName, maxName, minPlaceholder, maxPlaceholder]) => (
                            <div className="dm-range-field" key={minName}>
                                <label>{label}</label>
                                <div>
                                    <input
                                        type="number"
                                        name={minName}
                                        value={formData[minName]}
                                        onChange={handleChange}
                                        placeholder={minPlaceholder}
                                    />
                                    <input
                                        type="number"
                                        name={maxName}
                                        value={formData[maxName]}
                                        onChange={handleChange}
                                        placeholder={maxPlaceholder}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="dm-form-block">
                        <label>Локація</label>
                        <div className="dm-location-control">
                            <input
                                type="text"
                                name="locationSought"
                                value={formData.locationSought}
                                onChange={handleChange}
                                placeholder="Місто, район або адреса"
                                required
                            />
                            <button className="dm-btn dm-btn--ghost" type="button" onClick={handleCheckLocation}>
                                {isCheckingLocation ? 'Перевіряю...' : 'Перевірити'}
                            </button>
                        </div>
                        <div className="dm-radius-control">
                            <span>Радіус пошуку</span>
                            <strong>{formData.locationRange} км</strong>
                            <input
                                type="range"
                                name="locationRange"
                                min="2"
                                max="25"
                                value={formData.locationRange}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="dm-form-block">
                        <label htmlFor="notification-email">Email для сповіщень</label>
                        <input
                            id="notification-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    {errorMessage && <p className="dm-form-message is-error">{errorMessage}</p>}
                    {saveMessage && (
                        <div className="dm-form-message is-success">
                            <span>{saveMessage}</span>
                            <Link to="/my-notifications">Перейти до моїх сповіщень</Link>
                        </div>
                    )}

                    <button className="dm-btn dm-btn--accent dm-btn--lg" type="submit" disabled={isSaving || !canManageNotifications}>
                        {isSaving ? 'Зберігаю...' : isEditMode ? 'Оновити сповіщення' : 'Створити сповіщення'}
                    </button>
                </form>

                <aside className="dm-location-preview">
                    <div className="dm-location-preview__icon">
                        <Icons.pin width={24} height={24} />
                    </div>
                    <h2>Зона пошуку</h2>
                    <p>{formData.locationSought || 'Перевірте адресу, щоб закріпити координати для пошуку.'}</p>
                    {formData.lat && formData.lon ? (
                        <>
                            <dl>
                                <div>
                                    <dt>Широта</dt>
                                    <dd>{formData.lat.toFixed(5)}</dd>
                                </div>
                                <div>
                                    <dt>Довгота</dt>
                                    <dd>{formData.lon.toFixed(5)}</dd>
                                </div>
                                <div>
                                    <dt>Радіус</dt>
                                    <dd>{formData.locationRange} км</dd>
                                </div>
                            </dl>
                            <a
                                className="dm-btn dm-btn--ghost"
                                href={`https://www.openstreetmap.org/?mlat=${formData.lat}&mlon=${formData.lon}#map=14/${formData.lat}/${formData.lon}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Відкрити карту
                            </a>
                        </>
                    ) : (
                        <div className="dm-location-preview__empty">Карта Leaflet буде доречною після перенесення map-блоку.</div>
                    )}
                </aside>
            </section>
        </main>
    );
};

export default Notification;
