import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { addListingWithComparison, fetchListingById, updateListing } from '../services/ListingService';
import { Icons } from '../components/Icons';
import type { RootState } from '../store/store';

type ListingType = 'sale' | 'rent';

interface FormState {
    listingType: ListingType;
    propertyType: string;
    typeOfNovelty: string;
    numbersOfRooms: string;
    totalArea: string;
    numberOfFloor: string;
    numberOfStoreysOfBuilding: string;
    apartmentDetails: string;
    description: string;
    contact: string;
    location: string;
    price: string;
}

interface MediaAsset {
    url: string;
    publicId: string;
}

interface ExistingListing {
    listingType?: ListingType;
    propertyType?: string;
    typeOfNovelty?: string;
    numbersOfRooms?: string | number;
    totalArea?: string | number;
    numberOfFloor?: string | number;
    numberOfStoreysOfBuilding?: string | number;
    apartmentDetails?: string;
    description?: string;
    contact?: string;
    location?: string;
    price?: string | number;
    image?: string[];
    video?: string[];
    videoUrl?: string;
    email?: string;
    owner?: string;
    ownerId?: string;
    lat?: string | number;
    lon?: string | number;
    coordinates?: {
        lat?: string | number;
        lon?: string | number;
    };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME || '';
const PRESET_VALUE = import.meta.env.VITE_PRESET_VALUE || '';
const MAX_VIDEO_SIZE = 10 * 1024 * 1024;

const initialForm = (listingType: ListingType): FormState => ({
    listingType,
    propertyType: '',
    typeOfNovelty: '',
    numbersOfRooms: '',
    totalArea: '',
    numberOfFloor: '',
    numberOfStoreysOfBuilding: '',
    apartmentDetails: '',
    description: '',
    contact: '',
    location: '',
    price: '',
});

const isPrivilegedMediaUser = (subscribeType: string, role: string | null) =>
    role === 'admin' || subscribeType === 'Standard' || subscribeType === 'Premium';

const getCloudinaryPublicId = (url: string) => {
    const marker = '/upload/';
    const uploadIndex = url.indexOf(marker);
    if (uploadIndex === -1) return '';

    const afterUpload = url.slice(uploadIndex + marker.length).split('?')[0];
    const withoutTransforms = afterUpload.replace(/^(?:[^/]+\/)*v\d+\//, '');
    return withoutTransforms.replace(/\.[^/.]+$/, '');
};

const toMediaAsset = (url: string): MediaAsset => ({
    url,
    publicId: getCloudinaryPublicId(url),
});

const extractListingId = (response: Record<string, unknown> | null | undefined) => {
    const listing = response?.listing as { _id?: string; id?: string } | undefined;
    const createdListing = response?.createdListing as { _id?: string; id?: string } | undefined;
    return listing?._id || listing?.id || createdListing?._id || createdListing?.id || (response?._id as string | undefined) || (response?.id as string | undefined);
};

const findRecentlyCreatedListingId = async (ownerId: string, payload: FormState) => {
    if (!ownerId) return '';

    const response = await fetch(`${API_URL}/api/listings/ownerId/${encodeURIComponent(ownerId)}`, {
        credentials: 'include',
    });
    const listings = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(listings)) return '';

    const matchingListings = listings
        .filter((listing) => {
            if (!listing?._id) return false;
            return (
                listing.listingType === payload.listingType &&
                listing.propertyType === payload.propertyType &&
                String(listing.price ?? '') === String(payload.price) &&
                String(listing.location ?? '') === String(payload.location) &&
                String(listing.apartmentDetails ?? '') === String(payload.apartmentDetails)
            );
        })
        .sort((a, b) => Number(b.date || 0) - Number(a.date || 0));

    return matchingListings[0]?._id || listings.sort((a, b) => Number(b.date || 0) - Number(a.date || 0))[0]?._id || '';
};

const uploadToCloudinary = async (file: File, resourceType: 'image' | 'video') => {
    if (!CLOUD_NAME || !PRESET_VALUE) {
        throw new Error('Cloudinary env variables are not configured.');
    }

    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', PRESET_VALUE);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
        method: 'POST',
        body,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message || 'Upload failed.');
    }

    return {
        url: data.secure_url as string,
        publicId: data.public_id as string,
    };
};

