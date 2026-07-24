import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ContentRegistryProvider } from './content/ContentRegistryContext'
import './styles.css'
import './builder.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContentRegistryProvider>
      <App />
    </ContentRegistryProvider>
  </StrictMode>,
)
