import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

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

export default function Verification() {
    const { language } = useLanguage();
    const isEnglish = language === 'en';

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
