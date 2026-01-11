import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { db } from '@/lib/supabase'
import { cn, formatPhone } from '@/lib/utils'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function PublicForm() {
  const { slug } = useParams()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadForm = async () => {
      try {
        const formData = await db.getFormBySlug(slug)
        if (formData) {
          setForm(formData)
          // Initialize form data with empty values
          const initialData = {}
          formData.fields?.forEach(field => {
            initialData[field.id] = ''
          })
          setFormData(initialData)
        } else {
          setError('Form not found')
        }
      } catch (err) {
        setError('Error loading form')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadForm()
  }, [slug])

  const submitMutation = useMutation({
    mutationFn: (data) => db.submitForm(form.id, data),
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError('Failed to submit form. Please try again.')
  })

  const handleChange = (fieldId, value, fieldType) => {
    let processedValue = value
    if (fieldType === 'tel') {
      processedValue = formatPhone(value)
    }
    setFormData(prev => ({ ...prev, [fieldId]: processedValue }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submitMutation.mutate(formData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-charcoal animate-spin" />
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-charcoal mb-2">Form Not Found</h1>
          <p className="text-sm text-platinum">{error || 'This form does not exist or has been removed.'}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-platinum p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-sage mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-charcoal mb-2">Thank You!</h2>
          <p className="text-sm text-platinum">
            {form.settings?.successMessage || 'Your submission has been received.'}
          </p>
        </div>
      </div>
    )
  }

  const renderField = (field) => {
    const baseInputClass = "w-full px-4 py-2.5 border border-platinum text-sm focus:outline-none focus:border-charcoal"
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value, field.type)}
            required={field.required}
            rows={4}
            className={cn(baseInputClass, "resize-none")}
            placeholder={field.placeholder}
          />
        )
      
      case 'select':
        return (
          <select
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value, field.type)}
            required={field.required}
            className={baseInputClass}
          >
            <option value="">Select an option</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-3 p-3 border border-platinum cursor-pointer hover:bg-softwhite">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={formData[field.id] === opt.value}
                  onChange={(e) => handleChange(field.id, e.target.value, field.type)}
                  required={field.required}
                />
                <span className="text-sm text-charcoal">{opt.label}</span>
              </label>
            ))}
          </div>
        )
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData[field.id] === 'true'}
              onChange={(e) => handleChange(field.id, e.target.checked ? 'true' : 'false', field.type)}
              required={field.required}
            />
            <span className="text-sm text-charcoal">{field.checkboxLabel || 'Yes'}</span>
          </label>
        )
      
      default:
        return (
          <input
            type={field.type || 'text'}
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value, field.type)}
            required={field.required}
            className={baseInputClass}
            placeholder={field.placeholder}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-softwhite py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-platinum">
          {/* Header */}
          <div className="p-6 border-b border-platinum">
            <h1 className="text-xl font-semibold text-charcoal">{form.name}</h1>
            {form.description && (
              <p className="text-sm text-platinum mt-2">{form.description}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {form.fields?.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-xs text-platinum uppercase mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full py-3 bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-50 mt-6"
            >
              {submitMutation.isPending ? 'Submitting...' : (form.settings?.submitButtonText || 'Submit')}
            </button>
          </form>
        </div>

        <p className="text-xs text-platinum text-center mt-4">
          Powered by FinanceKeem
        </p>
      </div>
    </div>
  )
}
