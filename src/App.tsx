import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nProvider'
import { ModelsPage } from './pages/ModelsPage'
import { ComparePage } from './pages/ComparePage'
import { HomePage } from './pages/HomePage'
import { McpPage } from './pages/McpPage'
import { ModelPage } from './pages/ModelPage'
import { NewsPage } from './pages/NewsPage'
import { SkillsPage } from './pages/SkillsPage'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/mcp" element={<McpPage />} />
          <Route path="/pulse" element={<Navigate to="/news" replace />} />
          <Route path="/model/:slug" element={<ModelPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
