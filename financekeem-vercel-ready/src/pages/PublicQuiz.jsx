import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '@/lib/db'
import { cn, formatPhone } from '@/lib/utils'

const QUESTIONS = [
  { id: 'p1', pillar: 'protection', q: 'Which best describes your current life insurance coverage?', opts: ['Intentionally designed around my responsibilities', 'Set up a while ago or rough estimate', 'Some coverage through work', 'No life insurance'] },
  { id: 'p2', pillar: 'protection', q: 'How confident are you that coverage would support your dependents?', opts: ['Very confident', 'Somewhat confident', 'Not very confident', 'Unsure'] },
  { id: 'p3', pillar: 'protection', q: 'How were responsibilities considered when coverage was set up?', opts: ['All accounted for', 'Some considered', 'Minimal consideration', 'Not factored in'] },
  { id: 'p4', pillar: 'protection', q: 'How intentional are your beneficiary designations?', opts: ['Fully intentional and reviewed', 'Intentional but not reviewed', 'Unsure if current', 'Not sure who is listed'] },
  { id: 'a1', pillar: 'alignment', q: 'Which describes your estate planning documents?', opts: ['Complete and current', 'Have but may be outdated', 'Started but incomplete', 'No documents'] },
  { id: 'a2', pillar: 'alignment', q: 'How clear is it who would make decisions on your behalf?', opts: ['Very clear and documented', 'Somewhat clear', 'Informally discussed', 'Not clear'] },
  { id: 'a3', pillar: 'alignment', q: 'How confident are you about guardianship decisions?', opts: ['Very confident and documented', 'Somewhat confident', 'Unsure', 'Not considered'] },
  { id: 'a4', pillar: 'alignment', q: 'Are your estate documents consistent and aligned?', opts: ['Fully aligned', 'Mostly aligned', 'Likely misaligned', 'Not sure'] },
  { id: 'o1', pillar: 'oversight', q: 'When was your protection plan last reviewed?', opts: ['Within last year', 'Within 2-3 years', 'More than 3 years', 'Never fully reviewed'] },
  { id: 'o2', pillar: 'oversight', q: 'Have major life changes occurred since last review?', opts: ['No, changes addressed', 'Yes, updates pending', 'Yes, no updates made', 'Not sure'] },
  { id: 'o3', pillar: 'oversight', q: 'Who is responsible for keeping your plan current?', opts: ['Someone helps manage it', 'I try to manage it', 'Update only when major events', 'No one responsible'] },
  { id: 'o4', pillar: 'oversight', q: 'How is your plan maintained over time?', opts: ['Regular review process', 'Occasional reviews', 'Reactive reviews', 'No review process'] },
]

