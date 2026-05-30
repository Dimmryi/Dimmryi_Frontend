import agreementPdf from '../assets/files/agreement.pdf';
import { useLanguage } from '../LanguageProvider';

const copy = {
  uk: {
    title: 'Типовий договір між орендарем та орендодавцем',
    intro:
      'Завантажений договір роздрукуйте на папері формата А4 в двох екземплярах. Заповніть пробіли необхідною інформацією: один екземпляр орендарем, інший орендодавцем. Такий договір має повну юридичну силу.',
    download: 'Завантажити договір',
    cityLine: 'Місто ____________  «___» ____________ 20__ року',
    heading: 'Договір оренди нерухомості',
    sections: [
      ['1. Загальні умови', 'Орендодавець: ____________________, який є власником об’єкта нерухомості за адресою ____________________. Орендар: ____________________, який зобов’язується використовувати об’єкт за цільовим призначенням та не передавати його у суборенду без письмової згоди орендодавця.'],
      ['2. Характеристика об’єкта оренди', 'Об’єкт оренди: квартира/будинок ____________________, що знаходиться за адресою ____________________. На момент укладення договору у житлі знаходяться речі та обладнання, перелік яких сторони можуть додати окремим актом приймання-передачі.'],
      ['3. Оплата та строки', 'Орендар сплачує орендну плату щомісяця у погоджені сторонами строки. Заставна сума, порядок її повернення та умови компенсації шкоди фіксуються сторонами у письмовому вигляді.'],
      ['4. Форс-мажорні обставини', 'Сторони звільняються від відповідальності за невиконання зобов’язань у випадку обставин непереборної сили, які безпосередньо вплинули на можливість виконання умов договору.'],
      ['5. Паспортні дані та підписи', 'Орендодавець: ПІБ ____________________, паспорт ____________________, телефон ____________________. Орендар: ПІБ ____________________, паспорт ____________________, телефон ____________________. Підписи сторін: ____________________ / ____________________.'],
    ],
  },
  en: {
    title: 'Standard agreement between tenant and landlord',
    intro:
      'Print the downloaded contract on A4 paper in two copies. Fill in the blanks with the necessary information, one copy by the tenant and the other by the landlord.',
    download: 'Download agreement',
    cityLine: 'City ____________  “___” ____________ 20__',
    heading: 'Real Estate Lease Agreement',
    sections: [
      ['1. General Terms', 'Landlord: ____________________, the owner of the property located at ____________________. Tenant: ____________________, who agrees to use the property for its intended purpose and not sublease it without written consent.'],
      ['2. Property Description', 'Rental object: apartment/house ____________________, located at ____________________. Items and equipment inside the property may be listed in a separate handover act.'],
      ['3. Payment and Terms', 'The tenant pays rent monthly within the schedule agreed by the parties. Deposit amount, return procedure, and damage compensation terms are fixed in writing.'],
      ['4. Force Majeure', 'The parties are released from liability for non-performance caused by force majeure circumstances that directly affected performance of the agreement.'],
      ['5. Passport Details and Signatures', 'Landlord: full name ____________________, passport ____________________, phone ____________________. Tenant: full name ____________________, passport ____________________, phone ____________________. Signatures: ____________________ / ____________________.'],
    ],
  },
};

export default function Agreement() {
  const { language } = useLanguage();
  const t = copy[language === 'en' ? 'en' : 'uk'];

  return (
    <main className="dm-doc-page">
      <section className="dm-section">
        <div className="dm-doc-hero">
          <div>
            <div className="dm-eyebrow">{language === 'en' ? 'Legal template' : 'Юридичний шаблон'}</div>
            <h1 className="dm-h2">{t.title}</h1>
          </div>
          <a className="dm-btn dm-btn--accent" href={agreementPdf} download="agreement.pdf">
            {t.download}
          </a>
        </div>
        <div className="dm-doc-note">
          <strong>{language === 'en' ? 'How to use:' : 'Як користуватись:'}</strong>
          <span>{t.intro}</span>
        </div>
        <article className="dm-contract">
          <h2>{t.heading}</h2>
          <p className="dm-contract__city">{t.cityLine}</p>
          {t.sections.map(([title, body]) => (
            <section key={title} className="dm-contract__section">
              <h3>{title}</h3>
              <p>{body}</p>
            </section>
          ))}
        </article>
      </section>
    </main>
  );
}
