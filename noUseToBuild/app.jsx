/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakSlider */
const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   DATA
   ============================================================ */
const PROPERTIES = [
  { id: 1, x: 22, y: 38, price: "$485K",  beds: 3, baths: 2, area: 124, type: "Квартира",  title: "Sky Loft на Печерську",      district: "Печерськ, Київ",     status: "sale" },
  { id: 2, x: 38, y: 52, price: "$1.2M",  beds: 5, baths: 4, area: 280, type: "Будинок",   title: "Вілла з видом на Дніпро",    district: "Конча-Заспа",        status: "sale" },
  { id: 3, x: 56, y: 30, price: "$2.4K",  beds: 2, baths: 1, area: 68,  type: "Квартира",  title: "Студія в історичному домі", district: "Поділ, Київ",        status: "rent" },
  { id: 4, x: 70, y: 58, price: "$680K",  beds: 4, baths: 3, area: 186, type: "Таунхаус",  title: "Сучасний таунхаус",          district: "Софіївська Борщагівка", status: "sale" },
  { id: 5, x: 46, y: 72, price: "$3.8K",  beds: 3, baths: 2, area: 95,  type: "Пентхаус",  title: "Пентхаус з терасою",         district: "Шевченківський",     status: "rent" },
  { id: 6, x: 82, y: 40, price: "$320K",  beds: 2, baths: 1, area: 72,  type: "Квартира",  title: "Light Apartment 72",         district: "Оболонь",            status: "sale" },
  { id: 7, x: 30, y: 18, price: "$5.6K",  beds: 4, baths: 3, area: 210, type: "Будинок",   title: "Family House",               district: "Козин",              status: "rent" },
  { id: 8, x: 64, y: 80, price: "$890K",  beds: 4, baths: 3, area: 175, type: "Квартира",  title: "Glass Tower Residence",      district: "Голосіївський",      status: "sale" },
];

const FEATURED = [
  { id: "a", title: "Skyline Loft 42",    price: "$485,000", spec: "3 кімн · 124 м² · Печерськ",  tag: "Новинка",   color: "248 84 64",  },
  { id: "b", title: "Riverside Villa",     price: "$1,200,000", spec: "5 кімн · 280 м² · Конча-Заспа", tag: "Преміум", color: "32 90 58",  },
  { id: "c", title: "Old Town Studio",     price: "$2,400 / міс", spec: "2 кімн · 68 м² · Поділ",     tag: "Оренда",    color: "210 60 50", },
  { id: "d", title: "Glass Penthouse",     price: "$3,800 / міс", spec: "3 кімн · 95 м² · Центр",     tag: "Топ-вибір", color: "16 86 60",  },
];

const CATEGORIES = [
  { key: "buy",  label: "Купити",       count: "12 480",  icon: "key"    },
  { key: "rent", label: "Орендувати",   count: "6 320",   icon: "bed"    },
  { key: "comm", label: "Комерційна",   count: "1 845",   icon: "office" },
  { key: "new",  label: "Новобудови",   count: "412",     icon: "crane"  },
];

/* ============================================================
   ICONS
   ============================================================ */
const I = {
  filter: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="4" y1="7"  x2="11" y2="7"/><line x1="15" y1="7"  x2="20" y2="7"/><circle cx="13" cy="7"  r="2.2"/><line x1="4" y1="17" x2="8"  y2="17"/><line x1="12" y1="17" x2="20" y2="17"/><circle cx="10" cy="17" r="2.2"/></svg>,
  info:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="17"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/></svg>,
  close:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>,
  expand: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="4 14 4 20 10 20"/><polyline points="20 10 20 4 14 4"/><line x1="14" y1="10" x2="20" y2="4"/><line x1="4" y1="20" x2="10" y2="14"/></svg>,
  search: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>,
  pin:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  bed:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 18V8m18 10v-4a3 3 0 0 0-3-3H3"/><circle cx="7" cy="11" r="2"/></svg>,
  bath:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 13h16v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-3z"/><path d="M6 13V6a2 2 0 0 1 4 0"/><line x1="6" y1="19" x2="6" y2="21"/><line x1="18" y1="19" x2="18" y2="21"/></svg>,
  area:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>,
  heart:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  arrow:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>,
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  minus:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 22 8 12 14 2 8 12 2"/><polyline points="2 14 12 20 22 14"/></svg>,
  loc:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>,
};