const deleteFromCloudinary = async (asset: MediaAsset, resourceType: 'image' | 'video') => {
    if (!asset.publicId) return;
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePath = resourceType === 'video' ? 'generate-signature-to-delete-video' : 'generate-signature';
    const signatureResponse = await fetch(`${API_URL}/${signaturePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: asset.publicId, timestamp }),
    });
    const signature = await signatureResponse.json();
    if (!signatureResponse.ok) {
        throw new Error(signature?.message || 'Could not create Cloudinary delete signature.');
    }

    const destroyResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            public_id: asset.publicId,
            api_key: signature.api_key,
            timestamp: signature.timestamp,
            signature: signature.signature,
        }),
    });
    const destroyResult = await destroyResponse.json();
    if (!destroyResponse.ok || destroyResult.result === 'not found') {
        throw new Error(destroyResult?.error?.message || 'Cloudinary asset was not deleted.');
    }
};

export default function ListingForm() {
    const navigate = useNavigate();
    const { listingId } = useParams<{ listingId?: string }>();
    const isEditMode = Boolean(listingId);
    const listingFormPath = isEditMode && listingId ? `/listings/edit/${listingId}` : '/listings/new';
    const isRegistered = useSelector((state: RootState) => state.registration.isRegistered);
    const role = useSelector((state: RootState) => state.registration.role);
    const ownerName = useSelector((state: RootState) => state.registration.userName);
    const ownerId = useSelector((state: RootState) => state.registration.userId);
    const subscribeType = useSelector((state: RootState) => state.registration.subscribeType);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isLogin);
    const authChecking = useSelector((state: RootState) => state.auth.isChecking);
    const canUseExtendedMedia = isPrivilegedMediaUser(subscribeType, role);
    const imageLimit = canUseExtendedMedia ? 8 : 6;

    const [form, setForm] = useState<FormState>(() => initialForm('sale'));
    const [images, setImages] = useState<MediaAsset[]>([]);
    const [videoAsset, setVideoAsset] = useState<MediaAsset | null>(null);
    const [existingListing, setExistingListing] = useState<ExistingListing | null>(null);
    const [isLoadingListing, setIsLoadingListing] = useState(false);
    const [coords, setCoords] = useState({ lat: 0, lon: 0 });
    const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const sessionExpiry = Number(localStorage.getItem('sessionExpiry') || 0);
    const isSessionAlive = isAuthenticated && sessionExpiry > Date.now();

    useEffect(() => {
        if (authChecking) return;

        if (!isRegistered) {
            navigate('/registration', {
                replace: true,
                state: {
                    notice: 'Вам потрібно зареєструватись, щоб розмістити оголошення.',
                    from: listingFormPath,
                },
            });
            return;
        }

        if (!isSessionAlive) {
            navigate('/login', {
                replace: true,
                state: {
                    notice: 'Вам потрібно увійти, щоб розмістити оголошення.',
                    from: listingFormPath,
                },
            });
        }
    }, [authChecking, isRegistered, isSessionAlive, listingFormPath, navigate]);

    useEffect(() => {
        if (!isEditMode || !listingId || authChecking || !isRegistered || !isSessionAlive) return;

        let isMounted = true;
        const loadListing = async () => {
            try {
                setIsLoadingListing(true);
                setMessage(null);
                const listing = (await fetchListingById(listingId)) as ExistingListing | null;
                if (!isMounted || !listing) return;

                const lat = listing.coordinates?.lat ?? listing.lat ?? 0;
                const lon = listing.coordinates?.lon ?? listing.lon ?? 0;
                const videoUrl = listing.video?.find(Boolean) || listing.videoUrl || '';

                setExistingListing(listing);
                setForm({
                    listingType: listing.listingType || 'sale',
                    propertyType: listing.propertyType || '',
                    typeOfNovelty: listing.typeOfNovelty || '',
                    numbersOfRooms: String(listing.numbersOfRooms ?? ''),
                    totalArea: String(listing.totalArea ?? ''),
                    numberOfFloor: String(listing.numberOfFloor ?? ''),
                    numberOfStoreysOfBuilding: String(listing.numberOfStoreysOfBuilding ?? ''),
                    apartmentDetails: listing.apartmentDetails || '',
                    description: listing.description || '',
                    contact: listing.contact || '',
                    location: listing.location || '',
                    price: String(listing.price ?? ''),
                });
                setImages((listing.image || []).filter(Boolean).map(toMediaAsset));
                setVideoAsset(videoUrl ? toMediaAsset(videoUrl) : null);
                setCoords({ lat: Number(lat) || 0, lon: Number(lon) || 0 });
            } catch (error) {
                setMessage({
                    type: 'error',
                    text: error instanceof Error ? error.message : 'Не вдалося завантажити оголошення для редагування.',
                });
            } finally {
                if (isMounted) setIsLoadingListing(false);
            }
        };

        loadListing();

        return () => {
            isMounted = false;
        };
    }, [authChecking, isEditMode, isRegistered, isSessionAlive, listingId]);

    const completedRequired = useMemo(() => {
        const required = [
            form.listingType,
            form.propertyType,
            form.typeOfNovelty,
            form.numbersOfRooms,
            form.totalArea,
            form.apartmentDetails,
            form.description,
            form.contact,
            form.location,
            form.price,
        ];
        return required.every(Boolean) && images.length >= 2;
    }, [form, images.length]);

    const readiness = useMemo(
        () => [
            { label: 'Тип угоди', done: Boolean(form.listingType) },
            { label: 'Тип нерухомості', done: Boolean(form.propertyType && form.typeOfNovelty) },
            { label: 'Площа та кімнати', done: Boolean(form.numbersOfRooms && form.totalArea) },
            { label: 'Опис і ціна', done: Boolean(form.apartmentDetails && form.description && form.price) },
            { label: 'Адреса та контакт', done: Boolean(form.location && form.contact) },
            { label: 'Мінімум 2 фото', done: images.length >= 2 },
        ],
        [form, images.length],
    );

    const readyCount = readiness.filter((item) => item.done).length;
    const propertyLabel =
        form.propertyType === 'flat'
            ? 'Квартира'
            : form.propertyType === 'private house'
              ? 'Приватний будинок'
              : form.propertyType === 'commercial real estate'
                ? 'Комерційна нерухомість'
                : 'Тип не вибрано';
    const listingTypeLabel = form.listingType === 'rent' ? 'Оренда' : 'Продаж';
    const coverImage = images[0]?.url;

    const updateForm = (field: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateForm(event.target.name as keyof FormState, event.target.value);
    };

    const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []).slice(0, imageLimit - images.length);
        if (!files.length) return;

        try {
            setUploading('image');
            const uploaded = await Promise.all(files.map((file) => uploadToCloudinary(file, 'image')));
            setImages((prev) => [...prev, ...uploaded].slice(0, imageLimit));
            setMessage({ type: 'success', text: 'Фото додано.' });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося завантажити фото.' });
        } finally {
            setUploading(null);
            event.target.value = '';
        }
    };

    const handleVideoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_VIDEO_SIZE) {
            setMessage({ type: 'error', text: 'Відео має бути до 10 MB.' });
            event.target.value = '';
            return;
        }

        try {
            setUploading('video');
            const uploaded = await uploadToCloudinary(file, 'video');
            if (videoAsset) await deleteFromCloudinary(videoAsset, 'video');
            setVideoAsset(uploaded);
            setMessage({ type: 'success', text: 'Відео додано.' });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося завантажити відео.' });
        } finally {
            setUploading(null);
            event.target.value = '';
        }
    };

    const handleImageDelete = async (asset: MediaAsset) => {
        try {
            await deleteFromCloudinary(asset, 'image');
            setImages((prev) => prev.filter((image) => image.publicId !== asset.publicId));
            setMessage({ type: 'success', text: 'Фото видалено з Cloudinary.' });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося видалити фото з Cloudinary.' });
        }
    };

    const handleVideoDelete = async () => {
        if (!videoAsset) return;
        try {
            await deleteFromCloudinary(videoAsset, 'video');
            setVideoAsset(null);
            setMessage({ type: 'success', text: 'Відео видалено з Cloudinary.' });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося видалити відео з Cloudinary.' });
        }
    };

    const handleCheckAddress = async () => {
        if (!form.location.trim()) {
            setMessage({ type: 'error', text: 'Вкажіть адресу перед перевіркою.' });
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.location)}`);
            const data = await response.json();
            if (!Array.isArray(data) || !data.length) {
                setMessage({ type: 'error', text: 'Адресу не знайдено. Спробуйте уточнити місто або вулицю.' });
                return;
            }
            const nextCoords = { lat: Number(data[0].lat), lon: Number(data[0].lon) };
            setCoords(nextCoords);
            setMessage({ type: 'success', text: 'Адресу знайдено. Координати додано до оголошення.' });
        } catch {
            setMessage({ type: 'error', text: 'Не вдалося перевірити адресу.' });
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (isLoadingListing) {
            setMessage({ type: 'info', text: 'Дочекайтесь завантаження оголошення.' });
            return;
        }

        if (!completedRequired || isSubmitting) {
            setMessage({ type: 'info', text: 'Заповніть обов’язкові поля та додайте мінімум 2 фото.' });
            return;
        }

        const userString = localStorage.getItem('user');
        const userEmail = userString ? JSON.parse(userString).email : '';
        const payloadEmail = userEmail || existingListing?.email || '';
        const payloadOwner = ownerName || existingListing?.owner || '';
        const payloadOwnerId = ownerId || existingListing?.ownerId || '';

        if (!isEditMode && (!payloadEmail || !payloadOwner || !payloadOwnerId)) {
            setMessage({
                type: 'error',
                text: 'Не вдалося визначити користувача для створення оголошення. Оновіть сторінку або увійдіть повторно.',
            });
            return;
        }

        const payload = {
            ...form,
            email: payloadEmail,
            owner: payloadOwner,
            ownerId: payloadOwnerId,
            image: images.map((image) => image.url),
            video: videoAsset ? [videoAsset.url] : [],
            videoUrl: videoAsset?.url || '',
            lat: String(coords.lat),
            lon: String(coords.lon),
        };

        try {
            setIsSubmitting(true);
            if (isEditMode && listingId) {
                const response = await updateListing(listingId, payload);
                setMessage({ type: 'success', text: response?.message || 'Оголошення успішно оновлено.' });
                navigate(`/details/${listingId}`);
                return;
            }

            const response = await addListingWithComparison(payload);
            console.info('Listing create response:', response);
            const createdListingId = extractListingId(response) || (await findRecentlyCreatedListingId(payloadOwnerId, form));
            if (!createdListingId && !response?.message) {
                setMessage({
                    type: 'info',
                    text: 'Сервер відповів без помилки, але не повернув створене оголошення. Перевірте MongoDB або відповідь API.',
                });
                return;
            }
            setMessage({ type: 'success', text: response?.message || 'Оголошення успішно опубліковано.' });
            navigate(createdListingId ? `/details/${createdListingId}` : '/my-listings');
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : isEditMode ? 'Не вдалося оновити оголошення.' : 'Не вдалося опублікувати оголошення.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="dm-listing-form-page">
            <section className="dm-listing-form-hero">
                <div>
                    <div className="dm-eyebrow">{isEditMode ? 'Edit listing' : 'New listing'}</div>
                    <h1 className="dm-h2">{isEditMode ? 'Редагувати оголошення' : 'Розмістити оголошення'}</h1>
                    <p>
                        {isEditMode
                            ? 'Оновіть дані, медіа або координати об’єкта. Після збереження сторінка деталей і ваш список оголошень отримають актуальні дані.'
                            : 'Заповніть ключові дані про об’єкт. На телефоні форма йде однією сторінкою з короткими секціями, щоб легко повернутися до будь-якого поля.'}
                    </p>
                </div>
                <div className="dm-listing-form-plan">
                    <span>{role === 'admin' ? 'Admin доступ' : canUseExtendedMedia ? `${subscribeType} план` : 'Free план'}</span>
                    <strong>{imageLimit} фото{canUseExtendedMedia ? ' + відео до 10 MB' : ''}</strong>
                </div>
            </section>

            <form className="dm-listing-form-shell" onSubmit={handleSubmit}>
                <div className="dm-listing-form-main">
                    <section className="dm-listing-form-card">
                        <SectionTitle index="01" title="Тип оголошення" />
                        <div className="dm-listing-form-segment">
                            <ChoiceButton active={form.listingType === 'sale'} onClick={() => updateForm('listingType', 'sale')}>
                                Продаж
                            </ChoiceButton>
                            <ChoiceButton active={form.listingType === 'rent'} onClick={() => updateForm('listingType', 'rent')}>
                                Оренда
                            </ChoiceButton>
                        </div>
                    </section>

                    <section className="dm-listing-form-card">
                        <SectionTitle index="02" title="Характеристики" />
                        <div className="dm-listing-form-options">
                            {[
                                ['flat', 'Квартира'],
                                ['private house', 'Приватний будинок'],
                                ['commercial real estate', 'Комерційна'],
                            ].map(([value, label]) => (
                                <ChoiceButton key={value} active={form.propertyType === value} onClick={() => updateForm('propertyType', value)}>
                                    {label}
                                </ChoiceButton>
                            ))}
                        </div>
                        <div className="dm-listing-form-options">
                            <ChoiceButton active={form.typeOfNovelty === 'newBuilding'} onClick={() => updateForm('typeOfNovelty', 'newBuilding')}>
                                Новобудова
                            </ChoiceButton>
                            <ChoiceButton
                                active={form.typeOfNovelty === 'secondaryHousing'}
                                onClick={() => updateForm('typeOfNovelty', 'secondaryHousing')}
                            >
                                Вторинне житло
                            </ChoiceButton>
                        </div>
                        <div className="dm-listing-form-grid">
                            <TextField label="Кімнат" name="numbersOfRooms" type="number" value={form.numbersOfRooms} onChange={handleInputChange} />
                            <TextField label="Площа, м²" name="totalArea" type="number" value={form.totalArea} onChange={handleInputChange} />
                            <TextField label="Поверх" name="numberOfFloor" type="number" value={form.numberOfFloor} onChange={handleInputChange} />
                            <TextField
                                label="Поверхів у будинку"
                                name="numberOfStoreysOfBuilding"
                                type="number"
                                value={form.numberOfStoreysOfBuilding}
                                onChange={handleInputChange}
                            />
                        </div>
                    </section>

                    <section className="dm-listing-form-card">
                        <SectionTitle index="03" title="Опис, ціна та контакт" />
                        <TextArea
                            label="Короткі деталі"
                            name="apartmentDetails"
                            value={form.apartmentDetails}
                            onChange={handleInputChange}
                            placeholder="Наприклад: 2 кімнати, світла кухня, поряд метро"
                        />
                        <TextArea
                            label="Повний опис"
                            name="description"
                            value={form.description}
                            onChange={handleInputChange}
                            placeholder="Опишіть стан, переваги, умови продажу або оренди"
                        />
                        <div className="dm-listing-form-grid">
                            <TextField label="Ціна" name="price" type="number" value={form.price} onChange={handleInputChange} />
                            <TextField label="Контакт" name="contact" value={form.contact} onChange={handleInputChange} />
                        </div>
                        <div className="dm-listing-form-location">
                            <TextField label="Адреса" name="location" value={form.location} onChange={handleInputChange} />
                            <button className="dm-btn dm-btn--ghost" type="button" onClick={handleCheckAddress}>
                                {Icons.pin()} Перевірити
                            </button>
                        </div>
                    </section>

                    <section className="dm-listing-form-card">
                        <SectionTitle index="04" title="Медіа" />
                        <div className="dm-upload-zone">
                            <input type="file" accept="image/*" multiple onChange={handleImageSelect} disabled={images.length >= imageLimit || uploading !== null} />
                            <span>{uploading === 'image' ? 'Завантаження фото...' : `Додати фото (${images.length}/${imageLimit})`}</span>
                        </div>
                        {images.length > 0 && (
                            <div className="dm-listing-form-preview">
                                {images.map((asset, index) => (
                                    <button key={asset.publicId || asset.url} type="button" onClick={() => handleImageDelete(asset)}>
                                        <img src={asset.url} alt={`Фото ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                        {canUseExtendedMedia ? (
                            <div className="dm-upload-zone dm-upload-zone--video">
                                <input type="file" accept="video/*" onChange={handleVideoSelect} disabled={uploading !== null} />
                                <span>{uploading === 'video' ? 'Завантаження відео...' : videoAsset ? 'Відео додано' : 'Додати відео до 10 MB'}</span>
                            </div>
                        ) : (
                            <div className="dm-listing-form-upgrade">
                                Відео та 8 фото доступні для тарифів Standard, Premium і admin.
                            </div>
                        )}
                        {videoAsset ? (
                            <button className="dm-listing-form-remove" type="button" onClick={handleVideoDelete}>
                                Видалити відео з Cloudinary
                            </button>
                        ) : null}
                    </section>
                </div>

                <aside className="dm-listing-form-aside" aria-label="Попередній перегляд оголошення">
                    <div className="dm-listing-preview-card">
                        <div className="dm-listing-preview-card__media">
                            {coverImage ? <img src={coverImage} alt="Обкладинка оголошення" /> : <span>Фото обкладинки</span>}
                        </div>
                        <div className="dm-listing-preview-card__body">
                            <div className="dm-listing-preview-card__top">
                                <span>{listingTypeLabel}</span>
                                <em>{images.length}/{imageLimit} фото</em>
                            </div>
                            <strong>{form.price ? `₴${form.price}` : 'Ціна не вказана'}</strong>
                            <p>{form.apartmentDetails || propertyLabel}</p>
                            <div className="dm-listing-preview-card__chips">
                                {form.numbersOfRooms ? <span>{form.numbersOfRooms} кімн</span> : null}
                                {form.totalArea ? <span>{form.totalArea} м²</span> : null}
                                {videoAsset ? <span>Відео</span> : null}
                            </div>
                            <small>{form.location || 'Адресу ще не додано'}</small>
                        </div>
                    </div>

                    <div className="dm-listing-readiness">
                        <div>
                            <span>Готовність</span>
                            <strong>{readyCount}/{readiness.length}</strong>
                        </div>
                        <progress value={readyCount} max={readiness.length} />
                        <ul>
                            {readiness.map((item) => (
                                <li key={item.label} className={item.done ? 'is-done' : ''}>
                                    <span>{item.done ? '✓' : '•'}</span>
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {isLoadingListing ? <div className="dm-form-message is-info">Завантажую оголошення для редагування...</div> : null}
                    {message && <div className={`dm-form-message is-${message.type}`}>{message.text}</div>}

                    <div className="dm-listing-form-submit">
                        <Link className="dm-btn dm-btn--ghost" to="/listings">
                            До оголошень
                        </Link>
                        <button className="dm-btn dm-btn--accent" type="submit" disabled={isSubmitting || isLoadingListing}>
                            {isSubmitting ? (isEditMode ? 'Зберігаємо...' : 'Публікуємо...') : isEditMode ? 'Зберегти' : 'Опублікувати'}
                        </button>
                    </div>
                </aside>
            </form>
        </main>
    );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
    return (
        <div className="dm-listing-form-title">
            <span>{index}</span>
            <h2>{title}</h2>
        </div>
    );
}

function ChoiceButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
    return (
        <button type="button" className={active ? 'is-active' : ''} onClick={onClick}>
            {children}
        </button>
    );
}

function TextField({
    label,
    name,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    name: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
}) {
    return (
        <label className="dm-listing-form-field">
            <span>{label}</span>
            <input name={name} type={type} value={value} onChange={onChange} />
        </label>
    );
}

function TextArea({
    label,
    name,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
}) {
    return (
        <label className="dm-listing-form-field">
            <span>{label}</span>
            <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} />
        </label>
    );
}
