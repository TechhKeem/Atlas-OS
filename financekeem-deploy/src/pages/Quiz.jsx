import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, ExternalLink, Check } from 'lucide-react'

export default function Quiz() {
  const [copied, setCopied] = useState(false)
  
  // The quiz ID - in production this would come from database
  const quizUrl = `${window.location.origin}/quiz/protection-assessment`

  const copyLink = () => {
    navigator.clipboard.writeText(quizUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">Protection & Alignment Assessment</h1>
        <p className="text-sm text-platinum mt-1">Your lead capture quiz based on the 3 pillars framework</p>
      </div>

      {/* Quiz Card */}
      <div className="bg-white border border-platinum max-w-2xl">
        <div className="p-6 border-b border-platinum">
          <h2 className="text-lg font-semibold text-charcoal mb-2">
            Protection & Alignment Assessment
          </h2>
          <p className="text-sm text-platinum">
            A 12-question diagnostic that evaluates Protection, Alignment, and Oversight 
            to determine a prospect's current protection state.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Quiz Link */}
          <div>
            <label className="text-xs text-platinum uppercase block mb-2">Quiz Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quizUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-platinum text-sm bg-softwhite"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-charcoal text-white text-sm hover:bg-charcoal/90 flex items-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Preview Link */}
          <Link
            to="/quiz/protection-assessment"
            target="_blank"
            className="inline-flex items-center gap-2 text-sm text-sage hover:underline"
          >
            <ExternalLink size={16} />
            Preview Quiz
          </Link>
        </div>

        {/* Quiz Structure Info */}
        <div className="p-6 bg-softwhite border-t border-platinum">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Assessment Structure</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-sage text-white flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="text-sm font-medium text-charcoal">Protection (4 questions)</p>
                <p className="text-xs text-platinum">Life insurance coverage, dependents, beneficiaries</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-sage text-white flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="text-sm font-medium text-charcoal">Alignment (4 questions)</p>
                <p className="text-xs text-platinum">Estate documents, decision-makers, coordination</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-sage text-white flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="text-sm font-medium text-charcoal">Oversight (4 questions)</p>
                <p className="text-xs text-platinum">Review frequency, life changes, responsibility</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-platinum">
            <h4 className="text-xs text-platinum uppercase mb-2">Result States</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500"></span>
                <span className="text-xs text-charcoal">Well Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500"></span>
                <span className="text-xs text-charcoal">In Place, Needs Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500"></span>
                <span className="text-xs text-charcoal">Partially Built</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500"></span>
                <span className="text-xs text-charcoal">Not Yet Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