/* ============================================================
   NAV
   ============================================================ */
function Nav() {
  const links = ["Купити", "Орендувати", "Новобудови", "Ріелтори", "Про нас"];
  return (
    <nav className="dm-nav">
      <div className="dm-nav__brand">
        <div className="dm-nav__logo" aria-hidden>
          <svg viewBox="0 0 32 32" width="28" height="28">
            <path d="M5 16 L16 6 L27 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <rect x="8" y="14" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="22" cy="11" r="2.4" fill="var(--accent)"/>
          </svg>
        </div>
        <div className="dm-nav__brand-text">
          <div className="dm-nav__brand-name">Дім&nbsp;мрії</div>
          <div className="dm-nav__brand-sub">est. 2024 · Україна</div>
        </div>
      </div>
      <ul className="dm-nav__links">
        {links.map(l => <li key={l}><a href="#">{l}</a></li>)}
      </ul>
      <div className="dm-nav__cta">
        <button className="dm-lang">UA <span>·</span> EN</button>
        <button className="dm-btn dm-btn--ghost">Увійти</button>
        <button className="dm-btn dm-btn--accent">+ Розмістити</button>
      </div>
    </nav>
  );
}

/* ============================================================
   HERO
   ============================================================ */
function Hero({ accent }) {
  const [tab, setTab] = useState("buy");
  const tabs = [
    { k: "buy",   l: "Купити" },
    { k: "rent",  l: "Орендувати" },
    { k: "comm",  l: "Комерція" },
    { k: "new",   l: "Новобудови" },
  ];

  return (
    <section className="dm-hero">
      <div className="dm-hero__bg" aria-hidden>
        <div className="dm-hero__bg-grad"/>
        <PlaceholderImage label="hero · architectural exterior" tone="dark"/>
      </div>

      <div className="dm-hero__inner">
        <div className="dm-hero__eyebrow">
          <span className="dm-dot"/> 12 480 актуальних пропозицій · Оновлено сьогодні
        </div>

        <h1 className="dm-hero__title">
          <span>Дім, де</span>
          <span className="dm-hero__title-it">починається</span>
          <span>ваша історія.</span>
        </h1>

        <p className="dm-hero__lede">
          Знайдіть нерухомість для життя, інвестицій чи відпочинку — з інтерактивною
          мапою, фільтрами в один клік і прозорою аналітикою цін.
        </p>

        <div className="dm-search">
          <div className="dm-search__tabs">
            {tabs.map(t => (
              <button key={t.k}
                className={"dm-search__tab " + (tab === t.k ? "is-active" : "")}
                onClick={() => setTab(t.k)}>
                {t.l}
              </button>
            ))}
          </div>
          <div className="dm-search__row">
            <div className="dm-search__field dm-search__field--wide">
              <label>Локація</label>
              <div className="dm-search__input">
                {I.loc}<input placeholder="Київ, Львів, Одеса…" defaultValue="Київ, всі райони"/>
              </div>
            </div>
            <div className="dm-search__field">
              <label>Тип</label>
              <div className="dm-search__input">
                <select defaultValue="any">
                  <option value="any">Будь-який</option>
                  <option>Квартира</option>
                  <option>Будинок</option>
                  <option>Таунхаус</option>
                  <option>Пентхаус</option>
                </select>
              </div>
            </div>
            <div className="dm-search__field">
              <label>Ціна</label>
              <div className="dm-search__input">
                <select defaultValue="any">
                  <option value="any">До $1M</option>
                  <option>До $250K</option>
                  <option>$250K — $500K</option>
                  <option>$500K — $1M</option>
                  <option>$1M+</option>
                </select>
              </div>
            </div>
            <button className="dm-search__go">
              {I.search}<span>Шукати</span>
            </button>
          </div>
        </div>

        <div className="dm-hero__stats">
          <Stat n="12 480" l="Пропозицій"/>
          <Stat n="384" l="Перевірених ріелторів"/>
          <Stat n="98%" l="Задоволених клієнтів"/>
          <Stat n="24 год" l="Середній час відповіді"/>
        </div>
      </div>

      <div className="dm-hero__scroll">
        <div className="dm-hero__scroll-line"/>
        <span>прокрутіть до мапи</span>
      </div>
    </section>
  );
}
function Stat({ n, l }) {
  return (
    <div className="dm-stat">
      <div className="dm-stat__n">{n}</div>
      <div className="dm-stat__l">{l}</div>
    </div>
  );
}

