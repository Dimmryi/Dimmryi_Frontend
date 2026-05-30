import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Nav } from './components/Nav';
import { Home } from './pages/Home';
import { useLanguage } from './LanguageProvider';
import Registration from './components/Registration';
import Login from './components/Login';
import Listings from './pages/Listings';
import AccountPlaceholder from './pages/AccountPlaceholder';
import Services from './pages/Services';
import Agreement from './pages/Agreement';
import RealEstateEstimator from './pages/RealEstateEstimator';
import Notification from './pages/Notification';
import MyNotification from './components/MyNotification';
import Details from './pages/Details';
import './styles/globals.css';

function App() {
    const { translate } = useLanguage();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <BrowserRouter>
                <div className="dm-root" data-screen-label={translate('app.screenLabel')}>
                    <Nav />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="registration" element={<Registration />} />
                        <Route path="login" element={<Login />} />
                        <Route path="listings" element={<Listings />} />
                        <Route path="details/:listingId" element={<Details />} />
                        <Route path="listings/new/:listingType" element={<AccountPlaceholder title="Розміщення оголошення" />} />
                        <Route path="services" element={<Services />} />
                        <Route path="agreement" element={<Agreement />} />
                        <Route path="real-estate-estimator" element={<RealEstateEstimator />} />
                        <Route path="advertising" element={<AccountPlaceholder title="Рекламне відео" />} />
                        <Route path="notification" element={<Notification />} />
                        <Route path="notification/edit/:notificationId" element={<Notification />} />
                        <Route path="agents" element={<AccountPlaceholder title="Ріелтори" />} />
                        <Route path="about" element={<AccountPlaceholder title="Про нас" />} />
                        <Route path="promotion-your-listing" element={<AccountPlaceholder title="Просування оголошення" />} />
                        <Route path="subscription" element={<AccountPlaceholder title="Тарифи та підписки" />} />
                        <Route path="my-listings" element={<AccountPlaceholder title="Мої оголошення" />} />
                        <Route path="my-comments" element={<AccountPlaceholder title="Мої коментарі" />} />
                        <Route path="my-notifications" element={<MyNotification />} />
                        <Route path="myNotification" element={<MyNotification />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
}

export default App;
