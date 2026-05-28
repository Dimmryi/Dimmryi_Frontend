import { useMemo, useState, type ReactNode } from 'react';
import { PROPERTIES } from '../constants';
import { Icons } from './Icons';
import { PlaceholderImage } from './PlaceholderImage';
import { Property } from '../types';
import { useLanguage } from '../LanguageProvider';

interface MapSectionProps {
    accent: string;
}

type FilterMode = 'all' | 'sale' | 'rent';

export const MapSection = ({ accent }: MapSectionProps) => {
    const { translate } = useLanguage();
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [infoOpen, setInfoOpen] = useState(true);
    const [active, setActive] = useState(2);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [priceMax, setPriceMax] = useState(1500);
    const [beds, setBeds] = useState(0);
    const [expanded, setExpanded] = useState(false);

    const activeProp = useMemo(() => PROPERTIES.find((p) => p.id === active), [active]);
    const filtered = useMemo(
        () => PROPERTIES.filter((p) => filterMode === 'all' || p.status === filterMode),
        [filterMode]
    );

    if (!activeProp) return null;

    const chipOptions = [
        { k: 'all' as const, l: translate('mapSection.filters.all'), n: PROPERTIES.length },
        { k: 'sale' as const, l: translate('mapSection.filters.sale'), n: PROPERTIES.filter((p) => p.status === 'sale').length },
        { k: 'rent' as const, l: translate('mapSection.filters.rent'), n: PROPERTIES.filter((p) => p.status === 'rent').length },
    ];

    const roomOptions = [0, 1, 2, 3, 4, '5+'] as const;
    const roomLabels = roomOptions.map((n) => (n === 0 ? translate('mapSection.filters.zero') : String(n)));

    const featureOptions = [
        'balcony',
        'parking',
        'furnished',
        'nearMetro',
        'newBuild',
        'renovated',
    ];

    return (
        <section id="map" className={'dm-map-section ' + (expanded ? 'is-expanded' : '')}>
            <div
                style={{
                    backgroundColor: accent,
                    width: 0,
                    height: 0,
                    overflow: 'hidden',
                }}
            />
            <div className="dm-map-section__head">
                <div>
                    <div className="dm-eyebrow">{translate('mapSection.eyebrow')}</div>
                    <h2 className="dm-h2">{translate('mapSection.title')}</h2>
                </div>
                <p className="dm-map-section__lede">
                    {translate('mapSection.lede', { count: filtered.length })}
                </p>
            </div>

            <div className="dm-map">
                <div className="dm-map__canvas">
                    <MapCanvas properties={filtered} active={active} onPick={setActive} translate={translate} />

                    <div className="dm-map__chips">
                        <ChipGroup value={filterMode} onChange={setFilterMode} options={chipOptions} />
                        <div className="dm-map__chip-divider" />
                        <button className="dm-chip">{translate('mapSection.chips.newBuilds')}</button>
                        <button className="dm-chip">{translate('mapSection.chips.renovated')}</button>
                        <button className="dm-chip">{translate('mapSection.chips.nearMetro')}</button>
                        <button className="dm-chip dm-chip--ghost">{translate('mapSection.chips.more')}</button>
                    </div>

                    <div className="dm-map__controls">
                        <button className="dm-mctl" title={translate('mapSection.controls.expand')} onClick={() => setExpanded((e) => !e)}>
                            {Icons.expand()}
                        </button>
                        <div className="dm-mctl-stack">
                            <button className="dm-mctl">{Icons.plus()}</button>
                            <div className="dm-mctl__divider" />
                            <button className="dm-mctl">{Icons.minus()}</button>
                        </div>
                        <button className="dm-mctl" title={translate('mapSection.controls.layers')}>
                            {Icons.layers()}
                        </button>
                        <button className="dm-mctl" title={translate('mapSection.controls.position')}>
                            {Icons.loc()}
                        </button>
                    </div>

                    {!filtersOpen && (
                        <button className="dm-map__tab dm-map__tab--left" onClick={() => setFiltersOpen(true)}>
                            {Icons.filter()}
                            <span>{translate('mapSection.tabs.filters')}</span>
                            <span className="dm-map__tab-badge">3</span>
                        </button>
                    )}

                    {!infoOpen && (
                        <button className="dm-map__tab dm-map__tab--right" onClick={() => setInfoOpen(true)}>
                            {Icons.info()}
                            <span>{translate('mapSection.tabs.info')}</span>
                        </button>
                    )}

                    <aside className={'dm-panel dm-panel--left ' + (filtersOpen ? 'is-open' : '')}>
                        <div className="dm-panel__head">
                            <div className="dm-panel__title">
                                <span className="dm-panel__icon">{Icons.filter()}</span>
                                <div>
                                    <div className="dm-panel__h">{translate('mapSection.panel.title')}</div>
                                    <div className="dm-panel__sub">
                                        {translate('mapSection.panel.sub', { active: filtered.length, count: filtered.length })}
                                    </div>
                                </div>
                            </div>
                            <button className="dm-iconbtn" onClick={() => setFiltersOpen(false)}>
                                {Icons.close()}
                            </button>
                        </div>

                        <div className="dm-panel__body">
                            <FilterGroup label={translate('mapSection.filters.transaction')}>
                                <SegRow
                                    value={filterMode}
                                    onChange={setFilterMode}
                                    opts={[
                                        { k: 'all', l: translate('mapSection.filters.all') },
                                        { k: 'sale', l: translate('mapSection.filters.sale') },
                                        { k: 'rent', l: translate('mapSection.filters.rent') },
                                    ]}
                                />
                            </FilterGroup>

                            <FilterGroup label={translate('mapSection.filters.price')}>
                                <div className="dm-range">
                                    <div className="dm-range__bar">
                                        <div className="dm-range__fill" style={{ width: `${(priceMax / 3000) * 100}%` }} />
                                        <div className="dm-range__handle" style={{ left: `${(priceMax / 3000) * 100}%` }} />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="3000"
                                        step="50"
                                        value={priceMax}
                                        onChange={(e) => setPriceMax(+e.target.value)}
                                        className="dm-range__native"
                                    />
                                    <div className="dm-range__labels">
                                        <span>$0</span>
                                        <span className="dm-range__val">{translate('mapSection.filters.from')} ${priceMax.toLocaleString()}K</span>
                                        <span>$3M</span>
                                    </div>
                                </div>
                            </FilterGroup>

                            <FilterGroup label={translate('mapSection.filters.rooms')}>
                                <div className="dm-pills">
                                    {roomOptions.map((_, i) => (
                                        <button
                                            key={i}
                                            className={'dm-pill ' + (beds === i ? 'is-on' : '')}
                                            onClick={() => setBeds(i)}
                                        >
                                            {roomLabels[i]}
                                        </button>
                                    ))}
                                </div>
                            </FilterGroup>

                            <FilterGroup label={translate('mapSection.filters.area')}>
                                <div className="dm-twoinput">
                                    <div className="dm-mininput">
                                        <span>{translate('mapSection.filters.from')}</span>
                                        <input defaultValue="40" />
                                        <em>m²</em>
                                    </div>
                                    <div className="dm-mininput">
                                        <span>{translate('mapSection.filters.to')}</span>
                                        <input defaultValue="280" />
                                        <em>m²</em>
                                    </div>
                                </div>
                            </FilterGroup>

                            <FilterGroup label={translate('mapSection.filters.features')}>
                                <div className="dm-checks">
                                    {featureOptions.map((key) => (
                                        <label key={key} className="dm-check">
                                            <input type="checkbox" defaultChecked={key === 'balcony'} />
                                            <span className="dm-check__box"></span>
                                            {translate(`mapSection.filters.${key}`)}
                                        </label>
                                    ))}
                                </div>
                            </FilterGroup>
                        </div>

                        <div className="dm-panel__foot">
                            <button className="dm-btn dm-btn--ghost dm-btn--sm">{translate('mapSection.buttons.reset')}</button>
                            <button className="dm-btn dm-btn--accent dm-btn--sm">
                                {translate('mapSection.buttons.show', { count: filtered.length })} {Icons.arrow()}
                            </button>
                        </div>
                    </aside>

                    <aside className={'dm-panel dm-panel--right ' + (infoOpen ? 'is-open' : '')}>
                        <div className="dm-panel__head">
                            <div className="dm-panel__title">
                                <span className="dm-panel__icon">{Icons.info()}</span>
                                <div>
                                    <div className="dm-panel__h">{translate('mapSection.tabs.info')}</div>
                                    <div className="dm-panel__sub">
                                        {translate('mapSection.info.heading')} #{activeProp.id} · {activeProp.district}
                                    </div>
                                </div>
                            </div>
                            <button className="dm-iconbtn" onClick={() => setInfoOpen(false)}>
                                {Icons.close()}
                            </button>
                        </div>

                        <div className="dm-panel__body dm-panel__body--info">
                            <div className="dm-prop-card">
                                <div className="dm-prop-card__media">
                                    <PlaceholderImage label={translate(`mapSection.properties.type.${activeProp.type}`) ?? activeProp.type} tone="warm" />
                                    <button className="dm-prop-card__fav">{Icons.heart()}</button>
                                    <div className="dm-prop-card__badge">
                                        {translate(`mapSection.status.${activeProp.status}`)}
                                    </div>
                                </div>
                                <div className="dm-prop-card__body">
                                    <div className="dm-prop-card__price">
                                        {activeProp.price}
                                        {activeProp.status === 'rent' && <em>{translate('mapSection.properties.perMonth')}</em>}
                                    </div>
                                    <div className="dm-prop-card__title">{activeProp.title}</div>
                                    <div className="dm-prop-card__loc">
                                        {Icons.pin()} {activeProp.district}
                                    </div>
                                    <div className="dm-prop-card__specs">
                                        <span>
                                            {Icons.bed()}
                                            {translate('mapSection.properties.rooms', { value: activeProp.beds })}
                                        </span>
                                        <span>
                                            {Icons.bath()}
                                            {translate('mapSection.properties.bathrooms', { value: activeProp.baths })}
                                        </span>
                                        <span>
                                            {Icons.area()}
                                            {translate('mapSection.properties.area', { value: activeProp.area })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="dm-info-block">
                                <div className="dm-info-block__h">{translate('mapSection.info.heading')}</div>
                                <div className="dm-info-row">
                                    <span>{translate('mapSection.info.schools')}</span>
                                    <strong>8 {translate('mapSection.info.nearby')}</strong>
                                </div>
                                <div className="dm-info-row">
                                    <span>{translate('mapSection.info.kindergartens')}</span>
                                    <strong>12 {translate('mapSection.info.nearby')}</strong>
                                </div>
                                <div className="dm-info-row">
                                    <span>{translate('mapSection.info.metro')}</span>
                                    <strong>4 {translate('mapSection.info.walk')}</strong>
                                </div>
                                <div className="dm-info-row">
                                    <span>{translate('mapSection.info.park')}</span>
                                    <strong>~ 600 {translate('mapSection.info.meters')}</strong>
                                </div>
                            </div>

                            <div className="dm-info-block">
                                <div className="dm-info-block__h">{translate('mapSection.dynamics.heading')}</div>
                                <Sparkline />
                                <div className="dm-info-row">
                                    <span>{translate('mapSection.dynamics.period')}</span>
                                    <strong className="dm-up">+8.4%</strong>
                                </div>
                            </div>

                            <div className="dm-info-actions">
                                <button className="dm-btn dm-btn--ghost dm-btn--sm">{translate('mapSection.actions.save')}</button>
                                <button className="dm-btn dm-btn--accent dm-btn--sm">{translate('mapSection.actions.contact')}</button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="dm-map-strip">
                {PROPERTIES.slice(0, 6).map((p) => (
                    <button
                        key={p.id}
                        className={'dm-map-strip__item ' + (p.id === active ? 'is-active' : '')}
                        onClick={() => setActive(p.id)}
                    >
                        <span className="dm-map-strip__price">{p.price}</span>
                        <span className="dm-map-strip__title">{p.title}</span>
                        <span className="dm-map-strip__sub">
                            {translate('mapSection.properties.rooms', { value: p.beds })} · {translate('mapSection.properties.area', { value: p.area })}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
};

interface MapCanvasProps {
    properties: Property[];
    active: number;
    onPick: (id: number) => void;
    translate: (key: string, options?: Record<string, unknown>) => string;
}

function MapCanvas({ properties, active, onPick, translate }: MapCanvasProps) {
    return (
        <svg className="dm-map__svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
            <defs>
                <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0e1a2e" />
                    <stop offset="100%" stopColor="#0a1322" />
                </linearGradient>
                <linearGradient id="riverG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(120,180,255,0.18)" />
                    <stop offset="100%" stopColor="rgba(120,180,255,0.06)" />
                </linearGradient>
                <radialGradient id="parkG">
                    <stop offset="0%" stopColor="rgba(120,200,140,0.18)" />
                    <stop offset="100%" stopColor="rgba(120,200,140,0)" />
                </radialGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                </pattern>
            </defs>

            <rect width="1000" height="600" fill="url(#mapBg)" />
            <rect width="1000" height="600" fill="url(#grid)" />

            <path
                d="M-20 460 C 180 380, 360 540, 560 420 S 900 380, 1040 460 L 1040 620 L -20 620 Z"
                fill="url(#riverG)"
                stroke="rgba(160,200,255,0.25)"
                strokeWidth="1"
            />

            <circle cx="190" cy="180" r="110" fill="url(#parkG)" />
            <circle cx="760" cy="220" r="140" fill="url(#parkG)" />

            <g stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M0 240 L1000 200" />
                <path d="M0 340 L1000 380" />
                <path d="M120 0 L160 600" />
                <path d="M380 0 L420 600" />
                <path d="M620 0 L660 600" />
                <path d="M820 0 L860 600" />
                <path d="M0 100 Q 500 60 1000 120" />
            </g>
            <g stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none">
                <path d="M0 280 L1000 280" />
                <path d="M0 420 L1000 420" />
                <path d="M240 0 L240 600" />
                <path d="M500 0 L500 600" />
                <path d="M720 0 L720 600" />
            </g>

            <g fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)">
                <rect x="60" y="50" width="60" height="50" />
                <rect x="280" y="120" width="80" height="50" />
                <rect x="520" y="80" width="70" height="60" />
                <rect x="700" y="60" width="60" height="80" />
                <rect x="880" y="100" width="80" height="60" />
                <rect x="60" y="300" width="80" height="60" />
                <rect x="280" y="280" width="70" height="50" />
                <rect x="540" y="280" width="60" height="60" />
                <rect x="720" y="320" width="80" height="60" />
                <rect x="60" y="500" width="60" height="50" />
                <rect x="280" y="520" width="80" height="50" />
                <rect x="540" y="500" width="60" height="60" />
            </g>

            <g>
                {[
                    [230, 250],
                    [500, 350],
                    [720, 260],
                    [820, 440],
                ].map(([x, y], i) => (
                    <g key={i} transform={`translate(${x},${y})`}>
                        <circle r="6" fill="#0e1a2e" stroke="rgba(245,166,35,0.6)" strokeWidth="1.5" />
                        <circle r="2" fill="rgba(245,166,35,0.9)" />
                    </g>
                ))}
            </g>

            <g>
                {properties.map((p) => {
                    const cx = (p.x / 100) * 1000;
                    const cy = (p.y / 100) * 600;
                    const isActive = p.id === active;
                    return (
                        <g
                            key={p.id}
                            transform={`translate(${cx},${cy})`}
                            className={'dm-marker ' + (isActive ? 'is-active' : '')}
                            onClick={() => onPick(p.id)}
                        >
                            {isActive && (
                                <circle r="38" fill="rgba(245,166,35,0.12)" className="dm-marker__pulse" />
                            )}
                            {isActive && <circle r="26" fill="rgba(245,166,35,0.18)" />}
                            <rect
                                x="-32"
                                y="-16"
                                width="64"
                                height="28"
                                rx="14"
                                fill={isActive ? 'var(--accent)' : '#fff'}
                                stroke={isActive ? 'var(--accent)' : 'rgba(0,0,0,0.1)'}
                                style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }}
                            />
                            <text
                                x="0"
                                y="4"
                                textAnchor="middle"
                                fontSize="13"
                                fontWeight="700"
                                fill={isActive ? '#0a1322' : '#0a1322'}
                            >
                                {p.price}
                            </text>
                            <polygon points="-4,12 4,12 0,18" fill={isActive ? 'var(--accent)' : '#fff'} />
                        </g>
                    );
                })}
            </g>

            <text x="990" y="592" textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.25)">
                {translate('mapSection.watermark')}
            </text>
        </svg>
    );
}

function Sparkline() {
    const points = [22, 25, 23, 28, 30, 28, 32, 35, 34, 38, 42, 40, 44];
    const max = Math.max(...points),
        min = Math.min(...points);
    const w = 220,
        h = 56;
    const path = points
        .map((v, i) => {
            const x = (i / (points.length - 1)) * w;
            const y = h - ((v - min) / (max - min)) * (h - 6) - 3;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');

    return (
        <svg className="dm-spark" viewBox={`0 0 ${w} ${h}`}>
            <defs>
                <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${path} L${w} ${h} L0 ${h} Z`} fill="url(#spk)" />
            <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.8" />
        </svg>
    );
}

interface FilterGroupProps {
    label: string;
    children?: ReactNode;
}

function FilterGroup({ label, children }: FilterGroupProps) {
    return (
        <div className="dm-fgroup">
            <div className="dm-fgroup__l">{label}</div>
            {children}
        </div>
    );
}

interface SegRowProps {
    value: FilterMode;
    onChange: (value: FilterMode) => void;
    opts: Array<{ k: FilterMode; l: string }>;
}

function SegRow({ value, onChange, opts }: SegRowProps) {
    return (
        <div className="dm-seg">
            {opts.map((o) => (
                <button
                    key={o.k}
                    className={'dm-seg__btn ' + (value === o.k ? 'is-on' : '')}
                    onClick={() => onChange(o.k)}
                >
                    {o.l}
                </button>
            ))}
            <div
                className="dm-seg__pip"
                style={{
                    transform: `translateX(${opts.findIndex((o) => o.k === value) * 100}%)`,
                    width: `${100 / opts.length}%`,
                }}
            />
        </div>
    );
}

interface ChipGroupProps {
    value: FilterMode;
    onChange: (value: FilterMode) => void;
    options: Array<{ k: FilterMode; l: string; n: number }>;
}

function ChipGroup({ value, onChange, options }: ChipGroupProps) {
    return (
        <div className="dm-chip-grp">
            {options.map((o) => (
                <button
                    key={o.k}
                    className={'dm-chip dm-chip--solid ' + (value === o.k ? 'is-on' : '')}
                    onClick={() => onChange(o.k)}
                >
                    {o.l} <em>{o.n}</em>
                </button>
            ))}
        </div>
    );
}
