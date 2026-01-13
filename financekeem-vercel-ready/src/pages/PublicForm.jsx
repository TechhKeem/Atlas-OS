import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '@/lib/db'
import { formatPhone } from '@/lib/utils'

export default function PublicForm() {
  const { slug } = useParams()
  const [form, setForm] = useState(null)
  const [formData, setFormData] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const f = db.getFormBySlug(slug)
    if (f) {
      setForm(f)
      const initial = {}
      f.fields?.forEach(field => { initial[field.id] = '' })
      setFormData(initial)
    }
  }, [slug])

  const handleSubmit = (e) => {
    e.preventDefault()
    db.upsertLead({ name: formData.name, email: formData.email, phone: formData.phone, source: `form:${slug}` })
    setSubmitted(true)
  }

  if (!form) {
    return <div className="min-h-screen bg-softwhite flex items-center justify-center"><p className="text-charcoal">Form not found</p></div>
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-platinum rounded-lg p-8 text-center">
          <div className="text-sage text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-charcoal mb-2">Thank You!</h2>
          <p className="text-sm text-platinum">Your submission has been received.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-softwhite py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-platinum rounded-lg overflow-hidden">
          <div className="p-6 border-b border-platinum">
            <h1 className="text-xl font-semibold text-charcoal">{form.name}</h1>
            {form.description && <p className="text-sm text-platinum mt-2">{form.description}</p>}
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {form.fields?.map(field => (
              <div key={field.id}>
                <label className="block text-xs text-platinum uppercase mb-1.5">
                  {field.label}{field.required && ' *'}
                </label>
                <input
                  type={field.type || 'text'}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.id]: field.type === 'tel' ? formatPhone(e.target.value) : e.target.value })}
                  required={field.required}
                  className="w-full px-4 py-2.5 border border-platinum rounded text-sm"
                />
              </div>
            ))}
            <button type="submit" className="w-full py-3 bg-charcoal text-white rounded font-medium hover:bg-charcoal/90 mt-4">Submit</button>
          </form>
        </div>
        <p className="text-xs text-platinum text-center mt-4">Powered by FinanceKeem</p>
      </div>
    </div>
  )
}
