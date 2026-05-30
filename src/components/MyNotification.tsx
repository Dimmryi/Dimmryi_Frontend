import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useIsAdmin } from '../app/hooks';
import { Icons } from './Icons';

interface UserNotification {
    _id: string;
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
    date: number;
}

const rangeLabel = (min: string, max: string, unit = '') => {
    if (!min && !max) return '';
    const value = min && max ? `${min} - ${max}` : min || max;
    return unit ? `${value} ${unit}` : value;
};

const typeLabel = (value: string) => {
    const map: Record<string, string> = {
        rent: 'Оренда',
        sale: 'Продаж',
        flat: 'Квартира',
        'private house': 'Будинок',
        'commercial real estate': 'Комерція',
        commercial: 'Комерція',
        newBuilding: 'Новобудова',
        secondaryHousing: 'Вторинне житло',
    };
    return map[value] || value;
};

const MyNotification = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const userName = useAppSelector((state) => state.registration.userName);
    const userId = useAppSelector((state) => state.registration.userId);
    const isAdmin = useIsAdmin();

    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        if (!isAdmin && !userId) {
            setNotifications([]);
            setError('');
            setIsLoading(false);
            return () => controller.abort();
        }

        const url = isAdmin ? `${API_URL}/notifications` : `${API_URL}/api/notifications/authorId/${userId}`;

        setError('');
        setIsLoading(true);

        fetch(url, { credentials: 'include', signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
                return response.json();
            })
            .then((data) => {
                const nextNotifications: UserNotification[] = Array.isArray(data) ? data : data?._id ? [data] : [];
                setNotifications(nextNotifications.filter((notification) => notification?._id));
            })
            .catch((caughtError) => {
                if (caughtError.name !== 'AbortError') setError('Не вдалося завантажити сповіщення.');
            })
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [API_URL, isAdmin, refreshKey, userId]);

    const handleDelete = async (notificationId: string) => {
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) throw new Error(`Delete error: ${response.status}`);
            setRefreshKey((key) => key + 1);
        } catch {
            setError('Не вдалося видалити сповіщення.');
        }
    };

    return (
        <main className="dm-my-notifications-page">
            <section className="dm-section dm-my-notifications-head">
                <div>
                    <span className="dm-kicker">Saved alerts</span>
                    <h1>{userName ? `${userName}, ваші сповіщення` : 'Мої сповіщення'}</h1>
                    <p>Тут зібрані критерії, за якими сервіс відстежує нові оголошення.</p>
                </div>
                <Link className="dm-btn dm-btn--accent" to="/notification">
                    Створити сповіщення
                </Link>
            </section>

            <section className="dm-section">
                {error && <p className="dm-listings-status is-error">{error}</p>}

                {isLoading ? (
                    <p className="dm-listings-status">Завантажую сповіщення...</p>
                ) : notifications.length === 0 ? (
                    <div className="dm-empty-state">
                        <div className="dm-empty-state__icon">
                            <Icons.info width={28} height={28} />
                        </div>
                        <h2>Сповіщень ще немає</h2>
                        <p>Створіть перше сповіщення, щоб не перевіряти нові обʼєкти вручну.</p>
                        <Link className="dm-btn dm-btn--accent" to="/notification">
                            Налаштувати пошук
                        </Link>
                    </div>
                ) : (
                    <ul className="dm-notification-list">
                        {notifications.map((notification) => {
                            const date = notification.date
                                ? new Date(Number(notification.date)).toLocaleString('uk-UA', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : 'Без дати';

                            return (
                                <li className="dm-notification-card" key={notification._id}>
                                    <div className="dm-notification-card__top">
                                        <span>{date}</span>
                                        {notification.listingType && (
                                            <strong className={notification.listingType === 'rent' ? 'is-rent' : 'is-sale'}>
                                                {typeLabel(notification.listingType)}
                                            </strong>
                                        )}
                                    </div>

                                    <div className="dm-notification-card__chips">
                                        {notification.propertyType && <span>{typeLabel(notification.propertyType)}</span>}
                                        {notification.typeOfNovelty && <span>{typeLabel(notification.typeOfNovelty)}</span>}
                                    </div>

                                    <dl className="dm-notification-card__ranges">
                                        {rangeLabel(notification.minNumbersOfRoom, notification.maxNumbersOfRoom) && (
                                            <div>
                                                <dt>Кімнати</dt>
                                                <dd>{rangeLabel(notification.minNumbersOfRoom, notification.maxNumbersOfRoom)}</dd>
                                            </div>
                                        )}
                                        {rangeLabel(notification.minTotalArea, notification.maxTotalArea, 'м2') && (
                                            <div>
                                                <dt>Площа</dt>
                                                <dd>{rangeLabel(notification.minTotalArea, notification.maxTotalArea, 'м2')}</dd>
                                            </div>
                                        )}
                                        {rangeLabel(notification.minFloor, notification.maxFloor) && (
                                            <div>
                                                <dt>Поверх</dt>
                                                <dd>{rangeLabel(notification.minFloor, notification.maxFloor)}</dd>
                                            </div>
                                        )}
                                        {rangeLabel(notification.minPrice, notification.maxPrice, '$') && (
                                            <div>
                                                <dt>Ціна</dt>
                                                <dd>{rangeLabel(notification.minPrice, notification.maxPrice, '$')}</dd>
                                            </div>
                                        )}
                                    </dl>

                                    <div className="dm-notification-card__location">
                                        <Icons.pin />
                                        <span>{notification.locationSought || 'Локація не вказана'}</span>
                                        {notification.locationRange ? <em>{notification.locationRange} км</em> : null}
                                    </div>

                                    {(isAdmin || notification.email) && (
                                        <div className="dm-notification-card__email">
                                            {isAdmin ? 'Власник: ' : 'Email: '}
                                            <span>{notification.email}</span>
                                        </div>
                                    )}

                                    <div className="dm-notification-card__actions">
                                        <Link className="dm-btn dm-btn--ghost" to={`/notification/edit/${notification._id}`}>
                                            Редагувати
                                        </Link>
                                        <button className="dm-btn dm-btn--danger" type="button" onClick={() => handleDelete(notification._id)}>
                                            Видалити
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </main>
    );
};

export default MyNotification;
