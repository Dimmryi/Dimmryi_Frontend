import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { useLanguage } from '../LanguageProvider';
import {
    createVerificationRequest,
    uploadVerificationFile,
    type VerificationDocumentType,
    type VerificationRequestType,
} from '../services/VerificationService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type VerificationStatus = 'notVerified' | 'pending' | 'documentsVerified' | 'representativeVerified' | 'rejected';

interface OwnerListing {
    _id: string;
    listingNumber?: number;
    apartmentDetails?: string;
    description?: string;
    location?: string;
    price?: string | number;
    verificationStatus?: VerificationStatus;
}

interface VerificationFormState {
    listingId: string;
    requestType: VerificationRequestType;
    documentType: VerificationDocumentType;
    comment: string;
    files: File[];
}

const initialForm: VerificationFormState = {
    listingId: '',
    requestType: 'owner',
    documentType: 'technicalPassport',
    comment: '',
    files: [],
};

const steps = [
    {
        titleUk: 'Оберіть оголошення',
        titleEn: 'Choose a listing',
        textUk: 'Перевірка має бути прив’язана до конкретного об’єкта з ваших оголошень, а не до загального профілю.',
        textEn: 'Verification should be tied to a specific property from your listings, not only to a general profile.',
    },
    {
        titleUk: 'Надішліть документи приватно',
        titleEn: 'Send documents privately',
        textUk: 'Техпаспорт, витяг про право власності або документ представника завантажуються окремо від фото оголошення.',
        textEn: 'Technical passport, ownership extract, or representative documents are uploaded separately from public listing photos.',
    },
    {
        titleUk: 'Модератор перевіряє збіг',
        titleEn: 'Moderator checks the match',
        textUk: 'Ми звіряємо адресу, тип об’єкта, власника або право представництва без публікації приватних даних.',
        textEn: 'We compare address, property type, owner, or representation rights without publishing private data.',
    },
    {
        titleUk: 'Оголошення отримує статус',
        titleEn: 'Listing gets a status',
        textUk: 'Після перевірки на картці можна показати бейдж “Документи перевірені” або “Представник перевірений”.',
        textEn: 'After review, the listing can show a badge like “Documents verified” or “Representative verified”.',
    },
];

const statuses = [
    {
        nameUk: 'Не перевірено',
        nameEn: 'Not verified',
        textUk: 'Базовий стан для нових оголошень.',
        textEn: 'Default state for new listings.',
    },
    {
        nameUk: 'Очікує перевірки',
        nameEn: 'Pending review',
        textUk: 'Документи надіслані, але ще не переглянуті модератором.',
        textEn: 'Documents were submitted and are waiting for moderation.',
    },
    {
        nameUk: 'Документи перевірені',
        nameEn: 'Documents verified',
        textUk: 'Дані документа відповідають оголошенню.',
        textEn: 'Document data matches the listing.',
    },
    {
        nameUk: 'Представник перевірений',
        nameEn: 'Representative verified',
        textUk: 'Оголошення веде не власник, але право представництва підтверджене.',
        textEn: 'The listing is managed by a representative with confirmed authority.',
    },
];

const documentTypes = [
    {
        titleUk: 'Технічний паспорт',
        titleEn: 'Technical passport',
        textUk: 'Підходить для звірки площі, планування та адреси об’єкта.',
        textEn: 'Useful for checking area, layout, and property address.',
    },
    {
        titleUk: 'Витяг або право власності',
        titleEn: 'Ownership extract',
        textUk: 'Допомагає підтвердити, що користувач має відношення до об’єкта.',
        textEn: 'Helps confirm that the user is connected to the property.',
    },
    {
        titleUk: 'Документ представника',
        titleEn: 'Representative document',
        textUk: 'Потрібен, якщо оголошення розміщує рієлтор, родич або інша довірена особа.',
        textEn: 'Needed when an agent, relative, or trusted person publishes the listing.',
    },
];

const requestTypeOptions: Array<{ value: VerificationRequestType; labelUk: string; labelEn: string }> = [
    { value: 'owner', labelUk: 'Я власник', labelEn: 'I am the owner' },
    { value: 'representative', labelUk: 'Я представник', labelEn: 'I am a representative' },
];

