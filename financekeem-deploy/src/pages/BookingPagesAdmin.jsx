import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  Edit2,
  X,
  Clock,
  Calendar
} from 'lucide-react'

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

export default function BookingPagesAdmin() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  
  const queryClient = useQueryClient()

  const { data: bookingPages = [] } = useQuery({
    queryKey: ['bookingPages'],
    queryFn: db.getBookingPages
  })

  const createMutation = useMutation({
    mutationFn: db.createBookingPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingPages'] })
      setIsCreating(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => db.updateBookingPage(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingPages'] })
      setEditingItem(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: db.deleteBookingPage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookingPages'] })
  })

  const copyLink = (slug) => {
    const url = `${window.location.origin}/book/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(slug)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreate = () => {
    createMutation.mutate({
      name: 'Protection Clarity Conversation',
      description: '30-minute call to review your assessment and discuss next steps',
      duration: 30,
      availability: {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '09:00',
        endTime: '17:00'
      },
      settings: {
        bufferTime: 15,
        collectPhone: true,
        confirmationMessage: 'Your booking has been confirmed!'
      }
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Booking Pages</h1>
          <p className="text-sm text-platinum mt-1">Create booking pages for client scheduling</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white text-sm hover:bg-charcoal/90"
        >
          <Plus size={16} />
          Create Booking Page
        </button>
      </div>

      {/* Booking Pages List */}
      {bookingPages.length === 0 ? (
        <div className="bg-white border border-platinum p-12 text-center">
          <div className="w-12 h-12 bg-softwhite rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-platinum" />
          </div>
          <h3 className="text-base font-medium text-charcoal mb-2">
            No booking pages yet
          </h3>
          <p className="text-sm text-platinum mb-4">
            Create your first booking page to let clients schedule calls with you
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal text-white text-sm"
          >
            <Plus size={16} />
            Create Booking Page
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingPages.map((page) => (
            <div key={page.id} className="bg-white border border-platinum">
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium text-charcoal">{page.name}</h3>
                  <p className="text-sm text-platinum mt-1">{page.description}</p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-platinum">
                      <Clock size={12} />
                      {page.duration} minutes
                    </span>
                    <span className="text-xs text-platinum">
                      {page.availability?.days?.length || 0} days/week
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Status badge */}
                  <span className={cn(
                    "text-xs px-2 py-1",
                    page.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  )}>
                    {page.status}
                  </span>
                  
                  {/* Copy link */}
                  <button
                    onClick={() => copyLink(page.slug)}
                    className="p-2 text-platinum hover:text-charcoal hover:bg-softwhite"
                    title="Copy link"
                  >
                    {copiedId === page.slug ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  
                  {/* Preview */}
                  <a
                    href={`/book/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-platinum hover:text-charcoal hover:bg-softwhite"
                    title="Preview"
                  >
                    <ExternalLink size={16} />
                  </a>
                  
                  {/* Edit */}
                  <button
                    onClick={() => setEditingItem(page)}
                    className="p-2 text-platinum hover:text-charcoal hover:bg-softwhite"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  
                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm('Delete this booking page?')) {
                        deleteMutation.mutate(page.id)
                      }
                    }}
                    className="p-2 text-platinum hover:text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {/* Link preview */}
              <div className="px-4 py-3 bg-softwhite border-t border-platinum">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-platinum">Link:</span>
                  <code className="text-xs text-charcoal bg-white px-2 py-1 border border-platinum flex-1 truncate">
                    {window.location.origin}/book/{page.slug}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <BookingPageEditor
          item={editingItem}
          onSave={(updates) => updateMutation.mutate({ id: editingItem.id, updates })}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}

// Booking Page Editor Modal
function BookingPageEditor({ item, onSave, onClose }) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description)
  const [duration, setDuration] = useState(item.duration)
  const [availability, setAvailability] = useState(item.availability || {
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:00',
    endTime: '17:00'
  })
  const [settings, setSettings] = useState(item.settings || {
    bufferTime: 15,
    collectPhone: true
  })

  const toggleDay = (day) => {
    const days = availability.days || []
    if (days.includes(day)) {
      setAvailability({ ...availability, days: days.filter(d => d !== day) })
    } else {
      setAvailability({ ...availability, days: [...days, day] })
    }
  }

  const handleSave = () => {
    onSave({ name, description, duration, availability, settings })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-platinum flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal">Edit Booking Page</h2>
          <button onClick={onClose} className="text-platinum hover:text-charcoal">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal"
              />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Duration (minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs text-platinum uppercase mb-3">Available Days</label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs border transition-colors",
                    availability.days?.includes(day.value)
                      ? "bg-charcoal text-white border-charcoal"
                      : "bg-white text-charcoal border-platinum hover:border-charcoal"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Start Time</label>
              <input
                type="time"
                value={availability.startTime}
                onChange={(e) => setAvailability({ ...availability, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal"
              />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">End Time</label>
              <input
                type="time"
                value={availability.endTime}
                onChange={(e) => setAvailability({ ...availability, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal"
              />
            </div>
          </div>

          {/* Settings */}
          <div>
            <label className="block text-xs text-platinum uppercase mb-3">Settings</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-platinum mb-1.5">Buffer Time (minutes)</label>
                <select
                  value={settings.bufferTime}
                  onChange={(e) => setSettings({ ...settings, bufferTime: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-platinum text-sm"
                >
                  <option value={0}>No buffer</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={settings.collectPhone}
                  onChange={(e) => setSettings({ ...settings, collectPhone: e.target.checked })}
                />
                Require phone number
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-platinum flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-charcoal hover:bg-softwhite"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-charcoal text-white hover:bg-charcoal/90"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
