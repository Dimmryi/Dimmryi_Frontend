import { Link } from 'react-router-dom';

interface AccountPlaceholderProps {
  title: string;
}

export default function AccountPlaceholder({ title }: AccountPlaceholderProps) {
  return (
    <main className="dm-account-placeholder">
      <section className="dm-section">
        <div className="dm-eyebrow">Profile</div>
        <h1 className="dm-h2">{title}</h1>
        <p>Цей розділ підключено в навігації. Повний компонент можна перенести наступним кроком.</p>
        <Link className="dm-btn dm-btn--accent" to="/">
          На головну
        </Link>
      </section>
    </main>
  );
}
