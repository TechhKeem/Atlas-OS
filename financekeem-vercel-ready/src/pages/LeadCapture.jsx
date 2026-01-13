import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'

export default function LeadCapture() {
  const [activeTab, setActiveTab] = useState('forms')
  const [forms, setForms] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => { reload() }, [])
  const reload = () => { setForms(db.getForms()); setQuizzes(db.getQuizzes()) }

  const copyLink = (type, slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/${type}/${slug}`)
    setCopiedId(slug)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const items = activeTab === 'forms' ? forms : quizzes

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Lead Capture</h1>
          <p className="text-sm text-platinum mt-1">Create forms and quizzes to capture leads</p>
        </div>
        <button onClick={() => { activeTab === 'forms' ? db.createForm({ name: 'New Form' }) : db.createQuiz({ name: 'New Quiz' }); reload() }} className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white text-sm rounded hover:bg-charcoal/90">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create {activeTab === 'forms' ? 'Form' : 'Quiz'}
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-platinum">
        {['forms', 'quizzes'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize", activeTab === tab ? "border-charcoal text-charcoal" : "border-transparent text-platinum hover:text-charcoal")}>
            {tab} ({tab === 'forms' ? forms.length : quizzes.length + 1})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Built-in Protection Assessment (only show in quizzes tab) */}
        {activeTab === 'quizzes' && (
          <div className="bg-white border border-platinum rounded overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-charcoal">Protection & Alignment Assessment</h3>
                <p className="text-sm text-platinum mt-1">12-question assessment for protection planning</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-sage/20 text-sage px-2 py-1 rounded">Built-in</span>
                <button onClick={() => copyLink('quiz', 'protection-assessment')} className="p-2 text-platinum hover:text-charcoal">
                  {copiedId === 'protection-assessment' ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                </button>
                <a href="/quiz/protection-assessment" target="_blank" className="p-2 text-platinum hover:text-charcoal">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
            <div className="px-4 py-3 bg-softwhite border-t border-platinum">
              <code className="text-xs text-charcoal">{window.location.origin}/quiz/protection-assessment</code>
            </div>
          </div>
        )}

        {items.length === 0 && activeTab === 'forms' && (
          <div className="bg-white border border-platinum rounded p-12 text-center">
            <p className="text-platinum mb-4">No {activeTab} yet.</p>
          </div>
        )}

        {items.map(item => (
          <div key={item.id} className="bg-white border border-platinum rounded overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-charcoal">{item.name}</h3>
                <p className="text-sm text-platinum mt-1">{item.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs px-2 py-1 rounded", item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100')}>{item.status}</span>
                <button onClick={() => copyLink(activeTab === 'forms' ? 'form' : 'quiz', item.slug)} className="p-2 text-platinum hover:text-charcoal">
                  {copiedId === item.slug ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                </button>
                <a href={`/${activeTab === 'forms' ? 'form' : 'quiz'}/${item.slug}`} target="_blank" className="p-2 text-platinum hover:text-charcoal">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
                <button onClick={() => { activeTab === 'forms' ? db.deleteForm(item.id) : db.deleteQuiz(item.id); reload() }} className="p-2 text-platinum hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            <div className="px-4 py-3 bg-softwhite border-t border-platinum">
              <code className="text-xs text-charcoal">{window.location.origin}/{activeTab === 'forms' ? 'form' : 'quiz'}/{item.slug}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
