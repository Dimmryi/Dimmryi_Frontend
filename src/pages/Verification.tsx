import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { useLanguage } from '../LanguageProvider';
import {
    createVerificationRequest,
    getVerificationFileRulesText,
    uploadVerificationFile,
    validateVerificationFiles,
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
    const [searchParams] = useSearchParams();
    const requestedListingId = searchParams.get('listingId') || '';

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
                const requestedListing = ownerListings.find((listing) => listing._id === requestedListingId);
                const firstAvailable = ownerListings.find((listing) => canSubmitListing(listing.verificationStatus));
                setForm((current) => ({ ...current, listingId: requestedListing?._id || firstAvailable?._id || ownerListings[0]?._id || '' }));
                if (requestedListing) {
                    setMessage({
                        type: 'info',
                        text: isEnglish
                            ? 'The listing from your form is selected. Upload documents to send it for review.'
                            : 'Оголошення з форми вже вибрано. Завантажте документи, щоб надіслати його на перевірку.',
                    });
                }
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
    }, [isEnglish, isRegistered, requestedListingId, userId]);

    const updateForm = <Key extends keyof VerificationFormState>(field: Key, value: VerificationFormState[Key]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextFiles = Array.from(event.target.files || []);
        const validationError = validateVerificationFiles(nextFiles, isEnglish);

        if (validationError) {
            event.target.value = '';
            updateForm('files', []);
            setMessage({ type: 'error', text: validationError });
            return;
        }

        setMessage(null);
        updateForm('files', nextFiles);
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

        const validationError = validateVerificationFiles(form.files, isEnglish);
        if (validationError) {
            setMessage({ type: 'error', text: validationError });
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
                            {isEnglish ? 'Submit a listing verification request' : 'Подайте заявку на перевірку оголошення'}
                        </h1>
                    </div>
                    <p>
                        {isEnglish
                            ? 'Choose one of your listings, upload a document, and send it to the moderator. After review, the listing status will be updated.'
                            : 'Оберіть одне зі своїх оголошень, завантажте документ і надішліть його модератору. Після перевірки статус оголошення буде оновлено.'}
                    </p>
                </div>

                <div className="dm-verification-note">
                    <strong>{isEnglish ? 'Private review' : 'Приватна перевірка'}</strong>
                    <p>
                        {isEnglish
                            ? 'Uploaded documents are sent to the site administrator and are not shown in the public listing gallery.'
                            : 'Завантажені документи надсилаються адміністратору сайту і не відображаються у публічній галереї оголошення.'}
                    </p>
                </div>

                <section className="dm-verification-submit" aria-label={isEnglish ? 'Submit verification request' : 'Подати заявку на перевірку'}>
                    <div className="dm-verification-submit__intro">
                        <span>{isEnglish ? 'Submit request' : 'Подати заявку'}</span>
                        <h2>{isEnglish ? 'Verify one of your listings' : 'Перевірте одне зі своїх оголошень'}</h2>
                        <p>
                            {isEnglish
                                ? 'You can confirm that you are the owner or that you represent the owner. Add a short comment if it helps the moderator compare the document with the listing.'
                                : 'Ви можете підтвердити, що є власником або представником власника. Додайте короткий коментар, якщо це допоможе модератору звірити документ з оголошенням.'}
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
                            <p className="dm-verification-submit__hint">{getVerificationFileRulesText(isEnglish)}</p>

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

            </section>
        </main>
    );
}
