import { useState } from 'react';
import { useLanguage } from '../LanguageProvider';

const TODAY = new Date().toISOString().slice(0, 10);

const copy = {
  uk: {
    title: 'Оцінювач нерухомості з AI',
    subtitle: 'Опишіть об’єкт нерухомості для отримання приблизної вартості',
    placeholder: 'Приклад: 3-кімнатна квартира в центрі Полтави, 75 кв.м., євроремонт, 9-й поверх з 12, поруч торговельний центр та парк...',
    empty: 'Будь ласка, опишіть об’єкт нерухомості',
    error: 'Виникла помилка при оцінці об’єкта. Спробуйте ще раз.',
    loading: 'Розраховую...',
    submit: 'Розрахувати вартість',
    clear: 'Очистити',
    result: 'Результат оцінки',
    history: 'Історія оцінок',
    object: 'Об’єкт',
    estimate: 'Оцінка',
    dailyLimitTitle: 'Щоденний ліміт вичерпано',
    dailyLimitMsg: 'Ви вже скористалися цим сервісом сьогодні. Повертайтеся завтра.',
  },
  en: {
    title: 'AI-powered real estate estimator',
    subtitle: 'Describe the property to get an approximate value',
    placeholder: 'Example: 3-room apartment in the center of Poltava, 75 sq.m., renovated, 9th floor of 12, near a shopping center and park...',
    empty: 'Please describe the property',
    error: 'There was an error estimating the property. Please try again.',
    loading: 'Calculating...',
    submit: 'Calculate value',
    clear: 'Clear',
    result: 'Evaluation result',
    history: 'Rating history',
    object: 'Object',
    estimate: 'Estimate',
    dailyLimitTitle: 'Daily limit reached',
    dailyLimitMsg: 'You have already used this service today. Come back tomorrow.',
  },
};

type HistoryItem = {
  question: string;
  answer: string;
};

export default function RealEstateEstimator() {
  const { language } = useLanguage();
  const t = copy[language === 'en' ? 'en' : 'uk'];
  const [propertyDescription, setPropertyDescription] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [conversationHistory, setConversationHistory] = useState<HistoryItem[]>([]);
  const [hasUsedToday, setHasUsedToday] = useState(() => localStorage.getItem('estimatorLastUsed') === TODAY);

  const estimatePropertyValue = async () => {
    if (!propertyDescription.trim()) {
      setError(t.empty);
      return;
    }

    setLoading(true);
    setError('');
    setErrorDetails('');

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY_OLD;
      if (!apiKey) throw new Error('VITE_GOOGLE_AI_API_KEY_OLD is not configured');

      const prompt = `You are a real estate appraisal expert. Analyze the property description and calculate the approximate value.
Description: ${propertyDescription}
Consider location, area, rooms, floor, condition, nearby amenities, and market trends.
Format: Approximate cost: [price range in hryvnia]. Justification: [brief explanation].
${language === 'en' ? 'Give answer in English.' : 'Give answer in Ukrainian.'}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Google AI service');

      setEstimatedPrice(text);
      setConversationHistory((prev) => [...prev, { question: propertyDescription, answer: text }]);
      localStorage.setItem('estimatorLastUsed', TODAY);
      setHasUsedToday(true);
    } catch (err) {
      setError(t.error);
      setErrorDetails(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setConversationHistory([]);
    setEstimatedPrice('');
    setPropertyDescription('');
    setError('');
    setErrorDetails('');
  };

  return (
    <main className="dm-estimator-page">
      <section className="dm-section">
        <div className="dm-estimator-layout">
          <div className="dm-estimator-intro">
            <div className="dm-eyebrow">AI service</div>
            <h1 className="dm-h2">{t.title}</h1>
            <p>{t.subtitle}</p>
            {hasUsedToday && (
              <div className="dm-estimator-limit">
                <strong>{t.dailyLimitTitle}</strong>
                <span>{t.dailyLimitMsg}</span>
              </div>
            )}
          </div>
          <div className="dm-estimator-tool">
            <label>
              <span>{t.placeholder.length > 64 ? `${t.placeholder.slice(0, 64)}...` : t.placeholder}</span>
              <textarea
                value={propertyDescription}
                onChange={(event) => setPropertyDescription(event.target.value)}
                placeholder={t.placeholder}
                rows={7}
                disabled={loading || hasUsedToday}
              />
            </label>
            <div className="dm-estimator-actions">
              <button className="dm-btn dm-btn--accent" onClick={estimatePropertyValue} disabled={loading || hasUsedToday || !propertyDescription.trim()}>
                {loading ? t.loading : t.submit}
              </button>
              <button className="dm-btn dm-btn--ghost" onClick={clearHistory}>
                {t.clear}
              </button>
            </div>
            {error && (
              <div className="dm-estimator-error">
                <strong>{error}</strong>
                {errorDetails && <code>{errorDetails}</code>}
              </div>
            )}
            {estimatedPrice && (
              <div className="dm-estimator-result">
                <h2>{t.result}</h2>
                <p>{estimatedPrice}</p>
              </div>
            )}
          </div>
        </div>
        {conversationHistory.length > 0 && (
          <div className="dm-estimator-history">
            <div className="dm-services-group__head">
              <span>{t.history}</span>
            </div>
            {conversationHistory.map((item, index) => (
              <article key={`${item.question}-${index}`} className="dm-estimator-history__item">
                <h3>{t.object}</h3>
                <p>{item.question}</p>
                <h3>{t.estimate}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
