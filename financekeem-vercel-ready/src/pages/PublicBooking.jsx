import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '@/lib/db'
import { formatPhone } from '@/lib/utils'

export default function PublicBooking() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', time: '09:00' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let p = db.getBookingPageBySlug(slug)
    if (!p) {
      p = { name: 'Protection Clarity Conversation', description: '30-minute call to review your assessment and discuss next steps.', duration: 30 }
    }
    setPage(p)
  }, [slug])

  const handleSubmit = (e) => {
    e.preventDefault()
    db.createBooking({ name: formData.name, email: formData.email, phone: formData.phone, date: formData.date, time: formData.time, bookingPageSlug: slug })
    setSubmitted(true)
  }

  if (!page) return null

  if (submitted) {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-platinum rounded-lg p-8 text-center">
          <div className="text-sage text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-charcoal mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-platinum">We'll see you on {formData.date} at {formData.time}.</p>
        </div>
      </div>
    )
  }

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']

  return (
    <div className="min-h-screen bg-softwhite py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-platinum rounded-lg overflow-hidden">
          <div className="p-6 border-b border-platinum">
            <h1 className="text-xl font-semibold text-charcoal">{page.name}</h1>
            {page.description && <p className="text-sm text-platinum mt-2">{page.description}</p>}
            <p className="text-sm text-platinum mt-1">{page.duration} minutes</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2.5 border border-platinum rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-2.5 border border-platinum rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} className="w-full px-4 py-2.5 border border-platinum rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Preferred Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 border border-platinum rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Preferred Time *</label>
              <select value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-2.5 border border-platinum rounded text-sm">
                {timeSlots.map(t => {
                  const [h, m] = t.split(':')
                  const hour = parseInt(h)
                  const label = `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
                  return <option key={t} value={t}>{label}</option>
                })}
              </select>
            </div>
            <button type="submit" className="w-full py-3 bg-charcoal text-white rounded font-medium hover:bg-charcoal/90 mt-4">Book Appointment</button>
          </form>
        </div>
        <p className="text-xs text-platinum text-center mt-4">Powered by FinanceKeem</p>
      </div>
    </div>
  )
}
