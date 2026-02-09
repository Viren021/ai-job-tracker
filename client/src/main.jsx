import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FilterProvider } from './context/FilterContext.jsx'
import { ApplicationProvider } from './context/ApplicationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FilterProvider>
      <ApplicationProvider>
        <App />
      </ApplicationProvider>
    </FilterProvider>
  </StrictMode>,
)
