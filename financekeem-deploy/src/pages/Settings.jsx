import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'

export default function Settings() {
  const [copied, setCopied] = useState(null)
  
  const quizUrl = `${window.location.origin}/quiz/protection-assessment`
  const bookingUrl = `${window.location.origin}/book/clarity-call`

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">Settings</h1>
        <p className="text-sm text-platinum mt-1">Configure your FinanceKeem application</p>
      </div>

      {/* Public Links */}
      <div className="bg-white border border-platinum mb-6">
        <div className="px-6 py-4 border-b border-platinum">
          <h2 className="text-base font-semibold text-charcoal">Public Links</h2>
          <p className="text-sm text-platinum mt-1">Share these links with your prospects</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-platinum uppercase mb-2">Protection Assessment Quiz</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quizUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-platinum text-sm bg-softwhite"
              />
              <button
                onClick={() => copyToClipboard(quizUrl, 'quiz')}
                className="px-4 py-2 bg-charcoal text-white text-sm hover:bg-charcoal/90 flex items-center gap-2"
              >
                {copied === 'quiz' ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <a
                href={quizUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-platinum text-charcoal text-sm hover:bg-softwhite"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs text-platinum uppercase mb-2">Booking Page</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bookingUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-platinum text-sm bg-softwhite"
              />
              <button
                onClick={() => copyToClipboard(bookingUrl, 'booking')}
                className="px-4 py-2 bg-charcoal text-white text-sm hover:bg-charcoal/90 flex items-center gap-2"
              >
                {copied === 'booking' ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-platinum text-charcoal text-sm hover:bg-softwhite"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Database Connection */}
      <div className="bg-white border border-platinum mb-6">
        <div className="px-6 py-4 border-b border-platinum">
          <h2 className="text-base font-semibold text-charcoal">Database Connection</h2>
          <p className="text-sm text-platinum mt-1">Connect to Supabase for persistent data storage</p>
        </div>
        
        <div className="p-6">
          <div className="bg-softwhite border border-platinum p-4 mb-4">
            <p className="text-sm text-charcoal mb-2">
              <strong>Current Status:</strong> Using local storage (demo mode)
            </p>
            <p className="text-xs text-platinum">
              Data is stored in your browser. To persist data across devices, connect a Supabase database.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-platinum uppercase mb-2">Supabase URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal"
              />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-2">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="your-anon-key"
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal"
              />
            </div>
            <p className="text-xs text-platinum">
              To connect Supabase, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.
            </p>
          </div>
        </div>
      </div>

      {/* Brand Info */}
      <div className="bg-white border border-platinum">
        <div className="px-6 py-4 border-b border-platinum">
          <h2 className="text-base font-semibold text-charcoal">About</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-charcoal text-white flex items-center justify-center font-semibold">
              FK
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal">FinanceKeem</h3>
              <p className="text-sm text-platinum">Legacy Planner</p>
            </div>
          </div>
          <p className="text-sm text-platinum">
            Lifetime Protection with Lifetime Adjustments — A complete financial protection system 
            that aligns life insurance, estate planning documents, and beneficiary designations 
            with ongoing oversight.
          </p>
        </div>
      </div>
    </div>
  )
}
