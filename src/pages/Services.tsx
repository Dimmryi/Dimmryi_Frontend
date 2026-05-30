import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

type ServiceItem = {
  titleUk: string;
  titleEn: string;
  descriptionUk: string;
  descriptionEn: string;
  href: string;
  icon: 'home' | 'search' | 'file' | 'spark' | 'video' | 'bell' | 'agent' | 'trend';
  tier: 'free' | 'premium';
};

const services: ServiceItem[] = [
  {
    titleUk: 'Розмістити оголошення',
    titleEn: 'List a property',
    descriptionUk: 'Створення оголошення з фото, описом, ціною та контактами власника.',
    descriptionEn: 'Create a listing with photos, description, price, and owner contacts.',
    href: '/listings/new/sale',
    icon: 'home',
    tier: 'free',
  },
  {
    titleUk: 'Пошук нерухомості',
    titleEn: 'Find a home',
    descriptionUk: 'Каталог оголошень, фільтри, карта та добірки актуальних пропозицій.',
    descriptionEn: 'Listings catalog, filters, map, and curated active offers.',
    href: '/listings',
    icon: 'search',
    tier: 'free',
  },
  {
    titleUk: 'Договір та угода',
    titleEn: 'Agreement documents',
    descriptionUk: 'Шаблони, правила користування та юридичні матеріали сервісу.',
    descriptionEn: 'Templates, usage rules, and legal service materials.',
    href: '/agreement',
    icon: 'file',
    tier: 'free',
  },
  {
    titleUk: 'AI-оцінка нерухомості',
    titleEn: 'AI real estate estimate',
    descriptionUk: 'Орієнтовна оцінка вартості об’єкта за параметрами та ринковим контекстом.',
    descriptionEn: 'Estimated property value from parameters and market context.',
    href: '/real-estate-estimator',
    icon: 'spark',
    tier: 'free',
  },
  {
    titleUk: 'Рекламне відео',
    titleEn: 'Advertising video',
    descriptionUk: 'Промо-відео для оголошень і рекламних блоків на головній сторінці.',
    descriptionEn: 'Promo videos for listings and featured home-page placements.',
    href: '/advertising',
    icon: 'video',
    tier: 'premium',
  },
  {
    titleUk: 'Сповіщення про нові об’єкти',
    titleEn: 'Listing notifications',
    descriptionUk: 'Підписка на критерії пошуку й отримання повідомлень про нові збіги.',
    descriptionEn: 'Subscribe to search criteria and receive alerts for new matches.',
    href: '/notification',
    icon: 'bell',
    tier: 'premium',
  },
  {
    titleUk: 'Профіль ріелтора',
    titleEn: 'Agent profile',
    descriptionUk: 'Сторінка агента з контактами, описом досвіду та портфоліо.',
    descriptionEn: 'Agent page with contacts, experience summary, and portfolio.',
    href: '/agents',
    icon: 'agent',
    tier: 'premium',
  },
  {
    titleUk: 'Просування оголошення',
    titleEn: 'Promote a listing',
    descriptionUk: 'Додаткове просування, візуальні матеріали та пріоритетна видимість.',
    descriptionEn: 'Extra promotion, visual materials, and priority visibility.',
    href: '/promotion-your-listing',
    icon: 'trend',
    tier: 'premium',
  },
];

const Icon = ({ type }: { type: ServiceItem['icon'] }) => {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
  };

  if (type === 'home') {
    return (
      <svg {...common}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V21h13V10.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    );
  }

  if (type === 'search') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>
    );
  }

  if (type === 'file') {
    return (
      <svg {...common}>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    );
  }

  if (type === 'video') {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m16 10 5-3v10l-5-3z" />
      </svg>
    );
  }

  if (type === 'bell') {
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (type === 'agent') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (type === 'trend') {
    return (
      <svg {...common}>
        <path d="m3 17 6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
    </svg>
  );
};

export default function Services() {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const freeServices = services.filter((service) => service.tier === 'free');
  const premiumServices = services.filter((service) => service.tier === 'premium');

  const renderCard = (service: ServiceItem) => (
    <Link className="dm-service-card" to={service.href} key={service.href}>
      <div className="dm-service-card__icon">
        <Icon type={service.icon} />
      </div>
      <div>
        <h3>{isEnglish ? service.titleEn : service.titleUk}</h3>
        <p>{isEnglish ? service.descriptionEn : service.descriptionUk}</p>
      </div>
    </Link>
  );

  return (
    <main className="dm-services-page">
      <section className="dm-section">
        <div className="dm-services-hero">
          <div>
            <div className="dm-eyebrow">{isEnglish ? 'Services' : 'Послуги'}</div>
            <h1 className="dm-h2">
              {isEnglish ? 'Everything around your property in one place' : 'Усе навколо вашої нерухомості в одному місці'}
            </h1>
          </div>
          <p>
            {isEnglish
              ? 'We keep new-build search inside listings and map filters, while this page gathers the real functional services from the old project.'
              : 'Пошук новобудов залишаємо у фільтрах listings і мапи, а тут збираємо реальні функціональні сервіси зі старого проєкту.'}
          </p>
        </div>

        <div className="dm-services-group">
          <div className="dm-services-group__head">
            <span>{isEnglish ? 'Free tools' : 'Безкоштовні інструменти'}</span>
          </div>
          <div className="dm-services-grid">{freeServices.map(renderCard)}</div>
        </div>

        <div className="dm-services-group">
          <div className="dm-services-group__head">
            <span>{isEnglish ? 'Premium services' : 'Преміум сервіси'}</span>
            <Link to="/subscription">{isEnglish ? 'View plans' : 'Переглянути тарифи'}</Link>
          </div>
          <div className="dm-services-grid">{premiumServices.map(renderCard)}</div>
        </div>
      </section>
    </main>
  );
}
