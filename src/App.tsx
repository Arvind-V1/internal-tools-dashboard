import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import ToolsPage from './pages/ToolsPage'
import AnalyticsPage from './pages/AnalyticsPage'


export default function App() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}