import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { db } from '@/lib/supabase'
import { cn, formatPhone } from '@/lib/utils'
import { ChevronRight, ChevronLeft, CheckCircle2, Calendar } from 'lucide-react'

// Quiz Questions based on the Protection & Alignment Assessment framework
const QUIZ_QUESTIONS = [
  // PROTECTION QUESTIONS (1-4)
  {
    id: 'p1',
    pillar: 'protection',
    question: 'Which best describes your current life insurance coverage?',
    options: [
      { value: 'intentional', label: 'I have coverage that was intentionally designed around my responsibilities', score: 3 },
      { value: 'rough', label: 'I have coverage, but it was set up a while ago or based on a rough estimate', score: 2 },
      { value: 'work', label: 'I have some coverage through work or older policies', score: 1 },
      { value: 'none', label: "I don't currently have life insurance", score: 0 },
    ]
  },
  {
    id: 'p2',
    pillar: 'protection',
    question: 'If something happened to you, how confident are you that your coverage would support your dependents long-term?',
    options: [
      { value: 'very', label: 'Very confident — it was sized with dependents and obligations in mind', score: 3 },
      { value: 'somewhat', label: "Somewhat confident, but I haven't revisited it recently", score: 2 },
      { value: 'not_very', label: "Not very confident — I'm not sure how it was calculated", score: 1 },
      { value: 'unsure', label: "I'm unsure or it wouldn't be sufficient", score: 0 },
    ]
  },
  {
    id: 'p3',
    pillar: 'protection',
    question: 'Which best reflects how your responsibilities were considered when coverage was set up?',
    options: [
      { value: 'all', label: 'Dependents, housing, and major obligations were clearly accounted for', score: 3 },
      { value: 'some', label: 'Some responsibilities were considered, but not all', score: 2 },
      { value: 'minimal', label: 'Coverage was chosen without fully mapping responsibilities', score: 1 },
      { value: 'none', label: 'Responsibilities were not factored in', score: 0 },
    ]
  },
  {
    id: 'p4',
    pillar: 'protection',
    question: 'How intentional are your beneficiary designations on life insurance and key accounts?',
    options: [
      { value: 'reviewed', label: 'Fully intentional and recently reviewed', score: 3 },
      { value: 'old', label: 'Intentional at the time, but not reviewed since', score: 2 },
      { value: 'unsure', label: "Set up, but I'm unsure if they still reflect my wishes", score: 1 },
      { value: 'unknown', label: "I'm not sure who is listed", score: 0 },
    ]
  },
  // ALIGNMENT QUESTIONS (5-8)
  {
    id: 'a1',
    pillar: 'alignment',
    question: 'Which best describes your estate planning documents?',
    options: [
      { value: 'current', label: 'I have completed documents that reflect my current situation', score: 3 },
      { value: 'outdated', label: 'I have documents, but they may be outdated', score: 2 },
      { value: 'started', label: "I started the process but didn't complete it", score: 1 },
      { value: 'none', label: "I don't have estate planning documents", score: 0 },
    ]
  },
  {
    id: 'a2',
    pillar: 'alignment',
    question: 'If decisions had to be made on your behalf, how clear is it who would make them?',
    options: [
      { value: 'clear', label: 'Very clear — roles are defined and documented', score: 3 },
      { value: 'somewhat', label: 'Somewhat clear, but not fully documented', score: 2 },
      { value: 'informal', label: 'Informally discussed, but not documented', score: 1 },
      { value: 'unclear', label: 'Not clear', score: 0 },
    ]
  },
  {
    id: 'a3',
    pillar: 'alignment',
    question: 'If you have dependents, how confident are you that guardianship and control decisions reflect your intent?',
    options: [
      { value: 'confident', label: 'Very confident — decisions are documented', score: 3 },
      { value: 'somewhat', label: "Somewhat confident, but haven't reviewed recently", score: 2 },
      { value: 'unsure', label: 'Unsure or not fully addressed', score: 1 },
      { value: 'na', label: 'Not applicable or not considered', score: 0 },
    ]
  },
  {
    id: 'a4',
    pillar: 'alignment',
    question: 'Are the priorities, rules, and delegations consistent across all of your estate documents?',
    options: [
      { value: 'aligned', label: 'Fully aligned and coordinated', score: 3 },
      { value: 'mostly', label: 'Mostly aligned, but not reviewed as a system', score: 2 },
      { value: 'misaligned', label: 'Likely misaligned or handled separately', score: 1 },
      { value: 'unsure', label: "I'm not sure", score: 0 },
    ]
  },
  // OVERSIGHT QUESTIONS (9-12)
  {
    id: 'o1',
    pillar: 'oversight',
    question: 'When was the last time your protection plan was fully reviewed?',
    options: [
      { value: 'year', label: 'Within the last year', score: 3 },
      { value: '2-3years', label: 'Within the last 2-3 years', score: 2 },
      { value: '3plus', label: 'More than 3 years ago', score: 1 },
      { value: 'never', label: "I don't recall a full review", score: 0 },
    ]
  },
  {
    id: 'o2',
    pillar: 'oversight',
    question: 'Have major life changes occurred since your plan was last reviewed?',
    options: [
      { value: 'no', label: 'No — changes have been addressed', score: 3 },
      { value: 'pending', label: 'Yes, but some updates are pending', score: 2 },
      { value: 'not_made', label: "Yes, and updates haven't been made", score: 1 },
      { value: 'unsure', label: "I'm not sure", score: 0 },
    ]
  },
  {
    id: 'o3',
    pillar: 'oversight',
    question: 'Who is responsible for making sure your plan stays current?',
    options: [
      { value: 'advisor', label: 'I work with someone who proactively helps manage updates', score: 3 },
      { value: 'self', label: 'I try to stay on top of it myself', score: 2 },
      { value: 'reactive', label: 'I update things only when something major happens', score: 1 },
      { value: 'none', label: 'No one is clearly responsible', score: 0 },
    ]
  },
  {
    id: 'o4',
    pillar: 'oversight',
    question: 'Which best describes how your plan is maintained over time?',
    options: [
      { value: 'regular', label: 'There is a regular review process', score: 3 },
      { value: 'occasional', label: 'Reviews happen occasionally', score: 2 },
      { value: 'reactive', label: 'Reviews are reactive or crisis-driven', score: 1 },
      { value: 'none', label: 'There is no review process', score: 0 },
    ]
  },
]

