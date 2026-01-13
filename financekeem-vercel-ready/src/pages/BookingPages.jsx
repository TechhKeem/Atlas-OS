import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'

export default function BookingPages() {
  const [pages, setPages] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => { reload() }, [])
  const reload = () => setPages(db.getBookingPages())

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`)
    setCopiedId(slug)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Booking Pages</h1>
          <p className="text-sm text-platinum mt-1">Create booking pages for scheduling</p>
        </div>
        <button onClick={() => { db.createBookingPage({ name: 'Protection Clarity Conversation', description: '30-minute call to review your assessment' }); reload() }} className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white text-sm rounded hover:bg-charcoal/90">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Booking Page
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="bg-white border border-platinum rounded p-12 text-center">
          <p className="text-platinum mb-4">No booking pages yet.</p>
          <button onClick={() => { db.createBookingPage({ name: 'Protection Clarity Conversation' }); reload() }} className="px-4 py-2 bg-charcoal text-white text-sm rounded">Create Booking Page</button>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map(page => (
            <div key={page.id} className="bg-white border border-platinum rounded overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-charcoal">{page.name}</h3>
                  <p className="text-sm text-platinum mt-1">{page.duration} minutes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2 py-1 rounded", page.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100')}>{page.status}</span>
                  <button onClick={() => copyLink(page.slug)} className="p-2 text-platinum hover:text-charcoal">
                    {copiedId === page.slug ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                  </button>
                  <a href={`/book/${page.slug}`} target="_blank" className="p-2 text-platinum hover:text-charcoal">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <button onClick={() => { db.deleteBookingPage(page.id); reload() }} className="p-2 text-platinum hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 bg-softwhite border-t border-platinum">
                <code className="text-xs text-charcoal">{window.location.origin}/book/{page.slug}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