/* ============================================================
   MAP — the centerpiece
   ============================================================ */
function MapSection({ accent }) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [active, setActive] = useState(2); // selected property id
  const [filterMode, setFilterMode] = useState("all"); // all | sale | rent
  const [priceMax, setPriceMax] = useState(1500);
  const [beds, setBeds] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const activeProp = useMemo(() => PROPERTIES.find(p => p.id === active), [active]);

  const filtered = useMemo(() => {
    return PROPERTIES.filter(p => filterMode === "all" || p.status === filterMode);
  }, [filterMode]);

  return (
    <section id="map" className={"dm-map-section " + (expanded ? "is-expanded" : "")}>
      <div className="dm-map-section__head">
        <div>
          <div className="dm-eyebrow">02 · Інтерактивна мапа</div>
          <h2 className="dm-h2">Досліджуйте місто, як ніколи раніше</h2>
        </div>
        <p className="dm-map-section__lede">
          {filtered.length} об'єктів у фокусі. Натисніть на маркер, щоб побачити деталі,
          або скористайтеся розгортаючимися панелями фільтрів та інформації.
        </p>
      </div>

      <div className="dm-map">
        {/* Map canvas */}
        <div className="dm-map__canvas">
          <MapCanvas
            properties={filtered}
            active={active}
            onPick={setActive}
          />

          {/* Top floating chips */}
          <div className="dm-map__chips">
            <ChipGroup value={filterMode} onChange={setFilterMode} options={[
              {k:"all",  l:"Все",    n: PROPERTIES.length},
              {k:"sale", l:"Продаж", n: PROPERTIES.filter(p=>p.status==="sale").length},
              {k:"rent", l:"Оренда", n: PROPERTIES.filter(p=>p.status==="rent").length},
            ]}/>
            <div className="dm-map__chip-divider"/>
            <button className="dm-chip">Новобудови</button>
            <button className="dm-chip">З ремонтом</button>
            <button className="dm-chip">Поруч з метро</button>
            <button className="dm-chip dm-chip--ghost">+ ще 12</button>
          </div>

          {/* Map controls — right side */}
          <div className="dm-map__controls">
            <button className="dm-mctl" title="Розгорнути" onClick={()=>setExpanded(e=>!e)}>
              {I.expand}
            </button>
            <div className="dm-mctl-stack">
              <button className="dm-mctl">{I.plus}</button>
              <div className="dm-mctl__divider"/>
              <button className="dm-mctl">{I.minus}</button>
            </div>
            <button className="dm-mctl" title="Шари">{I.layers}</button>
            <button className="dm-mctl" title="Моя позиція">{I.loc}</button>
          </div>

          {/* LEFT — filter trigger (when panel closed) */}
          {!filtersOpen && (
            <button className="dm-map__tab dm-map__tab--left" onClick={()=>setFiltersOpen(true)}>
              {I.filter}<span>Фільтри</span>
              <span className="dm-map__tab-badge">3</span>
            </button>
          )}

          {/* RIGHT — info trigger (when panel closed) */}
          {!infoOpen && (
            <button className="dm-map__tab dm-map__tab--right" onClick={()=>setInfoOpen(true)}>
              {I.info}<span>Інформація</span>
            </button>
          )}

          {/* LEFT panel — FILTERS */}
          <aside className={"dm-panel dm-panel--left " + (filtersOpen ? "is-open" : "")}>
            <div className="dm-panel__head">
              <div className="dm-panel__title">
                <span className="dm-panel__icon">{I.filter}</span>
                <div>
                  <div className="dm-panel__h">Фільтри</div>
                  <div className="dm-panel__sub">3 активних · {filtered.length} результатів</div>
                </div>
              </div>
              <button className="dm-iconbtn" onClick={()=>setFiltersOpen(false)}>{I.close}</button>
            </div>

            <div className="dm-panel__body">
              <FilterGroup label="Тип угоди">
                <SegRow value={filterMode} onChange={setFilterMode} opts={[
                  {k:"all", l:"Все"},{k:"sale", l:"Купити"},{k:"rent", l:"Орендувати"}
                ]}/>
              </FilterGroup>

              <FilterGroup label="Ціна, $">
                <div className="dm-range">
                  <div className="dm-range__bar">
                    <div className="dm-range__fill" style={{width: `${(priceMax/3000)*100}%`}}/>
                    <div className="dm-range__handle" style={{left: `${(priceMax/3000)*100}%`}}/>
                  </div>
                  <input type="range" min="0" max="3000" step="50"
                    value={priceMax} onChange={e=>setPriceMax(+e.target.value)}
                    className="dm-range__native"/>
                  <div className="dm-range__labels">
                    <span>$0</span>
                    <span className="dm-range__val">до ${priceMax.toLocaleString()}K</span>
                    <span>$3M</span>
                  </div>
                </div>
              </FilterGroup>

              <FilterGroup label="Кімнат">
                <div className="dm-pills">
                  {[0,1,2,3,4,"5+"].map((n,i)=>(
                    <button key={i}
                      className={"dm-pill " + (beds===i ? "is-on":"")}
                      onClick={()=>setBeds(i)}>
                      {n===0?"Все":n}
                    </button>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Площа">
                <div className="dm-twoinput">
                  <div className="dm-mininput"><span>від</span><input defaultValue="40"/><em>м²</em></div>
                  <div className="dm-mininput"><span>до</span><input defaultValue="280"/><em>м²</em></div>
                </div>
              </FilterGroup>

              <FilterGroup label="Особливості">
                <div className="dm-checks">
                  {["Балкон / тераса","Паркінг","Меблі","Поруч з метро","Новобудова","З ремонтом"].map(c=>(
                    <label key={c} className="dm-check">
                      <input type="checkbox" defaultChecked={c==="Балкон / тераса"}/>
                      <span className="dm-check__box"></span>{c}
                    </label>
                  ))}
                </div>
              </FilterGroup>
            </div>

            <div className="dm-panel__foot">
              <button className="dm-btn dm-btn--ghost dm-btn--sm">Скинути</button>
              <button className="dm-btn dm-btn--accent dm-btn--sm">
                Показати {filtered.length} {I.arrow}
              </button>
            </div>
          </aside>

          {/* RIGHT panel — INFO */}
          <aside className={"dm-panel dm-panel--right " + (infoOpen ? "is-open" : "")}>
            <div className="dm-panel__head">
              <div className="dm-panel__title">
                <span className="dm-panel__icon">{I.info}</span>
                <div>
                  <div className="dm-panel__h">Інформація</div>
                  <div className="dm-panel__sub">Об'єкт #{activeProp.id} · {activeProp.district}</div>
                </div>
              </div>
              <button className="dm-iconbtn" onClick={()=>setInfoOpen(false)}>{I.close}</button>
            </div>

            <div className="dm-panel__body dm-panel__body--info">
              <div className="dm-prop-card">
                <div className="dm-prop-card__media">
                  <PlaceholderImage label={activeProp.type.toLowerCase()} tone="warm"/>
                  <button className="dm-prop-card__fav">{I.heart}</button>
                  <div className="dm-prop-card__badge">
                    {activeProp.status === "sale" ? "Продаж" : "Оренда"}
                  </div>
                </div>
                <div className="dm-prop-card__body">
                  <div className="dm-prop-card__price">{activeProp.price}
                    {activeProp.status === "rent" && <em> / міс</em>}
                  </div>
                  <div className="dm-prop-card__title">{activeProp.title}</div>
                  <div className="dm-prop-card__loc">{I.pin} {activeProp.district}</div>
                  <div className="dm-prop-card__specs">
                    <span>{I.bed}{activeProp.beds} кімн</span>
                    <span>{I.bath}{activeProp.baths} с/в</span>
                    <span>{I.area}{activeProp.area} м²</span>
                  </div>
                </div>
              </div>

              <div className="dm-info-block">
                <div className="dm-info-block__h">Про район</div>
                <div className="dm-info-row"><span>Школи</span><strong>8 поруч</strong></div>
                <div className="dm-info-row"><span>Дит. садки</span><strong>12 поруч</strong></div>
                <div className="dm-info-row"><span>Метро</span><strong>4 хв пішки</strong></div>
                <div className="dm-info-row"><span>Парк</span><strong>~ 600 м</strong></div>
              </div>

              <div className="dm-info-block">
                <div className="dm-info-block__h">Динаміка цін</div>
                <Sparkline/>
                <div className="dm-info-row">
                  <span>За 12 міс</span>
                  <strong className="dm-up">+8.4%</strong>
                </div>
              </div>

              <div className="dm-info-actions">
                <button className="dm-btn dm-btn--ghost dm-btn--sm">Зберегти</button>
                <button className="dm-btn dm-btn--accent dm-btn--sm">Зв'язатися</button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom — quick scroll of properties */}
      <div className="dm-map-strip">
        {PROPERTIES.slice(0,6).map(p => (
          <button key={p.id}
            className={"dm-map-strip__item " + (p.id===active?"is-active":"")}
            onClick={()=>setActive(p.id)}>
            <span className="dm-map-strip__price">{p.price}</span>
            <span className="dm-map-strip__title">{p.title}</span>
            <span className="dm-map-strip__sub">{p.beds} кімн · {p.area} м²</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="dm-fgroup">
      <div className="dm-fgroup__l">{label}</div>
      {children}
    </div>
  );
}
function SegRow({ value, onChange, opts }) {
  return (
    <div className="dm-seg">
      {opts.map(o => (
        <button key={o.k}
          className={"dm-seg__btn " + (value===o.k?"is-on":"")}
          onClick={()=>onChange(o.k)}>{o.l}</button>
      ))}
      <div className="dm-seg__pip" style={{
        transform: `translateX(${opts.findIndex(o=>o.k===value)*100}%)`,
        width: `${100/opts.length}%`
      }}/>
    </div>
  );
}
function ChipGroup({ value, onChange, options }) {
  return (
    <div className="dm-chip-grp">
      {options.map(o => (
        <button key={o.k}
          className={"dm-chip dm-chip--solid " + (value===o.k?"is-on":"")}
          onClick={()=>onChange(o.k)}>
          {o.l} <em>{o.n}</em>
        </button>
      ))}
    </div>
  );
}

/* Stylized map canvas — SVG with abstract city blocks */
function MapCanvas({ properties, active, onPick }) {
  return (
    <svg className="dm-map__svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      {/* gradient ground */}
      <defs>
        <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#0e1a2e"/>
          <stop offset="100%" stopColor="#0a1322"/>
        </linearGradient>
        <linearGradient id="riverG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="rgba(120,180,255,0.18)"/>
          <stop offset="100%" stopColor="rgba(120,180,255,0.06)"/>
        </linearGradient>
        <radialGradient id="parkG">
          <stop offset="0%"  stopColor="rgba(120,200,140,0.18)"/>
          <stop offset="100%" stopColor="rgba(120,200,140,0)"/>
        </radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
        </pattern>
      </defs>

      <rect width="1000" height="600" fill="url(#mapBg)"/>
      <rect width="1000" height="600" fill="url(#grid)"/>

      {/* river */}
      <path d="M-20 460 C 180 380, 360 540, 560 420 S 900 380, 1040 460 L 1040 620 L -20 620 Z"
            fill="url(#riverG)" stroke="rgba(160,200,255,0.25)" strokeWidth="1"/>

      {/* parks */}
      <circle cx="190" cy="180" r="110" fill="url(#parkG)"/>
      <circle cx="760" cy="220" r="140" fill="url(#parkG)"/>

      {/* roads */}
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M0 240 L1000 200"/>
        <path d="M0 340 L1000 380"/>
        <path d="M120 0 L160 600"/>
        <path d="M380 0 L420 600"/>
        <path d="M620 0 L660 600"/>
        <path d="M820 0 L860 600"/>
        <path d="M0 100 Q 500 60 1000 120"/>
      </g>
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none">
        <path d="M0 280 L1000 280"/>
        <path d="M0 420 L1000 420"/>
        <path d="M240 0 L240 600"/>
        <path d="M500 0 L500 600"/>
        <path d="M720 0 L720 600"/>
      </g>

      {/* city blocks (rectangles) */}
      <g fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)">
        <rect x="60"  y="50"  width="60" height="50"/>
        <rect x="280" y="120" width="80" height="50"/>
        <rect x="520" y="80"  width="70" height="60"/>
        <rect x="700" y="60"  width="60" height="80"/>
        <rect x="880" y="100" width="80" height="60"/>
        <rect x="60"  y="300" width="80" height="60"/>
        <rect x="280" y="280" width="70" height="50"/>
        <rect x="540" y="280" width="60" height="60"/>
        <rect x="720" y="320" width="80" height="60"/>
        <rect x="60"  y="500" width="60" height="50"/>
        <rect x="280" y="520" width="80" height="50"/>
        <rect x="540" y="500" width="60" height="60"/>
      </g>

      {/* metro stations */}
      <g>
        {[[230, 250], [500, 350], [720, 260], [820, 440]].map(([x,y], i)=>(
          <g key={i} transform={`translate(${x},${y})`}>
            <circle r="6" fill="#0e1a2e" stroke="rgba(245,166,35,0.6)" strokeWidth="1.5"/>
            <circle r="2" fill="rgba(245,166,35,0.9)"/>
          </g>
        ))}
      </g>

      {/* property markers */}
      <g>
        {properties.map(p => {
          const cx = (p.x/100)*1000;
          const cy = (p.y/100)*600;
          const isActive = p.id === active;
          return (
            <g key={p.id} transform={`translate(${cx},${cy})`}
               className={"dm-marker " + (isActive?"is-active":"")}
               onClick={()=>onPick(p.id)}>
              {isActive && <circle r="38" fill="rgba(245,166,35,0.12)" className="dm-marker__pulse"/>}
              {isActive && <circle r="26" fill="rgba(245,166,35,0.18)"/>}
              <rect x="-32" y="-16" width="64" height="28" rx="14"
                fill={isActive ? "var(--accent)" : "#fff"}
                stroke={isActive ? "var(--accent)" : "rgba(0,0,0,0.1)"}
                style={{filter:"drop-shadow(0 6px 14px rgba(0,0,0,0.35))"}}/>
              <text x="0" y="4" textAnchor="middle"
                fontSize="13" fontWeight="700"
                fill={isActive ? "#0a1322" : "#0a1322"}>{p.price}</text>
              <polygon points="-4,12 4,12 0,18"
                fill={isActive ? "var(--accent)" : "#fff"}/>
            </g>
          );
        })}
      </g>

      {/* attribution */}
      <text x="990" y="592" textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.25)">
        Дім мрії · Інтерактивна мапа
      </text>
    </svg>
  );
}

/* tiny sparkline */
function Sparkline() {
  const points = [22, 25, 23, 28, 30, 28, 32, 35, 34, 38, 42, 40, 44];
  const max = Math.max(...points), min = Math.min(...points);
  const w = 220, h = 56;
  const path = points.map((v, i) => {
    const x = (i / (points.length-1)) * w;
    const y = h - ((v - min)/(max-min)) * (h-6) - 3;
    return `${i===0?"M":"L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg className="dm-spark" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${path} L${w} ${h} L0 ${h} Z`} fill="url(#spk)"/>
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.8"/>
    </svg>
  );
}

/* ============================================================
   FEATURED PROPERTIES
   ============================================================ */
function Featured() {
  return (
    <section className="dm-section">
      <div className="dm-section__head">
        <div>
          <div className="dm-eyebrow">03 · Підбірка редакції</div>
          <h2 className="dm-h2">Рекомендовані об'єкти тижня</h2>
        </div>
        <a href="#" className="dm-link">Усі рекомендації {I.arrow}</a>
      </div>
      <div className="dm-feat">
        {FEATURED.map((p, i) => (
          <article key={p.id} className={"dm-feat__card " + (i===0?"is-large":"")}>
            <div className="dm-feat__media">
              <PlaceholderImage label={p.title} tone="warm"/>
              <div className="dm-feat__tag">{p.tag}</div>
              <button className="dm-feat__fav">{I.heart}</button>
            </div>
            <div className="dm-feat__body">
              <div className="dm-feat__price">{p.price}</div>
              <div className="dm-feat__title">{p.title}</div>
              <div className="dm-feat__spec">{p.spec}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   CATEGORIES
   ============================================================ */
function Categories() {
  return (
    <section className="dm-section">
      <div className="dm-section__head">
        <div>
          <div className="dm-eyebrow">04 · Категорії</div>
          <h2 className="dm-h2">Оберіть свій формат пошуку</h2>
        </div>
      </div>
      <div className="dm-cats">
        {CATEGORIES.map(c => (
          <a key={c.key} href="#" className="dm-cat">
            <div className="dm-cat__icon">
              <CatIcon kind={c.icon}/>
            </div>
            <div className="dm-cat__body">
              <div className="dm-cat__label">{c.label}</div>
              <div className="dm-cat__count">{c.count} об'єктів</div>
            </div>
            <div className="dm-cat__arrow">{I.arrow}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
function CatIcon({ kind }) {
  const props = { width:32, height:32, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:1.6 };
  switch(kind) {
    case "key":    return <svg {...props}><circle cx="8" cy="14" r="4"/><path d="M11 12l9-9m-3 3l2 2m-4-2l2 2"/></svg>;
    case "bed":    return <svg {...props}><path d="M3 18V8m18 10v-4a3 3 0 0 0-3-3H3"/><circle cx="7" cy="11" r="2"/></svg>;
    case "office": return <svg {...props}><rect x="3" y="3" width="18" height="18"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>;
    case "crane":  return <svg {...props}><path d="M4 20V4h2v12h14v4z"/><line x1="6" y1="10" x2="20" y2="10"/><line x1="14" y1="10" x2="14" y2="16"/></svg>;
    default: return null;
  }
}

/* ============================================================
   CTA — list your property
   ============================================================ */
function ListCta() {
  return (
    <section className="dm-cta">
      <div className="dm-cta__inner">
        <div>
          <div className="dm-eyebrow dm-eyebrow--light">05 · Власникам</div>
          <h2 className="dm-h2 dm-h2--light">
            Розмістіть оголошення —<br/>
            <span className="dm-it">і отримайте перший контакт за 24 години.</span>
          </h2>
          <p className="dm-cta__lede">
            Безкоштовно. Перевірка модератора. Доступ до 50 000+ покупців на місяць.
            Жодних прихованих комісій — ви платите лише за результат.
          </p>
          <div className="dm-cta__row">
            <button className="dm-btn dm-btn--accent dm-btn--lg">Здаю в оренду</button>
            <button className="dm-btn dm-btn--light dm-btn--lg">Продаю</button>
          </div>
          <div className="dm-cta__meta">
            <span>★ 4.9 / 5 — 2 380 відгуків</span>
            <span>· Підтримка 24/7</span>
          </div>
        </div>
        <div className="dm-cta__art">
          <div className="dm-cta__phone">
            <div className="dm-cta__phone-screen">
              <div className="dm-cta__phone-bar"/>
              <div className="dm-cta__phone-img">
                <PlaceholderImage label="property listing form" tone="warm"/>
              </div>
              <div className="dm-cta__phone-row"/>
              <div className="dm-cta__phone-row"/>
              <div className="dm-cta__phone-btn">Опублікувати</div>
            </div>
          </div>
          <div className="dm-cta__badge dm-cta__badge--1">
            <strong>+24%</strong>
            <span>переглядів цього тижня</span>
          </div>
          <div className="dm-cta__badge dm-cta__badge--2">
            <strong>3 нові</strong>
            <span>запити на перегляд</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  return (
    <footer className="dm-foot">
      <div className="dm-foot__top">
        <div className="dm-foot__brand">
          <div className="dm-nav__logo">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <path d="M5 16 L16 6 L27 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <rect x="8" y="14" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="22" cy="11" r="2.4" fill="var(--accent)"/>
            </svg>
          </div>
          <div className="dm-foot__brand-name">Дім мрії</div>
          <p>Платформа нерухомості нового покоління. Прозоро, швидко, людяно.</p>
        </div>
        <FooterCol h="Пошук" links={["Купити квартиру","Орендувати","Новобудови","Комерційна","Заміська"]}/>
        <FooterCol h="Власникам" links={["Розмістити","Тарифи","Перевірка","Аналітика цін","Безпека угод"]}/>
        <FooterCol h="Компанія" links={["Про нас","Кар'єра","Преса","Партнерам","Контакти"]}/>
      </div>
      <div className="dm-foot__bot">
        <span>© 2024–2026 Дім мрії · Усі права захищені</span>
        <span>Зроблено з ❤ в Україні</span>
      </div>
    </footer>
  );
}
function FooterCol({ h, links }) {
  return (
    <div className="dm-foot__col">
      <div className="dm-foot__h">{h}</div>
      <ul>{links.map(l=><li key={l}><a href="#">{l}</a></li>)}</ul>
    </div>
  );
}

/* ============================================================
   PLACEHOLDER IMAGE
   ============================================================ */
function PlaceholderImage({ label, tone="dark" }) {
  const bg = tone==="warm" ? "linear-gradient(135deg,#3a2418,#1a0f08)" : "linear-gradient(135deg,#0e1a2e,#040810)";
  return (
    <div className="dm-ph" style={{background:bg}}>
      <svg className="dm-ph__stripes" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <pattern id={"s"+label.replace(/\s/g,"")} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.04)" strokeWidth="3"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill={"url(#s"+label.replace(/\s/g,"")+")"}/>
      </svg>
      <div className="dm-ph__label">{label}</div>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#f5a623",
  "bg": "#0a1322",
  "fontDisplay": "Unbounded",
  "showHero": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const accentOptions = ["#f5a623", "#e85a4f", "#5b8def", "#7ec27a"];
  const bgOptions     = ["#0a1322", "#13110d", "#0e1623", "#1a1320"];

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--bg", t.bg);
    document.documentElement.style.setProperty("--font-display", `"${t.fontDisplay}", serif`);
  }, [t]);

  return (
    <div className="dm-root" data-screen-label="Дім мрії — Home">
      <Nav/>
      {t.showHero && <Hero accent={t.accent}/>}
      <MapSection accent={t.accent}/>
      <Featured/>
      <Categories/>
      <ListCta/>
      <Footer/>

      <TweaksPanel title="Tweaks" defaultPosition={{ right: 20, bottom: 20 }}>
        <TweakSection title="Акцент">
          <TweakColor label="Колір акценту" tweakKey="accent" options={accentOptions} value={t.accent} onChange={setTweak}/>
          <TweakColor label="Фон сторінки"  tweakKey="bg"     options={bgOptions}     value={t.bg}     onChange={setTweak}/>
        </TweakSection>
        <TweakSection title="Типографіка">
          <TweakRadio label="Заголовки" tweakKey="fontDisplay"
            options={["Unbounded","Playfair Display","Manrope"]}
            value={t.fontDisplay} onChange={setTweak}/>
        </TweakSection>
        <TweakSection title="Розділи">
          <TweakToggle label="Показати hero" tweakKey="showHero" value={t.showHero} onChange={setTweak}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
