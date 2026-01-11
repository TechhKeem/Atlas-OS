import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Database from './pages/Database'
import Calendar from './pages/Calendar'
import FormsAdmin from './pages/FormsAdmin'
import PublicQuiz from './pages/PublicQuiz'
import PublicForm from './pages/PublicForm'
import BookingPage from './pages/BookingPage'
import BookingPagesAdmin from './pages/BookingPagesAdmin'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      {/* Public routes - no layout */}
      <Route path="/quiz/:slug" element={<PublicQuiz />} />
      <Route path="/form/:slug" element={<PublicForm />} />
      <Route path="/book/:slug" element={<BookingPage />} />
      
      {/* Admin routes - with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Database />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/quizzes" element={<FormsAdmin />} />
        <Route path="/booking-pages" element={<BookingPagesAdmin />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
