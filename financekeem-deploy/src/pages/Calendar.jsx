import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: db.getBookings
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getBookingsForDay = (date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.scheduled_date), date)
    )
  }

  const selectedDayBookings = selectedDate ? getBookingsForDay(selectedDate) : []

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Calendar */}
      <div className="flex-1 p-6">
        <div className="bg-white border border-platinum h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-platinum flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-softwhite"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm text-charcoal hover:bg-softwhite"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-softwhite"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-platinum">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="px-2 py-3 text-center text-xs font-medium text-platinum uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 grid grid-cols-7">
            {days.map((day, idx) => {
              const dayBookings = getBookingsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "p-2 border-b border-r border-platinum text-left hover:bg-softwhite transition-colors min-h-[80px]",
                    !isCurrentMonth && "bg-softwhite/50",
                    isSelected && "bg-sage/10 ring-1 ring-sage",
                    isToday(day) && "bg-charcoal/5"
                  )}
                >
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 text-sm",
                    isToday(day) && "bg-charcoal text-white rounded-full",
                    !isCurrentMonth && "text-platinum"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayBookings.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayBookings.slice(0, 2).map(booking => (
                        <div
                          key={booking.id}
                          className="text-xs bg-sage/20 text-sage px-1.5 py-0.5 truncate"
                        >
                          {booking.client_name}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-platinum">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sidebar - Selected day details */}
      <div className="w-full lg:w-80 bg-white border-l border-platinum p-6">
        <h3 className="text-base font-semibold text-charcoal mb-4">
          {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
        </h3>

        {selectedDate && (
          selectedDayBookings.length === 0 ? (
            <p className="text-sm text-platinum">No appointments scheduled</p>
          ) : (
            <div className="space-y-3">
              {selectedDayBookings.map(booking => (
                <div key={booking.id} className="p-4 border border-platinum">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} className="text-platinum" />
                    <span className="text-sm font-medium text-charcoal">
                      {booking.client_name}
                    </span>
                  </div>
                  
                  {booking.scheduled_time && (
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-platinum" />
                      <span className="text-sm text-charcoal">
                        {booking.scheduled_time}
                      </span>
                    </div>
                  )}
                  
                  <span className={cn(
                    "inline-block text-xs px-2 py-1 mt-2",
                    booking.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                    booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  )}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
