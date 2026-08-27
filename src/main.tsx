import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Real paths rather than hashes, so each year is a distinct, shareable,
        indexable URL. BASE_URL carries the GitHub Pages subpath in production
        and "/" anywhere else. Direct hits on a deep path are served by the
        404.html fallback that the build emits (see vite.config.ts). */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
