import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Ingestion from '@/pages/Ingestion'
import Archive from '@/pages/Archive'
import Review from '@/pages/Review'
import Deploy from '@/pages/Deploy'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/ingestion" replace />} />
          <Route path="ingestion" element={<Ingestion />} />
          <Route path="archive" element={<Archive />} />
          <Route path="review" element={<Review />} />
          <Route path="deploy" element={<Deploy />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}
