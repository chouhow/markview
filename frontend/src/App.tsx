import { Routes, Route } from 'react-router'
import Tutorial from './pages/Tutorial'
import ThemePreview from './pages/ThemePreview'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Tutorial />} />
      <Route path="/:chapter" element={<Tutorial />} />
      <Route path="/themes" element={<ThemePreview />} />
    </Routes>
  )
}