// Contact info collection step
const CONTACT_FIELDS = [
  { id: 'name', label: 'Full Name', type: 'text', required: true },
  { id: 'email', label: 'Email Address', type: 'email', required: true },
  { id: 'phone', label: 'Phone Number', type: 'tel', required: false },
]

function calculateProtectionState(answers) {
  // Calculate scores for each pillar
  const pillarScores = {
    protection: 0,
    alignment: 0,
    oversight: 0
  }
  
  const pillarMaxScores = {
    protection: 12, // 4 questions * 3 max points
    alignment: 12,
    oversight: 12
  }

  QUIZ_QUESTIONS.forEach(q => {
    const answer = answers[q.id]
    if (answer) {
      const option = q.options.find(o => o.value === answer)
      if (option) {
        pillarScores[q.pillar] += option.score
      }
    }
  })

  // Determine pillar strength (Strong > 8, Moderate 5-8, Weak < 5)
  const getPillarStrength = (score) => {
    if (score >= 9) return 'strong'
    if (score >= 5) return 'moderate'
    return 'weak'
  }

  const strengths = {
    protection: getPillarStrength(pillarScores.protection),
    alignment: getPillarStrength(pillarScores.alignment),
    oversight: getPillarStrength(pillarScores.oversight)
  }

  // Determine protection state based on the framework
  const weakCount = Object.values(strengths).filter(s => s === 'weak').length
  const strongCount = Object.values(strengths).filter(s => s === 'strong').length

  if (strongCount >= 2 && strengths.oversight !== 'weak') {
    return {
      state: 'Well Aligned',
      description: 'Your protection system is mostly coordinated. Continue with regular oversight to maintain alignment as life changes.',
      color: 'green',
      strengths,
      scores: pillarScores
    }
  }
  
  if (weakCount === 0 && strongCount < 2) {
    return {
      state: 'In Place, Needs Review',
      description: 'Some protection exists, but alignment and responsibility gaps are present. A comprehensive review would help identify what needs attention.',
      color: 'yellow',
      strengths,
      scores: pillarScores
    }
  }
  
  if (weakCount === 1) {
    return {
      state: 'Partially Built',
      description: 'Core pieces exist, but the system is fragmented or outdated. Coordination between your protection elements would strengthen your overall plan.',
      color: 'orange',
      strengths,
      scores: pillarScores
    }
  }

  return {
    state: 'Not Yet Protected',
    description: 'There are significant gaps in your protection structure. Building a coordinated system should be a priority.',
    color: 'red',
    strengths,
    scores: pillarScores
  }
}