const documentTypeOptions: Array<{ value: VerificationDocumentType; labelUk: string; labelEn: string }> = [
    { value: 'technicalPassport', labelUk: 'Технічний паспорт', labelEn: 'Technical passport' },
    { value: 'ownershipExtract', labelUk: 'Витяг / право власності', labelEn: 'Ownership extract' },
    { value: 'representativeDocument', labelUk: 'Документ представника', labelEn: 'Representative document' },
];

const statusLabel = (status: VerificationStatus | undefined, isEnglish: boolean) => {
    const labels: Record<VerificationStatus, { uk: string; en: string }> = {
        notVerified: { uk: 'Не перевірено', en: 'Not verified' },
        pending: { uk: 'Очікує перевірки', en: 'Pending review' },
        documentsVerified: { uk: 'Документи перевірені', en: 'Documents verified' },
        representativeVerified: { uk: 'Представник перевірений', en: 'Representative verified' },
        rejected: { uk: 'Відхилено', en: 'Rejected' },
    };
    const value = status || 'notVerified';
    return isEnglish ? labels[value].en : labels[value].uk;
};

const canSubmitListing = (status?: VerificationStatus) =>
    status !== 'pending' && status !== 'documentsVerified' && status !== 'representativeVerified';

export default function Verification() {
    const { language } = useLanguage();
    const isEnglish = language === 'en';
    const userId = useAppSelector((state) => state.registration.userId);
    const isRegistered = useAppSelector((state) => state.registration.isRegistered);

    const [listings, setListings] = useState<OwnerListing[]>([]);
    const [form, setForm] = useState<VerificationFormState>(initialForm);
    const [isLoadingListings, setIsLoadingListings] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const selectedListing = useMemo(
        () => listings.find((listing) => listing._id === form.listingId),
        [form.listingId, listings],
    );
    const availableListings = useMemo(
        () => listings.filter((listing) => canSubmitListing(listing.verificationStatus)),
        [listings],
    );

    useEffect(() => {
        if (!isRegistered || !userId) {
            setListings([]);
            return;
        }

        let isMounted = true;
        const loadListings = async () => {
            try {
                setIsLoadingListings(true);
                setMessage(null);
                const response = await fetch(`${API_URL}/api/listings/ownerId/${encodeURIComponent(userId)}`, {
                    credentials: 'include',
                });
                const data = await response.json().catch(() => []);
                if (!response.ok) {
                    throw new Error(data?.message || data?.error || `Listings request failed: ${response.status}`);
                }

                const ownerListings = Array.isArray(data) ? data.filter((item) => item?._id) : [];
                if (!isMounted) return;
                setListings(ownerListings);
                const firstAvailable = ownerListings.find((listing) => canSubmitListing(listing.verificationStatus));
                setForm((current) => ({ ...current, listingId: firstAvailable?._id || ownerListings[0]?._id || '' }));
            } catch (error) {
                if (!isMounted) return;
                setMessage({
                    type: 'error',
                    text: error instanceof Error
                        ? error.message
                        : isEnglish
                          ? 'Could not load your listings.'
                          : 'Не вдалося завантажити ваші оголошення.',
                });
            } finally {
                if (isMounted) setIsLoadingListings(false);
            }
        };

        loadListings();

        return () => {
            isMounted = false;
        };
    }, [isEnglish, isRegistered, userId]);

    const updateForm = <Key extends keyof VerificationFormState>(field: Key, value: VerificationFormState[Key]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        updateForm('files', Array.from(event.target.files || []));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!form.listingId) {
            setMessage({ type: 'error', text: isEnglish ? 'Choose a listing first.' : 'Спочатку оберіть оголошення.' });
            return;
        }

        if (!selectedListing || !canSubmitListing(selectedListing.verificationStatus)) {
            setMessage({
                type: 'error',
                text: isEnglish
                    ? 'This listing already has an active or completed verification.'
                    : 'Для цього оголошення вже є активна або завершена перевірка.',
            });
            return;
        }

        if (form.files.length === 0) {
            setMessage({ type: 'error', text: isEnglish ? 'Upload at least one document.' : 'Завантажте хоча б один документ.' });
            return;
        }

        try {
            setIsSubmitting(true);
            setMessage({ type: 'info', text: isEnglish ? 'Uploading documents securely...' : 'Безпечно завантажуємо документи...' });
            const files = await Promise.all(form.files.map(uploadVerificationFile));
            await createVerificationRequest(form.listingId, {
                requestType: form.requestType,
                documentType: form.documentType,
                files,
                comment: form.comment,
            });

            setListings((current) =>
                current.map((listing) =>
                    listing._id === form.listingId ? { ...listing, verificationStatus: 'pending' } : listing,
                ),
            );
            setForm(initialForm);
            setMessage({
                type: 'success',
                text: isEnglish
                    ? 'Verification request sent. Documents are not shown publicly.'
                    : 'Заявку на перевірку надіслано. Документи не показуються публічно.',
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error
                    ? error.message
                    : isEnglish
                      ? 'Could not submit verification request.'
                      : 'Не вдалося надіслати заявку на перевірку.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="dm-verification-page">
            <section className="dm-section">
                <div className="dm-verification-hero">
                    <div>
                        <div className="dm-eyebrow">{isEnglish ? 'Owner verification' : 'Перевірка власникам'}</div>
                        <h1 className="dm-h2">
                            {isEnglish ? 'How property verification should work' : 'Як має працювати перевірка об’єкта'}
                        </h1>
                    </div>
                    <p>
                        {isEnglish
                            ? 'Documents should never be mixed with public listing photos. Verification is a private review flow that can later give the listing a trust badge.'
                            : 'Документи не треба змішувати з публічними фото оголошення. Перевірка має бути приватним процесом, який пізніше може дати оголошенню бейдж довіри.'}
                    </p>
                </div>

                <div className="dm-verification-note">
                    <strong>{isEnglish ? 'Privacy first' : 'Спочатку приватність'}</strong>
                    <p>
                        {isEnglish
                            ? 'A technical passport or ownership extract can contain sensitive personal data. Public visitors should see only verification status, not the uploaded files.'
                            : 'Технічний паспорт або витяг можуть містити приватні персональні дані. Публічні відвідувачі повинні бачити тільки статус перевірки, а не завантажені файли.'}
                    </p>
                </div>

                <section className="dm-verification-submit" aria-label={isEnglish ? 'Submit verification request' : 'Подати заявку на перевірку'}>
                    <div className="dm-verification-submit__intro">
                        <span>{isEnglish ? 'Submit request' : 'Подати заявку'}</span>
                        <h2>{isEnglish ? 'Verify one of your listings' : 'Перевірте одне зі своїх оголошень'}</h2>
                        <p>
                            {isEnglish
                                ? 'Choose a listing, add private documents, and send them for moderator review. Files are uploaded through the signed Cloudinary preset.'
                                : 'Оберіть оголошення, додайте приватні документи й надішліть їх модератору. Файли завантажуються через signed Cloudinary preset.'}
                        </p>
                    </div>

                    {!isRegistered ? (
                        <div className="dm-verification-submit__gate">
                            <strong>{isEnglish ? 'Sign in required' : 'Потрібен вхід'}</strong>
                            <p>
                                {isEnglish
                                    ? 'Only the logged-in listing owner can submit documents for verification.'
                                    : 'Подати документи може тільки залогінений власник оголошення.'}
                            </p>
                            <Link className="dm-btn dm-btn--accent" to="/login" state={{ from: '/verification' }}>
                                {isEnglish ? 'Sign in' : 'Увійти'}
                            </Link>
                        </div>
                    ) : (
                        <form className="dm-verification-submit__form" onSubmit={handleSubmit}>
                            <label>
                                <span>{isEnglish ? 'Listing' : 'Оголошення'}</span>
                                <select
                                    value={form.listingId}
                                    onChange={(event) => updateForm('listingId', event.target.value)}
                                    disabled={isLoadingListings || listings.length === 0}
                                >
                                    {isLoadingListings ? (
                                        <option value="">{isEnglish ? 'Loading listings...' : 'Завантажуємо оголошення...'}</option>
                                    ) : listings.length === 0 ? (
                                        <option value="">{isEnglish ? 'No listings yet' : 'Оголошень ще немає'}</option>
                                    ) : (
                                        listings.map((listing) => (
                                            <option key={listing._id} value={listing._id}>
                                                #{listing.listingNumber || listing._id.slice(-5)} · {listing.apartmentDetails || listing.description || listing.location || listing._id}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </label>

                            {selectedListing ? (
                                <div className="dm-verification-submit__selected">
                                    <strong>{selectedListing.apartmentDetails || selectedListing.description || selectedListing.location}</strong>
                                    <span>{statusLabel(selectedListing.verificationStatus, isEnglish)}</span>
                                    {selectedListing.location ? <p>{selectedListing.location}</p> : null}
                                </div>
                            ) : null}

                            <div className="dm-verification-submit__row">
                                <label>
                                    <span>{isEnglish ? 'Request type' : 'Тип перевірки'}</span>
                                    <select
                                        value={form.requestType}
                                        onChange={(event) => updateForm('requestType', event.target.value as VerificationRequestType)}
                                    >
                                        {requestTypeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {isEnglish ? option.labelEn : option.labelUk}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    <span>{isEnglish ? 'Document' : 'Документ'}</span>
                                    <select
                                        value={form.documentType}
                                        onChange={(event) => updateForm('documentType', event.target.value as VerificationDocumentType)}
                                    >
                                        {documentTypeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {isEnglish ? option.labelEn : option.labelUk}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label>
                                <span>{isEnglish ? 'Document files' : 'Файли документів'}</span>
                                <input type="file" accept="image/*,.pdf" multiple onChange={handleFileChange} />
                            </label>

                            {form.files.length ? (
                                <div className="dm-verification-submit__files">
                                    {form.files.map((file) => (
                                        <span key={`${file.name}-${file.size}`}>{file.name}</span>
                                    ))}
                                </div>
                            ) : null}

                            <label>
                                <span>{isEnglish ? 'Moderator comment' : 'Коментар для модератора'}</span>
                                <textarea
                                    value={form.comment}
                                    onChange={(event) => updateForm('comment', event.target.value)}
                                    placeholder={
                                        isEnglish
                                            ? 'Example: the document confirms address and property area.'
                                            : 'Наприклад: документ підтверджує адресу та площу об’єкта.'
                                    }
                                />
                            </label>

                            {message ? <p className={`dm-verification-submit__message is-${message.type}`}>{message.text}</p> : null}

                            <button
                                className="dm-btn dm-btn--accent"
                                type="submit"
                                disabled={isSubmitting || isLoadingListings || availableListings.length === 0}
                            >
                                {isSubmitting
                                    ? isEnglish
                                        ? 'Sending...'
                                        : 'Надсилаємо...'
                                    : isEnglish
                                      ? 'Submit verification'
                                      : 'Надіслати на перевірку'}
                            </button>
                        </form>
                    )}
                </section>

                <div className="dm-verification-grid">
                    {steps.map((step, index) => (
                        <article className="dm-verification-card" key={step.titleUk}>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <h2>{isEnglish ? step.titleEn : step.titleUk}</h2>
                            <p>{isEnglish ? step.textEn : step.textUk}</p>
                        </article>
                    ))}
                </div>

                <div className="dm-verification-layout">
                    <section className="dm-verification-panel">
                        <div className="dm-services-group__head">
                            <span>{isEnglish ? 'Possible documents' : 'Можливі документи'}</span>
                        </div>
                        <div className="dm-verification-list">
                            {documentTypes.map((doc) => (
                                <article key={doc.titleUk}>
                                    <h3>{isEnglish ? doc.titleEn : doc.titleUk}</h3>
                                    <p>{isEnglish ? doc.textEn : doc.textUk}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="dm-verification-panel">
                        <div className="dm-services-group__head">
                            <span>{isEnglish ? 'Future statuses' : 'Майбутні статуси'}</span>
                        </div>
                        <div className="dm-verification-statuses">
                            {statuses.map((status) => (
                                <article key={status.nameUk}>
                                    <strong>{isEnglish ? status.nameEn : status.nameUk}</strong>
                                    <p>{isEnglish ? status.textEn : status.textUk}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="dm-verification-next">
                    <div>
                        <span>{isEnglish ? 'Next implementation step' : 'Наступний крок реалізації'}</span>
                        <h2>
                            {isEnglish
                                ? 'Add a private verification request from My Listings'
                                : 'Додати приватну заявку на перевірку з “Моїх оголошень”'}
                        </h2>
                        <p>
                            {isEnglish
                                ? 'The button should appear only for listings owned by the current user. Admins will later review requests and set the public verification badge.'
                                : 'Кнопка має з’являтися тільки для оголошень поточного користувача. Адміністратор потім переглядатиме заявки й виставлятиме публічний бейдж перевірки.'}
                        </p>
                    </div>
                    <Link className="dm-btn dm-btn--accent" to="/my-listings">
                        {isEnglish ? 'Go to my listings' : 'До моїх оголошень'}
                    </Link>
                </div>
            </section>
        </main>
    );
}
