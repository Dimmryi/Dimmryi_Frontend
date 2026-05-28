import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Nav } from './components/Nav';
import { Home } from './pages/Home';
import { useLanguage } from './LanguageProvider';
import './styles/globals.css';

function App() {
    const { translate } = useLanguage();

    return (
        <BrowserRouter>
            <div className="dm-root" data-screen-label={translate('app.screenLabel')}>
                <Nav />
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
