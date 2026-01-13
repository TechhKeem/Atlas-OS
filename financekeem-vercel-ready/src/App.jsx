import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Database from './pages/Database'
import Calendar from './pages/Calendar'
import LeadCapture from './pages/LeadCapture'
import BookingPages from './pages/BookingPages'
import Settings from './pages/Settings'
import PublicQuiz from './pages/PublicQuiz'
import PublicForm from './pages/PublicForm'
import PublicBooking from './pages/PublicBooking'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/quiz/:slug" element={<PublicQuiz />} />
      <Route path="/form/:slug" element={<PublicForm />} />
      <Route path="/book/:slug" element={<PublicBooking />} />
      
      {/* Admin routes with sidebar */}
      <Route element={<Layout />}>
        <Route path="/" element={<Database />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/lead-capture" element={<LeadCapture />} />
        <Route path="/booking-pages" element={<BookingPages />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
