import { createClient } from '@supabase/supabase-js'

// These will be replaced with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Local storage fallback for demo/development
const STORAGE_KEY = 'financekeem_data'

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : {
    leads: [],
    quizResponses: [],
    bookings: [],
    forms: [],
    quizzes: [],
    bookingPages: [],
    formSubmissions: []
  }
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Generate URL-friendly slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substr(2, 6)
}

// Database operations with duplicate prevention
export const db = {
  // ==================== LEADS ====================
  async getLeads() {
    if (supabase) {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
    return getLocalData().leads
  },

  async findLeadByEmail(email) {
    if (!email) return null
    
    if (supabase) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    }
    
    const localData = getLocalData()
    return localData.leads.find(l => l.email?.toLowerCase().trim() === email.toLowerCase().trim())
  },

  async upsertLead(lead) {
    const email = lead.email?.toLowerCase().trim()
    
    if (!email) {
      return this.createLead(lead)
    }

    const existing = await this.findLeadByEmail(email)
    
    if (existing) {
      const updates = {
        ...lead,
        email,
        quiz_answers: lead.quiz_answers || existing.quiz_answers,
        pillar_scores: lead.pillar_scores || existing.pillar_scores,
        protection_state: lead.protection_state || existing.protection_state,
        name: lead.name || existing.name,
        phone: lead.phone || existing.phone,
        status: this.getProgressedStatus(existing.status, lead.status),
        source: existing.source,
        updated_at: new Date().toISOString()
      }
      return this.updateLead(existing.id, updates)
    }

    return this.createLead({ ...lead, email })
  },

  getProgressedStatus(currentStatus, newStatus) {
    const statusOrder = ['new', 'contacted', 'scheduled', 'completed', 'cancelled']
    const currentIndex = statusOrder.indexOf(currentStatus || 'new')
    const newIndex = statusOrder.indexOf(newStatus || 'new')
    
    if (newStatus === 'cancelled' || newIndex > currentIndex) {
      return newStatus
    }
    return currentStatus || 'new'
  },

  async createLead(lead) {
    const newLead = {
      id: crypto.randomUUID(),
      ...lead,
      email: lead.email?.toLowerCase().trim(),
      status: lead.status || 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (supabase) {
      const { data, error } = await supabase.from('leads').insert(newLead).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    localData.leads.unshift(newLead)
    saveLocalData(localData)
    return newLead
  },

  async updateLead(id, updates) {
    const updated = { 
      ...updates, 
      email: updates.email?.toLowerCase().trim(),
      updated_at: new Date().toISOString() 
    }
    
    if (supabase) {
      const { data, error } = await supabase.from('leads').update(updated).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    const index = localData.leads.findIndex(l => l.id === id)
    if (index !== -1) {
      localData.leads[index] = { ...localData.leads[index], ...updated }
      saveLocalData(localData)
      return localData.leads[index]
    }
    throw new Error('Lead not found')
  },

  async deleteLead(id) {
    if (supabase) {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
      return
    }
    
    const localData = getLocalData()
    localData.leads = localData.leads.filter(l => l.id !== id)
    saveLocalData(localData)
  },

  // ==================== FORMS ====================
  async getForms() {
    if (supabase) {
      const { data, error } = await supabase.from('forms').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
    return getLocalData().forms
  },

  async getFormById(id) {
    if (supabase) {
      const { data, error } = await supabase.from('forms').select('*').eq('id', id).single()
      if (error) throw error
      return data
    }
    const localData = getLocalData()
    return localData.forms.find(f => f.id === id)
  },

  async getFormBySlug(slug) {
    if (supabase) {
      const { data, error } = await supabase.from('forms').select('*').eq('slug', slug).single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    }
    const localData = getLocalData()
    return localData.forms.find(f => f.slug === slug)
  },

  async createForm(form) {
    const newForm = {
      id: crypto.randomUUID(),
      name: form.name || 'Untitled Form',
      slug: generateSlug(form.name || 'form'),
      description: form.description || '',
      fields: form.fields || [
        { id: 'name', type: 'text', label: 'Full Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'phone', type: 'tel', label: 'Phone', required: false }
      ],
      settings: form.settings || {
        submitButtonText: 'Submit',
        successMessage: 'Thank you for your submission!'
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (supabase) {
      const { data, error } = await supabase.from('forms').insert(newForm).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    localData.forms.unshift(newForm)
    saveLocalData(localData)
    return newForm
  },

  async updateForm(id, updates) {
    const updated = { ...updates, updated_at: new Date().toISOString() }
    
    if (supabase) {
      const { data, error } = await supabase.from('forms').update(updated).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    const index = localData.forms.findIndex(f => f.id === id)
    if (index !== -1) {
      localData.forms[index] = { ...localData.forms[index], ...updated }
      saveLocalData(localData)
      return localData.forms[index]
    }
    throw new Error('Form not found')
  },

  async deleteForm(id) {
    if (supabase) {
      const { error } = await supabase.from('forms').delete().eq('id', id)
      if (error) throw error
      return
    }
    
    const localData = getLocalData()
    localData.forms = localData.forms.filter(f => f.id !== id)
    saveLocalData(localData)
  },

  // ==================== FORM SUBMISSIONS ====================
  async submitForm(formId, submission) {
    const email = submission.email?.toLowerCase().trim()
    
    // Create submission record
    const newSubmission = {
      id: crypto.randomUUID(),
      form_id: formId,
      data: submission,
      created_at: new Date().toISOString()
    }
    
    if (supabase) {
      const { data, error } = await supabase.from('form_submissions').insert(newSubmission).select().single()
      if (error) throw error
    } else {
      const localData = getLocalData()
      localData.formSubmissions.unshift(newSubmission)
      saveLocalData(localData)
    }
    
    // Also create/update lead (prevents duplicates)
    await this.upsertLead({
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      source: `form:${formId}`,
      form_data: submission
    })
    
    return newSubmission
  },

  async getFormSubmissions(formId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
    const localData = getLocalData()
    return localData.formSubmissions.filter(s => s.form_id === formId)
  },

  // ==================== QUIZZES ====================
  async getQuizzes() {
    if (supabase) {
      const { data, error } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
    return getLocalData().quizzes
  },

  async getQuizById(id) {
    if (supabase) {
      const { data, error } = await supabase.from('quizzes').select('*').eq('id', id).single()
      if (error) throw error
      return data
    }
    const localData = getLocalData()
    return localData.quizzes.find(q => q.id === id)
  },

  async getQuizBySlug(slug) {
    if (supabase) {
      const { data, error } = await supabase.from('quizzes').select('*').eq('slug', slug).single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    }
    const localData = getLocalData()
    return localData.quizzes.find(q => q.slug === slug)
  },

  async createQuiz(quiz) {
    const newQuiz = {
      id: crypto.randomUUID(),
      name: quiz.name || 'Untitled Quiz',
      slug: generateSlug(quiz.name || 'quiz'),
      description: quiz.description || '',
      questions: quiz.questions || [],
      results: quiz.results || [],
      settings: quiz.settings || {
        collectEmail: true,
        collectPhone: false,
        showResults: true
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (supabase) {
      const { data, error } = await supabase.from('quizzes').insert(newQuiz).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    localData.quizzes.unshift(newQuiz)
    saveLocalData(localData)
    return newQuiz
  },

  async updateQuiz(id, updates) {
    const updated = { ...updates, updated_at: new Date().toISOString() }
    
    if (supabase) {
      const { data, error } = await supabase.from('quizzes').update(updated).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    const index = localData.quizzes.findIndex(q => q.id === id)
    if (index !== -1) {
      localData.quizzes[index] = { ...localData.quizzes[index], ...updated }
      saveLocalData(localData)
      return localData.quizzes[index]
    }
    throw new Error('Quiz not found')
  },

  async deleteQuiz(id) {
    if (supabase) {
      const { error } = await supabase.from('quizzes').delete().eq('id', id)
      if (error) throw error
      return
    }
    
    const localData = getLocalData()
    localData.quizzes = localData.quizzes.filter(q => q.id !== id)
    saveLocalData(localData)
  },

  // ==================== QUIZ RESPONSES ====================
  async submitQuizResponse(quizId, response) {
    const newResponse = {
      id: crypto.randomUUID(),
      quiz_id: quizId,
      answers: response.answers,
      result: response.result,
      created_at: new Date().toISOString()
    }
    
    if (supabase) {
      const { data, error } = await supabase.from('quiz_responses').insert(newResponse).select().single()
      if (error) throw error
    } else {
      const localData = getLocalData()
      localData.quizResponses.unshift(newResponse)
      saveLocalData(localData)
    }
    
    // Also create/update lead (prevents duplicates)
    if (response.email) {
      await this.upsertLead({
        name: response.name,
        email: response.email,
        phone: response.phone,
        source: `quiz:${quizId}`,
        quiz_answers: response.answers,
        protection_state: response.result?.state
      })
    }
    
    return newResponse
  },

  async getQuizResponses(quizId) {
    if (supabase) {
      let query = supabase.from('quiz_responses').select('*').order('created_at', { ascending: false })
      if (quizId) query = query.eq('quiz_id', quizId)
      const { data, error } = await query
      if (error) throw error
      return data
    }
    const localData = getLocalData()
    if (quizId) {
      return localData.quizResponses.filter(r => r.quiz_id === quizId)
    }
    return localData.quizResponses
  },

  // ==================== BOOKING PAGES ====================
  async getBookingPages() {
    if (supabase) {
      const { data, error } = await supabase.from('booking_pages').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
    return getLocalData().bookingPages
  },

  async getBookingPageById(id) {
    if (supabase) {
      const { data, error } = await supabase.from('booking_pages').select('*').eq('id', id).single()
      if (error) throw error
      return data
    }
    const localData = getLocalData()
    return localData.bookingPages.find(b => b.id === id)
  },

  async getBookingPageBySlug(slug) {
    if (supabase) {
      const { data, error } = await supabase.from('booking_pages').select('*').eq('slug', slug).single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    }
    const localData = getLocalData()
    return localData.bookingPages.find(b => b.slug === slug)
  },

  async createBookingPage(bookingPage) {
    const newBookingPage = {
      id: crypto.randomUUID(),
      name: bookingPage.name || 'Untitled Booking Page',
      slug: generateSlug(bookingPage.name || 'booking'),
      description: bookingPage.description || '',
      duration: bookingPage.duration || 30,
      availability: bookingPage.availability || {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '09:00',
        endTime: '17:00'
      },
      settings: bookingPage.settings || {
        bufferTime: 15,
        collectPhone: true,
        confirmationMessage: 'Your booking has been confirmed!'
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (supabase) {
      const { data, error } = await supabase.from('booking_pages').insert(newBookingPage).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    localData.bookingPages.unshift(newBookingPage)
    saveLocalData(localData)
    return newBookingPage
  },

  async updateBookingPage(id, updates) {
    const updated = { ...updates, updated_at: new Date().toISOString() }
    
    if (supabase) {
      const { data, error } = await supabase.from('booking_pages').update(updated).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    const index = localData.bookingPages.findIndex(b => b.id === id)
    if (index !== -1) {
      localData.bookingPages[index] = { ...localData.bookingPages[index], ...updated }
      saveLocalData(localData)
      return localData.bookingPages[index]
    }
    throw new Error('Booking page not found')
  },

  async deleteBookingPage(id) {
    if (supabase) {
      const { error } = await supabase.from('booking_pages').delete().eq('id', id)
      if (error) throw error
      return
    }
    
    const localData = getLocalData()
    localData.bookingPages = localData.bookingPages.filter(b => b.id !== id)
    saveLocalData(localData)
  },

  // ==================== BOOKINGS ====================
  async getBookings() {
    if (supabase) {
      const { data, error } = await supabase.from('bookings').select('*').order('scheduled_date', { ascending: true })
      if (error) throw error
      return data
    }
    return getLocalData().bookings
  },

  async findExistingBooking(email, date, time) {
    if (!email) return null
    
    if (supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_email', email.toLowerCase().trim())
        .eq('scheduled_date', date)
        .eq('scheduled_time', time)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    }
    
    const localData = getLocalData()
    return localData.bookings.find(b => 
      b.client_email?.toLowerCase().trim() === email.toLowerCase().trim() &&
      b.scheduled_date === date &&
      b.scheduled_time === time
    )
  },

  async createBooking(booking) {
    const email = booking.client_email?.toLowerCase().trim()
    
    // Check for duplicate booking
    if (email && booking.scheduled_date && booking.scheduled_time) {
      const existing = await this.findExistingBooking(email, booking.scheduled_date, booking.scheduled_time)
      if (existing) {
        console.log('Booking already exists for this email/date/time')
        return existing
      }
    }

    const newBooking = {
      id: crypto.randomUUID(),
      ...booking,
      client_email: email,
      status: 'scheduled',
      created_at: new Date().toISOString()
    }
    
    if (supabase) {
      const { data, error } = await supabase.from('bookings').insert(newBooking).select().single()
      if (error) throw error
    } else {
      const localData = getLocalData()
      localData.bookings.push(newBooking)
      saveLocalData(localData)
    }
    
    // Also create/update lead (prevents duplicates)
    await this.upsertLead({
      name: booking.client_name,
      email: booking.client_email,
      phone: booking.client_phone,
      status: 'scheduled',
      source: `booking:${booking.booking_page_id || 'direct'}`
    })
    
    return newBooking
  },

  async updateBooking(id, updates) {
    if (supabase) {
      const { data, error } = await supabase.from('bookings').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    
    const localData = getLocalData()
    const index = localData.bookings.findIndex(b => b.id === id)
    if (index !== -1) {
      localData.bookings[index] = { ...localData.bookings[index], ...updates }
      saveLocalData(localData)
      return localData.bookings[index]
    }
    throw new Error('Booking not found')
  },

  async deleteBooking(id) {
    if (supabase) {
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw error
      return
    }
    
    const localData = getLocalData()
    localData.bookings = localData.bookings.filter(b => b.id !== id)
    saveLocalData(localData)
  }
}
