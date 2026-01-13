import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookings, setBookings] = useState([])

  useEffect(() => { setBookings(db.getBookings()) }, [])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const getBookingsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return bookings.filter(b => b.date === dateStr)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Calendar</h1>
        <p className="text-sm text-platinum mt-1">View scheduled appointments</p>
      </div>

      <div className="bg-white border border-platinum rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-platinum">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-softwhite rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-semibold text-charcoal">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-softwhite rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-platinum">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-medium text-platinum uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayBookings = getBookingsForDay(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentMonth)
            return (
              <div key={idx} className={cn("min-h-24 p-2 border-b border-r border-platinum/50", !isCurrentMonth && "bg-softwhite/50")}>
                <div className={cn("text-sm font-medium mb-1", isToday ? "text-white bg-sage w-6 h-6 rounded-full flex items-center justify-center" : isCurrentMonth ? "text-charcoal" : "text-platinum")}>
                  {format(day, 'd')}
                </div>
                {dayBookings.map(b => (
                  <div key={b.id} className="text-xs bg-sage/10 text-sage px-1.5 py-0.5 rounded mb-1 truncate" title={`${b.name} - ${b.time}`}>
                    {b.time} {b.name}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-charcoal mb-3">Upcoming Appointments</h3>
        {bookings.length === 0 ? (
          <p className="text-sm text-platinum">No appointments scheduled.</p>
        ) : (
          <div className="space-y-2">
            {bookings.filter(b => new Date(b.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5).map(b => (
              <div key={b.id} className="bg-white border border-platinum p-3 rounded flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">{b.name}</p>
                  <p className="text-xs text-platinum">{b.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-charcoal">{format(new Date(b.date), 'MMM d, yyyy')}</p>
                  <p className="text-xs text-platinum">{b.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
