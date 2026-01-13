import { generateId, generateSlug } from './utils'

const STORAGE_KEY = 'financekeem_data'

function getData() {
  if (typeof window === 'undefined') return { leads: [], forms: [], quizzes: [], bookingPages: [], bookings: [] }
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : { leads: [], forms: [], quizzes: [], bookingPages: [], bookings: [] }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const db = {
  // LEADS - with duplicate prevention by email
  getLeads: () => getData().leads,
  
  findLeadByEmail(email) {
    if (!email) return null
    const data = getData()
    return data.leads.find(l => l.email?.toLowerCase().trim() === email.toLowerCase().trim())
  },
  
  upsertLead(lead) {
    const data = getData()
    const email = lead.email?.toLowerCase().trim()
    
    if (email) {
      const idx = data.leads.findIndex(l => l.email?.toLowerCase().trim() === email)
      if (idx !== -1) {
        // Update existing - merge data
        data.leads[idx] = { 
          ...data.leads[idx], 
          ...lead,
          name: lead.name || data.leads[idx].name,
          phone: lead.phone || data.leads[idx].phone,
          updated_at: new Date().toISOString() 
        }
        saveData(data)
        return data.leads[idx]
      }
    }
    
    // Create new
    const newLead = { 
      id: generateId(), 
      ...lead, 
      email: email || '',
      status: lead.status || 'new', 
      created_at: new Date().toISOString() 
    }
    data.leads.unshift(newLead)
    saveData(data)
    return newLead
  },
  
  updateLead(id, updates) {
    const data = getData()
    const idx = data.leads.findIndex(l => l.id === id)
    if (idx !== -1) {
      data.leads[idx] = { ...data.leads[idx], ...updates, updated_at: new Date().toISOString() }
      saveData(data)
      return data.leads[idx]
    }
    return null
  },
  
  deleteLead(id) {
    const data = getData()
    data.leads = data.leads.filter(l => l.id !== id)
    saveData(data)
  },

  // FORMS
  getForms: () => getData().forms,
  getFormBySlug: (slug) => getData().forms.find(f => f.slug === slug),
  
  createForm(form) {
    const data = getData()
    const newForm = {
      id: generateId(),
      name: form.name || 'New Form',
      slug: generateSlug(form.name || 'form'),
      description: form.description || '',
      fields: form.fields || [
        { id: 'name', type: 'text', label: 'Full Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'phone', type: 'tel', label: 'Phone', required: false }
      ],
      status: 'active',
      created_at: new Date().toISOString()
    }
    data.forms.unshift(newForm)
    saveData(data)
    return newForm
  },
  
  updateForm(id, updates) {
    const data = getData()
    const idx = data.forms.findIndex(f => f.id === id)
    if (idx !== -1) {
      data.forms[idx] = { ...data.forms[idx], ...updates }
      saveData(data)
      return data.forms[idx]
    }
    return null
  },
  
  deleteForm(id) {
    const data = getData()
    data.forms = data.forms.filter(f => f.id !== id)
    saveData(data)
  },

  // QUIZZES
  getQuizzes: () => getData().quizzes,
  getQuizBySlug: (slug) => getData().quizzes.find(q => q.slug === slug),
  
  createQuiz(quiz) {
    const data = getData()
    const newQuiz = {
      id: generateId(),
      name: quiz.name || 'New Quiz',
      slug: generateSlug(quiz.name || 'quiz'),
      description: quiz.description || '',
      status: 'active',
      created_at: new Date().toISOString()
    }
    data.quizzes.unshift(newQuiz)
    saveData(data)
    return newQuiz
  },
  
  deleteQuiz(id) {
    const data = getData()
    data.quizzes = data.quizzes.filter(q => q.id !== id)
    saveData(data)
  },

  // BOOKING PAGES
  getBookingPages: () => getData().bookingPages,
  getBookingPageBySlug: (slug) => getData().bookingPages.find(b => b.slug === slug),
  
  createBookingPage(page) {
    const data = getData()
    const newPage = {
      id: generateId(),
      name: page.name || 'New Booking Page',
      slug: generateSlug(page.name || 'booking'),
      description: page.description || '',
      duration: page.duration || 30,
      availability: page.availability || {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '09:00',
        endTime: '17:00'
      },
      status: 'active',
      created_at: new Date().toISOString()
    }
    data.bookingPages.unshift(newPage)
    saveData(data)
    return newPage
  },
  
  updateBookingPage(id, updates) {
    const data = getData()
    const idx = data.bookingPages.findIndex(b => b.id === id)
    if (idx !== -1) {
      data.bookingPages[idx] = { ...data.bookingPages[idx], ...updates }
      saveData(data)
      return data.bookingPages[idx]
    }
    return null
  },
  
  deleteBookingPage(id) {
    const data = getData()
    data.bookingPages = data.bookingPages.filter(b => b.id !== id)
    saveData(data)
  },

  // BOOKINGS
  getBookings: () => getData().bookings,
  
  createBooking(booking) {
    const data = getData()
    const email = booking.email?.toLowerCase().trim()
    
    // Check for duplicate (same email + date + time)
    const exists = data.bookings.find(b =>
      b.email?.toLowerCase().trim() === email &&
      b.date === booking.date &&
      b.time === booking.time
    )
    if (exists) return exists
    
    const newBooking = {
      id: generateId(),
      ...booking,
      email,
      status: 'scheduled',
      created_at: new Date().toISOString()
    }
    data.bookings.push(newBooking)
    saveData(data)
    
    // Also create/update lead
    this.upsertLead({
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      status: 'scheduled',
      source: 'booking'
    })
    
    return newBooking
  },
  
  deleteBooking(id) {
    const data = getData()
    data.bookings = data.bookings.filter(b => b.id !== id)
    saveData(data)
  },

  // Clear all data
  clearAll() {
    localStorage.removeItem(STORAGE_KEY)
  }
}