export default function PublicQuiz() {
  const [step, setStep] = useState('intro') // intro, questions, contact, result
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [contactInfo, setContactInfo] = useState({})
  const [result, setResult] = useState(null)

  const createLeadMutation = useMutation({
    mutationFn: (data) => db.upsertLead(data),
    onSuccess: () => {
      const calculatedResult = calculateProtectionState(answers)
      setResult(calculatedResult)
      setStep('result')
    }
  })

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setStep('contact')
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleContactSubmit = (e) => {
    e.preventDefault()
    
    const calculatedResult = calculateProtectionState(answers)
    
    createLeadMutation.mutate({
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      protection_state: calculatedResult.state,
      quiz_answers: answers,
      pillar_scores: calculatedResult.scores,
      source: 'protection_assessment'
    })
  }

  const currentQ = QUIZ_QUESTIONS[currentQuestion]
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100

  // Intro screen
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border border-platinum p-8 text-center">
          <h1 className="text-2xl font-semibold text-charcoal mb-4">
            Protection & Alignment Assessment
          </h1>
          <p className="text-sm text-platinum mb-6 leading-relaxed">
            This short assessment helps answer one important question: 
            <strong className="text-charcoal block mt-2">
              "Is my financial protection actually coordinated and being maintained, or am I assuming it is?"
            </strong>
          </p>
          
          <div className="text-left bg-softwhite p-4 mb-6">
            <p className="text-xs text-platinum uppercase mb-3">What we'll evaluate:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sage"></div>
                <span className="text-sm text-charcoal">Protection — Is your coverage designed for your responsibilities?</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sage"></div>
                <span className="text-sm text-charcoal">Alignment — Would decisions reflect your intent?</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sage"></div>
                <span className="text-sm text-charcoal">Oversight — Who maintains your plan as life changes?</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-platinum mb-6">
            Takes about 3 minutes • 12 questions • Immediate results
          </p>

          <button
            onClick={() => setStep('questions')}
            className="w-full py-3 bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90 transition-colors"
          >
            Start Assessment
          </button>
        </div>
      </div>
    )
  }

  // Questions
  if (step === 'questions') {
    const pillarLabel = currentQ.pillar.charAt(0).toUpperCase() + currentQ.pillar.slice(1)
    
    return (
      <div className="min-h-screen bg-softwhite flex flex-col">
        {/* Progress bar */}
        <div className="bg-white border-b border-platinum">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-platinum">Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
              <span className="text-xs text-sage font-medium">{pillarLabel}</span>
            </div>
            <div className="h-1 bg-platinum/30">
              <div 
                className="h-full bg-sage transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <h2 className="text-lg font-medium text-charcoal mb-6">
              {currentQ.question}
            </h2>

            <div className="space-y-3">
              {currentQ.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentQ.id, option.value)}
                  className={cn(
                    "w-full text-left p-4 border transition-colors",
                    answers[currentQ.id] === option.value
                      ? "border-sage bg-sage/5"
                      : "border-platinum hover:border-charcoal"
                  )}
                >
                  <span className="text-sm text-charcoal">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrev}
                disabled={currentQuestion === 0}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm",
                  currentQuestion === 0 ? "text-platinum" : "text-charcoal hover:bg-softwhite"
                )}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!answers[currentQ.id]}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 text-sm font-medium",
                  answers[currentQ.id]
                    ? "bg-charcoal text-white hover:bg-charcoal/90"
                    : "bg-platinum text-white cursor-not-allowed"
                )}
              >
                {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Continue' : 'Next'}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Contact info collection
  if (step === 'contact') {
    return (
      <div className="min-h-screen bg-softwhite flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-platinum p-8">
          <h2 className="text-xl font-semibold text-charcoal mb-2">
            Almost there!
          </h2>
          <p className="text-sm text-platinum mb-6">
            Enter your information to see your Protection State and receive personalized insights.
          </p>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            {CONTACT_FIELDS.map((field) => (
              <div key={field.id}>
                <label className="block text-xs text-platinum uppercase mb-1.5">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.type}
                  value={contactInfo[field.id] || ''}
                  onChange={(e) => {
                    let value = e.target.value
                    if (field.type === 'tel') {
                      value = formatPhone(value)
                    }
                    setContactInfo(prev => ({ ...prev, [field.id]: value }))
                  }}
                  required={field.required}
                  className="w-full px-4 py-2.5 border border-platinum text-sm focus:outline-none focus:border-charcoal"
                  placeholder={field.type === 'tel' ? '(555) 123-4567' : ''}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={createLeadMutation.isPending}
              className="w-full py-3 bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90 transition-colors mt-6"
            >
              {createLeadMutation.isPending ? 'Processing...' : 'See My Results'}
            </button>
          </form>

          <p className="text-xs text-platinum text-center mt-4">
            Your information is secure and will never be shared.
          </p>
        </div>
      </div>
    )
  }

  // Results
  if (step === 'result' && result) {
    const stateColors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    }

    const pillarLabels = {
      protection: 'Protection',
      alignment: 'Alignment', 
      oversight: 'Oversight'
    }

    const strengthColors = {
      strong: 'bg-green-500',
      moderate: 'bg-yellow-500',
      weak: 'bg-red-500'
    }

    return (
      <div className="min-h-screen bg-softwhite py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Result Card */}
          <div className="bg-white border border-platinum p-8 text-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-sage mx-auto mb-4" />
            
            <h2 className="text-xl font-semibold text-charcoal mb-4">
              Your Protection State
            </h2>
            
            <div className={cn(
              "inline-block px-6 py-3 text-lg font-semibold border mb-4",
              stateColors[result.color]
            )}>
              {result.state}
            </div>
            
            <p className="text-sm text-platinum leading-relaxed">
              {result.description}
            </p>
          </div>

          {/* Pillar Breakdown */}
          <div className="bg-white border border-platinum p-6 mb-6">
            <h3 className="text-base font-semibold text-charcoal mb-4">Your Pillar Breakdown</h3>
            
            <div className="space-y-4">
              {Object.entries(result.strengths).map(([pillar, strength]) => (
                <div key={pillar} className="flex items-center justify-between">
                  <span className="text-sm text-charcoal">{pillarLabels[pillar]}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-platinum/30">
                      <div 
                        className={cn("h-full", strengthColors[strength])}
                        style={{ width: `${(result.scores[pillar] / 12) * 100}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 capitalize",
                      strength === 'strong' ? 'bg-green-100 text-green-800' :
                      strength === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {strength}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-charcoal text-white p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">
              Ready to align your protection?
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Schedule a Protection Clarity Conversation to review your results and discuss next steps.
            </p>
            <a
              href="/book/clarity-call"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white text-sm font-medium hover:bg-sage/90 transition-colors"
            >
              <Calendar size={18} />
              Book Your Conversation
            </a>
          </div>

          {/* Footer message */}
          <p className="text-xs text-platinum text-center mt-6">
            This assessment highlights how your protection is currently structured and maintained. 
            The next step is understanding what should be reviewed, aligned, or put in place.
          </p>
        </div>
      </div>
    )
  }

  return null
}
