import { useState } from 'react'
import { db } from '@/lib/db'

export default function Settings() {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/protection-assessment`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">Settings</h1>
        <p className="text-sm text-platinum mt-1">Configure your application</p>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="bg-white border border-platinum rounded-lg">
          <div className="px-6 py-4 border-b border-platinum">
            <h2 className="font-semibold text-charcoal">Public Links</h2>
            <p className="text-sm text-platinum mt-1">Share these with your prospects</p>
          </div>
          <div className="p-6">
            <label className="block text-xs text-platinum uppercase mb-2">Protection Assessment Quiz</label>
            <div className="flex gap-2">
              <input type="text" value={`${window.location.origin}/quiz/protection-assessment`} readOnly className="flex-1 px-3 py-2 bg-softwhite border border-platinum rounded text-sm" />
              <button onClick={copyLink} className="px-4 py-2 bg-charcoal text-white text-sm rounded hover:bg-charcoal/90">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-platinum rounded-lg">
          <div className="px-6 py-4 border-b border-platinum">
            <h2 className="font-semibold text-charcoal">Data Management</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-platinum mb-4">Your data is stored locally in your browser.</p>
            <button onClick={() => { if (confirm('Delete ALL data?')) { db.clearAll(); window.location.reload() } }} className="px-4 py-2 text-red-600 border border-red-200 rounded text-sm hover:bg-red-50">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
