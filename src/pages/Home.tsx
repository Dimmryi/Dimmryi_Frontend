import { useDispatch } from 'react-redux';
import { Hero } from '../components/Hero';
import { MapSection } from '../components/MapSection';
import { Featured } from '../components/Featured';
import { Categories } from '../components/Categories';
import { ListCta } from '../components/ListCta';
import { Footer } from '../components/Footer';
import { useAuth } from '../services/useAuth';
import { resetFilter } from '../features/filter/filterSlice';
import { resetMapFilter } from '../features/filterMap/filterMapSlice';
import { resetNotificationProperty } from '../features/notification/notificationSlice';
import { setScrollY } from '../features/scroll/scrollSlice';
import { clearImages } from '../features/upLoadImages/upLoadImagesSlice';

const SITE_ACCENT = '#f5a623';

export function Home() {
    const dispatch = useDispatch();
    const { handleResetUserData } = useAuth();

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
            <button className="dm-dev-reset" onClick={handleDevReset} aria-label="DEV: Reset all state" title="DEV: Reset all state">
                DEV reset
            </button>
            <Hero accent={SITE_ACCENT} />
            <MapSection accent={SITE_ACCENT} />
            <Featured />
            <Categories />
            <ListCta />
            <Footer />
        </>
    );
}
