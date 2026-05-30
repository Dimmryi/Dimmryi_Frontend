import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Hero } from '../components/Hero';
import { MapSection } from '../components/MapSection';
import { Featured } from '../components/Featured';
import { Categories } from '../components/Categories';
import { ListCta } from '../components/ListCta';
import { Footer } from '../components/Footer';
import {
    TweaksPanel,
    TweakSection,
    TweakColor,
    TweakRadio,
    TweakToggle,
} from '../components/TweaksPanel';
import { RootState } from '../store/store';
import { setTweak } from '../store/tweaksSlice';
import { useLanguage } from '../LanguageProvider';
import { useAuth } from '../services/useAuth';
import { resetFilter } from '../features/filter/filterSlice';
import { resetMapFilter } from '../features/filterMap/filterMapSlice';
import { resetNotificationProperty } from '../features/notification/notificationSlice';
import { setScrollY } from '../features/scroll/scrollSlice';
import { clearImages } from '../features/upLoadImages/upLoadImagesSlice';

export function Home() {
    const dispatch = useDispatch();
    const tweaks = useSelector((state: RootState) => state.tweaks.values);
    const { translate } = useLanguage();
    const { handleResetUserData } = useAuth();

    useEffect(() => {
        document.documentElement.style.setProperty('--accent', tweaks.accent);
        document.documentElement.style.setProperty('--bg', tweaks.bg);
        document.documentElement.style.setProperty('--font-display', `"${tweaks.fontDisplay}", serif`);
    }, [tweaks]);

    const accentOptions = ['#f5a623', '#e85a4f', '#5b8def', '#7ec27a'];
    const bgOptions = ['#0a1322', '#13110d', '#0e1623', '#1a1320'];

    const handleTweakChange = <K extends keyof typeof tweaks>(key: K, value: (typeof tweaks)[K]) => {
        dispatch(setTweak({ [key]: value }));
    };

    const handleDevReset = async () => {
        await handleResetUserData();
        dispatch(resetFilter());
        dispatch(resetMapFilter());
        dispatch(resetNotificationProperty());
        dispatch(setScrollY(0));
        dispatch(clearImages());
        localStorage.removeItem('scrollPosition');
        localStorage.removeItem('coordsCache');
    };

    return (
        <>
            <button className="dm-dev-reset" onClick={handleDevReset}>
                🔄 DEV: Reset all state
            </button>
            {tweaks.showHero && <Hero accent={tweaks.accent} />}
            <MapSection accent={tweaks.accent} />
            <Featured />
            <Categories />
            <ListCta />
            <Footer />

            <TweaksPanel title={translate('tweaks.title')}>
                <TweakSection label={translate('tweaks.sections.accent')}>
                    <TweakColor
                        label={translate('tweaks.accent.color')}
                        value={tweaks.accent}
                        options={accentOptions}
                        onChange={(v) => handleTweakChange('accent', v)}
                    />
                    <TweakColor
                        label={translate('tweaks.accent.background')}
                        value={tweaks.bg}
                        options={bgOptions}
                        onChange={(v) => handleTweakChange('bg', v)}
                    />
                </TweakSection>
                <TweakSection label={translate('tweaks.sections.typography')}>
                    <TweakRadio
                        label={translate('tweaks.typography.headings')}
                        value={tweaks.fontDisplay}
                        options={['Unbounded', 'Playfair Display', 'Manrope']}
                        onChange={(v) => handleTweakChange('fontDisplay', v)}
                    />
                </TweakSection>
                <TweakSection label={translate('tweaks.sections.sections')}>
                    <TweakToggle
                        label={translate('tweaks.sections.showHero')}
                        value={tweaks.showHero}
                        onChange={(v) => handleTweakChange('showHero', v)}
                    />
                </TweakSection>
            </TweaksPanel>
        </>
    );
}
