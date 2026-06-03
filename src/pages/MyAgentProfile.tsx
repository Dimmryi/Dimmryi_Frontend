import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Icons } from '../components/Icons';
import { useSubscription } from '../hooks/useSubscription';
import { createMyAgent, fetchMyAgent, getAgentImage, hideMyAgent, updateMyAgent, type Agent } from '../services/AgentService';
import type { RootState } from '../store/store';

type FormState = {
    name: string;
    jobTitle: string;
    email: string;
    phone: string;
    saleVolume: string;
    totalDeal: string;
    rating: string;
    license: string;
};

type MediaAsset = {
    url: string;
    publicId: string;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME || '';
const PRESET_VALUE = import.meta.env.VITE_PRESET_VALUE || '';

const emptyForm: FormState = {
    name: '',
    jobTitle: '',
    email: '',
    phone: '',
    saleVolume: '',
    totalDeal: '',
    rating: '',
    license: '',
};

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

const uploadToCloudinary = async (file: File): Promise<MediaAsset> => {
    if (!CLOUD_NAME || !PRESET_VALUE) {
        throw new Error('Cloudinary env variables are not configured.');
    }

    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', PRESET_VALUE);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
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

const deleteFromCloudinary = async (asset: MediaAsset) => {
    if (!asset.publicId) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const signatureResponse = await fetch(`${API_URL}/generate-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: asset.publicId, timestamp }),
    });
    const signature = await signatureResponse.json();

    if (!signatureResponse.ok) {
        throw new Error(signature?.message || 'Could not create Cloudinary delete signature.');
    }

    const destroyResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
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

const getFormFromAgent = (agent: Agent): FormState => ({
    name: agent.name || '',
    jobTitle: agent.jobTitle || '',
    email: agent.email || '',
    phone: agent.phone || '',
    saleVolume: agent.saleVolume || '',
    totalDeal: agent.totalDeal || '',
    rating: agent.rating || '',
    license: agent.license || '',
});

export default function MyAgentProfile() {
    const isRegistered = useSelector((state: RootState) => state.registration.isRegistered);
    const { canUsePremium, isAdmin, subscribeType } = useSubscription();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [photoUrl, setPhotoUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadAgent = async () => {
            if (!isRegistered) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setMessage(null);

            try {
                const data = await fetchMyAgent();
                if (cancelled) return;
                setAgent(data);

                if (data) {
                    setForm(getFormFromAgent(data));
                    setPhotoUrl(getAgentImage(data.image));
                }
            } catch (error) {
                if (!cancelled) {
                    setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося завантажити профіль рієлтора.' });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadAgent();

        return () => {
            cancelled = true;
        };
    }, [isRegistered]);

    const isHidden = agent?.isActive === false || agent?.status === 'hidden';
    const canEdit = canUsePremium || isAdmin;
    const title = agent ? 'Мій профіль рієлтора' : 'Стати рієлтором';
    const statusLabel = useMemo(() => {
        if (!agent) return 'Профіль ще не створено';
        return isHidden ? 'Приховано з каталогу' : 'Активний у каталозі';
    }, [agent, isHidden]);

    const updateField = (field: keyof FormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {
            const previousPhoto = photoUrl;
            const uploaded = await uploadToCloudinary(file);
            setPhotoUrl(uploaded.url);

            if (previousPhoto && previousPhoto !== uploaded.url) {
                deleteFromCloudinary(toMediaAsset(previousPhoto)).catch(() => undefined);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося завантажити фото.' });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!canEdit) return;

        if (!form.name.trim() || form.name.trim().length < 3 || !form.jobTitle.trim() || !form.email.includes('@') || !photoUrl) {
            setMessage({ type: 'error', text: 'Заповніть ім’я, посаду, email і додайте фото профілю.' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const payload = {
                image: [photoUrl],
                name: form.name.trim(),
                jobTitle: form.jobTitle.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                saleVolume: form.saleVolume.trim(),
                totalDeal: form.totalDeal.trim(),
                rating: form.rating.trim(),
                license: form.license.trim(),
                date: Date.now().toString(),
            };

            const updated = agent ? await updateMyAgent(payload) : await createMyAgent(payload);
            setAgent(updated);
            setForm(getFormFromAgent(updated));
            setPhotoUrl(getAgentImage(updated.image));
            setMessage({ type: 'success', text: agent ? 'Профіль рієлтора збережено.' : 'Профіль рієлтора створено.' });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося зберегти профіль.' });
        } finally {
            setSaving(false);
        }
    };

    const handleHide = async () => {
        if (!agent || !canEdit) return;
        const confirmed = window.confirm('Приховати профіль з каталогу рієлторів? Дані залишаться і їх можна буде відновити.');
        if (!confirmed) return;

        setSaving(true);
        setMessage(null);

        try {
            const hidden = await hideMyAgent();
            setAgent(hidden);
            setMessage({ type: 'success', text: 'Профіль приховано з публічного каталогу.' });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не вдалося приховати профіль.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="dm-agent-profile-page">
            <section className="dm-section">
                <div className="dm-agent-profile-hero">
                    <div>
                        <div className="dm-eyebrow">Рієлторський профіль</div>
                        <h1 className="dm-h2">{title}</h1>
                        <p>
                            Premium-користувач може створити один власний профіль рієлтора. Якщо профіль приховано, дані не видаляються і його можна активувати повторним збереженням.
                        </p>
                    </div>
                    <div className="dm-agent-profile-status">
                        <span>{isAdmin ? 'Admin доступ' : `${subscribeType} план`}</span>
                        <strong>{statusLabel}</strong>
                    </div>
                </div>

                {!isRegistered ? (
                    <div className="dm-empty-state">
                        <div className="dm-empty-state__icon">{Icons.info()}</div>
                        <h2>Потрібна авторизація</h2>
                        <p>Щоб створити профіль рієлтора, спочатку увійдіть або зареєструйтесь на сайті.</p>
                        <Link className="dm-btn dm-btn--accent" to="/registration">Зареєструватись</Link>
                    </div>
                ) : null}

                {isRegistered && !canEdit ? (
                    <div className="dm-agent-profile-gate">
                        <div>
                            <span>Доступ для Premium</span>
                            <h2>Оформіть Premium, щоб створювати або редагувати профіль рієлтора</h2>
                            <p>Профіль можна переглядати після входу, але зміни доступні тільки активному Premium-користувачу або адміністратору.</p>
                        </div>
                        <Link className="dm-btn dm-btn--accent" to="/subscription">Перейти до тарифів</Link>
                    </div>
                ) : null}

                {isRegistered && loading ? <div className="dm-listings-status">Завантаження профілю...</div> : null}

                {isRegistered && !loading ? (
                    <form className={!canEdit ? 'dm-agent-profile-form is-locked' : 'dm-agent-profile-form'} onSubmit={handleSubmit}>
                        <div className="dm-agent-profile-main">
                            <div className="dm-listing-form-card">
                                <div className="dm-listing-form-title">
                                    <span>{Icons.info()}</span>
                                    <h2>Дані профілю</h2>
                                </div>

                                <div className="dm-listing-form-grid">
                                    <label className="dm-listing-form-field">
                                        <span>Ім’я</span>
                                        <input value={form.name} onChange={(event) => updateField('name', event.target.value)} disabled={!canEdit || saving} placeholder="Наприклад, Victor Fisherman" />
                                    </label>
                                    <label className="dm-listing-form-field">
                                        <span>Посада / спеціалізація</span>
                                        <input value={form.jobTitle} onChange={(event) => updateField('jobTitle', event.target.value)} disabled={!canEdit || saving} placeholder="Рієлтор, експерт з оренди" />
                                    </label>
                                    <label className="dm-listing-form-field">
                                        <span>Email</span>
                                        <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} disabled={!canEdit || saving} placeholder="agent@example.com" />
                                    </label>
                                    <label className="dm-listing-form-field">
                                        <span>Телефон</span>
                                        <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} disabled={!canEdit || saving} placeholder="+380..." />
                                    </label>
                                    <label className="dm-listing-form-field">
                                        <span>Обсяг продажів</span>
                                        <input value={form.saleVolume} onChange={(event) => updateField('saleVolume', event.target.value)} disabled={!canEdit || saving} placeholder="1.3M" />
                                    </label>
                                    <label className="dm-listing-form-field">
                                        <span>Кількість угод</span>
                                        <input value={form.totalDeal} onChange={(event) => updateField('totalDeal', event.target.value)} disabled={!canEdit || saving} placeholder="120" />
                                    </label>
                                    <label className="dm-listing-form-field">
                                        <span>Рейтинг</span>
                                        <input value={form.rating} onChange={(event) => updateField('rating', event.target.value)} disabled={!canEdit || saving} placeholder="4.8" />
                                    </label>
                                    <label className="dm-listing-form-field">
                                        <span>Ліцензія / сертифікат</span>
                                        <input value={form.license} onChange={(event) => updateField('license', event.target.value)} disabled={!canEdit || saving} placeholder="ID або номер сертифіката" />
                                    </label>
                                </div>
                            </div>

                            <div className="dm-listing-form-submit">
                                <button className="dm-btn dm-btn--accent" type="submit" disabled={!canEdit || saving || uploading}>
                                    {saving ? 'Збереження...' : isHidden ? 'Активувати профіль' : agent ? 'Зберегти профіль' : 'Створити профіль'}
                                </button>
                                <button className="dm-btn dm-btn--danger" type="button" onClick={handleHide} disabled={!agent || isHidden || !canEdit || saving}>
                                    Приховати профіль
                                </button>
                            </div>

                            {message ? <p className={`dm-form-message is-${message.type}`}>{message.text}</p> : null}
                        </div>

                        <aside className="dm-agent-profile-aside">
                            <div className="dm-agent-profile-preview">
                                <div className="dm-agent-profile-photo">
                                    {photoUrl ? <img src={photoUrl} alt="Фото профілю рієлтора" /> : <span>{Icons.info()}</span>}
                                </div>
                                {canEdit ? (
                                    <label className="dm-upload-zone dm-agent-profile-upload">
                                        <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploading || saving} />
                                        <span>{uploading ? 'Завантаження фото...' : photoUrl ? 'Замінити фото' : 'Додати фото профілю'}</span>
                                    </label>
                                ) : null}
                                <h2>{form.name || 'Ім’я рієлтора'}</h2>
                                <p>{form.jobTitle || 'Спеціалізація'}</p>
                                <div className="dm-agent-profile-preview__meta">
                                    <span>{form.rating || '—'} ★</span>
                                    <span>{form.totalDeal || '—'} угод</span>
                                    <span>{form.license || '—'}</span>
                                </div>
                                <Link className="dm-btn dm-btn--ghost" to="/agents">Переглянути каталог</Link>
                            </div>
                        </aside>
                    </form>
                ) : null}
            </section>
        </main>
    );
}