export default function PublicQuiz() {
  const { slug } = useParams()
  const [step, setStep] = useState(0) // 0=intro, 1-12=questions, 13=contact, 14=result
  const [answers, setAnswers] = useState({})
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [result, setResult] = useState(null)

  if (slug !== 'protection-assessment') {
    return <div className="min-h-screen bg-softwhite flex items-center justify-center"><p className="text-charcoal">Quiz not found</p></div>
  }

  const handleAnswer = (idx) => {
    setAnswers({ ...answers, [QUESTIONS[step - 1].id]: idx })
    setStep(step + 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const score = Object.values(answers).reduce((sum, v) => sum + (3 - v), 0)
    const pct = score / (QUESTIONS.length * 3)
    let state = 'Not Yet Protected'
    if (pct >= 0.75) state = 'Well Aligned'
    else if (pct >= 0.5) state = 'In Place, Needs Review'
    else if (pct >= 0.25) state = 'Partially Built'

    db.upsertLead({ name: contact.name, email: contact.email, phone: contact.phone, source: 'quiz:protection-assessment', protection_state: state })
    setResult(state)
    setStep(14)
  }

  // Intro
  if (step === 0) {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border border-platinum rounded-lg overflow-hidden">
          <div className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-charcoal mb-4">Protection & Alignment Assessment</h1>
            <p className="text-platinum mb-6">This 12-question assessment will help you understand whether your financial protection is coordinated and being maintained.</p>
            <p className="text-sm text-platinum mb-8">Takes about 3-5 minutes.</p>
            <button onClick={() => setStep(1)} className="px-8 py-3 bg-charcoal text-white font-medium rounded hover:bg-charcoal/90">Start Assessment</button>
          </div>
          <div className="px-8 py-4 bg-softwhite border-t border-platinum text-center">
            <p className="text-xs text-platinum">Powered by FinanceKeem</p>
          </div>
        </div>
      </div>
    )
  }

  // Result
  if (step === 14 && result) {
    const stateColors = { 'Well Aligned': 'bg-green-100 text-green-800', 'In Place, Needs Review': 'bg-yellow-100 text-yellow-800', 'Partially Built': 'bg-orange-100 text-orange-800', 'Not Yet Protected': 'bg-red-100 text-red-800' }
    return (
      <div className="min-h-screen bg-softwhite py-12 px-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border border-platinum rounded-lg p-8 text-center">
            <div className="text-sage text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-charcoal mb-4">Assessment Complete</h2>
            <div className={cn("inline-block px-6 py-3 rounded-lg mb-6", stateColors[result])}>
              <p className="text-lg font-semibold">{result}</p>
            </div>
            <p className="text-platinum mb-6">The next step is understanding what should be reviewed, aligned, or put in place.</p>
            <a href="/book/clarity-call" className="inline-block px-6 py-3 bg-sage text-white font-medium rounded hover:bg-sage/90">Schedule a Clarity Conversation</a>
          </div>
        </div>
      </div>
    )
  }

  // Contact form
  if (step === 13) {
    return (
      <div className="min-h-screen bg-softwhite py-12 px-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border border-platinum rounded-lg overflow-hidden">
            <div className="h-1 bg-sage"></div>
            <form onSubmit={handleSubmit} className="p-8">
              <h2 className="text-xl font-semibold text-charcoal mb-2">Almost Done!</h2>
              <p className="text-platinum mb-6">Enter your info to see your results.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-platinum uppercase mb-1.5">Name *</label>
                  <input type="text" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required className="w-full px-4 py-3 border border-platinum rounded" />
                </div>
                <div>
                  <label className="block text-xs text-platinum uppercase mb-1.5">Email *</label>
                  <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required className="w-full px-4 py-3 border border-platinum rounded" />
                </div>
                <div>
                  <label className="block text-xs text-platinum uppercase mb-1.5">Phone</label>
                  <input type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: formatPhone(e.target.value) })} className="w-full px-4 py-3 border border-platinum rounded" />
                </div>
              </div>
              <button type="submit" className="w-full mt-6 py-3 bg-charcoal text-white font-medium rounded hover:bg-charcoal/90">See My Results</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Question
  const q = QUESTIONS[step - 1]
  const progress = (step / QUESTIONS.length) * 100

  return (
    <div className="min-h-screen bg-softwhite py-12 px-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-white border border-platinum rounded-lg overflow-hidden">
          <div className="h-1 bg-platinum/30"><div className="h-full bg-sage transition-all" style={{ width: `${progress}%` }}></div></div>
          <div className="p-8">
            <p className="text-xs text-platinum uppercase mb-4">Question {step} of {QUESTIONS.length}</p>
            <h2 className="text-lg font-semibold text-charcoal mb-6">{q.q}</h2>
            <div className="space-y-3">
              {q.opts.map((opt, idx) => (
                <button key={idx} onClick={() => handleAnswer(idx)} className="w-full text-left px-4 py-4 border border-platinum rounded hover:border-charcoal transition-colors">
                  <span className="text-sm text-charcoal">{opt}</span>
                </button>
              ))}
            </div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="mt-6 text-sm text-platinum hover:text-charcoal">← Back</button>
            )}
          </div>
        </div>
        <p className="text-xs text-platinum text-center mt-4">Powered by FinanceKeem</p>
      </div>
    </div>
  )
}
