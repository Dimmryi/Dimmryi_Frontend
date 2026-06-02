import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Nav } from './components/Nav';
import { FavoritesBootstrap } from './components/FavoritesBootstrap';
import { useLanguage } from './LanguageProvider';
import './styles/globals.css';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Registration = lazy(() => import('./components/Registration'));
const Login = lazy(() => import('./components/Login'));
const Listings = lazy(() => import('./pages/Listings'));
const ListingForm = lazy(() => import('./pages/ListingForm'));
const Details = lazy(() => import('./pages/Details'));
const Favorites = lazy(() => import('./pages/Favorites'));
const AccountPlaceholder = lazy(() => import('./pages/AccountPlaceholder'));
const Services = lazy(() => import('./pages/Services'));
const Agreement = lazy(() => import('./pages/Agreement'));
const RealEstateEstimator = lazy(() => import('./pages/RealEstateEstimator'));
const Notification = lazy(() => import('./pages/Notification'));
const MyNotification = lazy(() => import('./components/MyNotification'));
const MyComments = lazy(() => import('./components/MyComments'));
const MyListings = lazy(() => import('./components/MyListings'));

const RouteFallback = () => (
    <main className="dm-route-fallback" aria-live="polite" aria-busy="true">
        <span />
    </main>
);

function App() {
    const { translate } = useLanguage();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <BrowserRouter>
                <div className="dm-root" data-screen-label={translate('app.screenLabel')}>
                    <Nav />
                    <FavoritesBootstrap />
                    <Suspense fallback={<RouteFallback />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="registration" element={<Registration />} />
                            <Route path="login" element={<Login />} />
                            <Route path="listings" element={<Listings />} />
                            <Route path="details/:listingId" element={<Details />} />
                            <Route path="favorites" element={<Favorites />} />
                            <Route path="listings/new" element={<ListingForm />} />
                            <Route path="listings/edit/:listingId" element={<ListingForm />} />
                            <Route path="services" element={<Services />} />
                            <Route path="agreement" element={<Agreement />} />
                            <Route path="real-estate-estimator" element={<RealEstateEstimator />} />
                            <Route path="advertising" element={<AccountPlaceholder title="Рекламне відео" />} />
                            <Route path="notification" element={<Notification />} />
                            <Route path="notification/edit/:notificationId" element={<Notification />} />
                            <Route path="agents" element={<AccountPlaceholder title="Рієлтори" />} />
                            <Route path="about" element={<AccountPlaceholder title="Про нас" />} />
                            <Route path="promotion-your-listing" element={<AccountPlaceholder title="Просування оголошення" />} />
                            <Route path="subscription" element={<AccountPlaceholder title="Тарифи та підписки" />} />
                            <Route path="my-listings" element={<MyListings />} />
                            <Route path="my-comments" element={<MyComments />} />
                            <Route path="my-notifications" element={<MyNotification />} />
                            <Route path="myNotification" element={<MyNotification />} />
                        </Routes>
                    </Suspense>
                </div>
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
}

export default App;
