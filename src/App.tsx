import { Route, Routes } from 'react-router-dom';
import './App.css';
import ImageGallery from './components/ImageGallery';

function App() {
    return (
        <Routes>
            <Route path="/" element={
                <>
                    <h1>Demokrata Újság Archívum</h1>
                    <ImageGallery />
                </>
            } />
            <Route path="/:year" element={
                <>
                    <h1>Demokrata Újság Archívum</h1>
                    <ImageGallery />
                </>
            } />
        </Routes>
    );
}

export default App;
