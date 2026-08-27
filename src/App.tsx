import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import ImageGallery from './components/ImageGallery';

const galleryView = (
    <>
        <h1>Demokrata Újság Archívum</h1>
        <ImageGallery />
    </>
);

function App() {
    return (
        <Routes>
            {/* "/" browses every year; "/:year" narrows to one. An unknown year
                is a single segment, so it matches ":year" rather than "*" — the
                gallery redirects those itself. */}
            <Route path="/" element={galleryView} />
            <Route path="/:year" element={galleryView} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
