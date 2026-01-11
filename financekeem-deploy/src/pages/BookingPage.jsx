import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { db } from '@/lib/supabase'
import { cn, formatPhone } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  isSameDay,
  isBefore
} from 'date-fns'

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
]

export default function BookingPage() {
  const { slug } = useParams()
  const [step, setStep] = useState('calendar')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [isBooked, setIsBooked] = useState(false)

  const createBookingMutation = useMutation({
    mutationFn: (data) => db.createBooking(data),
    onSuccess: () => setIsBooked(true)
  })

  const today = new Date()
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i))

  const handleSubmit = (e) => {
    e.preventDefault()
    
    createBookingMutation.mutate({
      client_name: contactInfo.name,
      client_email: contactInfo.email,
      client_phone: contactInfo.phone,
      notes: contactInfo.notes,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: selectedTime,
      booking_type: 'clarity_call'
    })

    // Create or update lead (prevents duplicates)
    db.upsertLead({
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      status: 'scheduled',
      source: 'booking_page'
    })
  }

  if (isBooked) {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-platinum p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-sage mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-charcoal mb-2">You're Booked!</h2>
          <p className="text-sm text-platinum mb-6">Your Protection Clarity Conversation has been scheduled.</p>
          <div className="bg-softwhite p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <Calendar size={18} className="text-sage" />
              <span className="text-sm text-charcoal">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-sage" />
              <span className="text-sm text-charcoal">{selectedTime}</span>
            </div>
          </div>
          <p className="text-xs text-platinum">A confirmation email has been sent to {contactInfo.email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-softwhite">
      <div className="bg-white border-b border-platinum">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-xl font-semibold text-charcoal">Protection Clarity Conversation</h1>
          <p className="text-sm text-platinum mt-1">30-minute call to review your assessment and discuss next steps</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-platinum">
            <div className="px-6 py-4 border-b border-platinum">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep('calendar')} className={cn("flex items-center gap-2 text-sm", step === 'calendar' ? "text-charcoal font-medium" : "text-platinum")}>
                  <Calendar size={16} /> Date
                </button>
                <ChevronRight size={16} className="text-platinum" />
                <button onClick={() => selectedDate && setStep('time')} className={cn("flex items-center gap-2 text-sm", step === 'time' ? "text-charcoal font-medium" : "text-platinum")}>
                  <Clock size={16} /> Time
                </button>
                <ChevronRight size={16} className="text-platinum" />
                <span className={cn("flex items-center gap-2 text-sm", step === 'contact' ? "text-charcoal font-medium" : "text-platinum")}>
                  <User size={16} /> Details
                </span>
              </div>
            </div>

            {step === 'calendar' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0} className={cn("p-2", weekOffset === 0 ? "text-platinum" : "text-charcoal hover:bg-softwhite")}>
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-medium text-charcoal">{format(weekDays[0], 'MMM d')} - {format(weekDays[4], 'MMM d, yyyy')}</span>
                  <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 text-charcoal hover:bg-softwhite">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {weekDays.map((day) => {
                    const isPast = isBefore(day, today) && !isSameDay(day, today)
                    return (
                      <button key={day.toISOString()} onClick={() => !isPast && (setSelectedDate(day), setStep('time'))} disabled={isPast} className={cn("p-4 border text-center transition-colors", isPast ? "border-platinum/50 text-platinum cursor-not-allowed" : "border-platinum hover:border-charcoal")}>
                        <div className="text-xs text-platinum mb-1">{format(day, 'EEE')}</div>
                        <div className={cn("text-lg font-medium", isPast ? "text-platinum" : "text-charcoal")}>{format(day, 'd')}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 'time' && selectedDate && (
              <div className="p-6">
                <button onClick={() => setStep('calendar')} className="flex items-center gap-2 text-sm text-platinum hover:text-charcoal mb-4">
                  <ChevronLeft size={16} /> Back
                </button>
                <h3 className="text-sm font-medium text-charcoal mb-4">Available times for {format(selectedDate, 'EEEE, MMMM d')}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <button key={time} onClick={() => (setSelectedTime(time), setStep('contact'))} className="px-3 py-2 border border-platinum text-sm text-charcoal hover:border-charcoal transition-colors">
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'contact' && (
              <form onSubmit={handleSubmit} className="p-6">
                <button type="button" onClick={() => setStep('time')} className="flex items-center gap-2 text-sm text-platinum hover:text-charcoal mb-4">
                  <ChevronLeft size={16} /> Back
                </button>
                <h3 className="text-sm font-medium text-charcoal mb-4">Your Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-platinum uppercase mb-1.5">Full Name *</label>
                    <input type="text" required value={contactInfo.name} onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} className="w-full px-4 py-2.5 border border-platinum text-sm focus:outline-none focus:border-charcoal" />
                  </div>
                  <div>
                    <label className="block text-xs text-platinum uppercase mb-1.5">Email *</label>
                    <input type="email" required value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} className="w-full px-4 py-2.5 border border-platinum text-sm focus:outline-none focus:border-charcoal" />
                  </div>
                  <div>
                    <label className="block text-xs text-platinum uppercase mb-1.5">Phone</label>
                    <input type="tel" value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: formatPhone(e.target.value) })} className="w-full px-4 py-2.5 border border-platinum text-sm focus:outline-none focus:border-charcoal" placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-xs text-platinum uppercase mb-1.5">Notes (optional)</label>
                    <textarea value={contactInfo.notes} onChange={(e) => setContactInfo({ ...contactInfo, notes: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-platinum text-sm focus:outline-none focus:border-charcoal resize-none" placeholder="Anything you'd like us to know before the call?" />
                  </div>
                  <button type="submit" disabled={createBookingMutation.isPending} className="w-full py-3 bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90 transition-colors">
                    {createBookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-white border border-platinum p-6 h-fit">
            <h3 className="text-base font-semibold text-charcoal mb-4">Booking Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-platinum" />
                <span className="text-charcoal">{selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-platinum" />
                <span className="text-charcoal">{selectedTime || 'Select a time'}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-platinum">
              <p className="text-xs text-platinum">Duration: 30 minutes</p>
              <p className="text-xs text-platinum mt-1">Video call link will be sent via email</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
