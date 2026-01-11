import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  Edit2,
  FileText,
  ClipboardList,
  X,
  GripVertical,
  ChevronDown
} from 'lucide-react'

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkbox' },
]

export default function FormsAdmin() {
  const [activeTab, setActiveTab] = useState('forms') // forms or quizzes
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  
  const queryClient = useQueryClient()

  // Fetch forms and quizzes
  const { data: forms = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: db.getForms
  })

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: db.getQuizzes
  })

  // Mutations
  const createFormMutation = useMutation({
    mutationFn: db.createForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      setIsCreating(false)
    }
  })

  const updateFormMutation = useMutation({
    mutationFn: ({ id, updates }) => db.updateForm(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      setEditingItem(null)
    }
  })

  const deleteFormMutation = useMutation({
    mutationFn: db.deleteForm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forms'] })
  })

  const createQuizMutation = useMutation({
    mutationFn: db.createQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      setIsCreating(false)
    }
  })

  const deleteQuizMutation = useMutation({
    mutationFn: db.deleteQuiz,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quizzes'] })
  })

  const copyLink = (slug, type) => {
    const url = `${window.location.origin}/${type}/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(slug)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateForm = () => {
    createFormMutation.mutate({
      name: 'New Form',
      description: 'Collect information from your leads',
      fields: [
        { id: 'name', type: 'text', label: 'Full Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'phone', type: 'tel', label: 'Phone', required: false }
      ]
    })
  }

  const handleCreateQuiz = () => {
    createQuizMutation.mutate({
      name: 'New Quiz',
      description: 'Assess your leads with this quiz',
      questions: [
        {
          id: 'q1',
          question: 'Sample question?',
          options: [
            { value: 'a', label: 'Option A', score: 1 },
            { value: 'b', label: 'Option B', score: 2 },
            { value: 'c', label: 'Option C', score: 3 }
          ]
        }
      ],
      results: [
        { minScore: 0, maxScore: 1, title: 'Result A', description: 'Description for result A' },
        { minScore: 2, maxScore: 3, title: 'Result B', description: 'Description for result B' }
      ]
    })
  }

  const items = activeTab === 'forms' ? forms : quizzes

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Lead Capture</h1>
          <p className="text-sm text-platinum mt-1">Create forms and quizzes to capture leads</p>
        </div>
        <button
          onClick={activeTab === 'forms' ? handleCreateForm : handleCreateQuiz}
          disabled={createFormMutation.isPending || createQuizMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white text-sm hover:bg-charcoal/90"
        >
          <Plus size={16} />
          Create {activeTab === 'forms' ? 'Form' : 'Quiz'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-platinum">
        <button
          onClick={() => setActiveTab('forms')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'forms' 
              ? "border-charcoal text-charcoal" 
              : "border-transparent text-platinum hover:text-charcoal"
          )}
        >
          <FileText size={16} />
          Forms ({forms.length})
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'quizzes' 
              ? "border-charcoal text-charcoal" 
              : "border-transparent text-platinum hover:text-charcoal"
          )}
        >
          <ClipboardList size={16} />
          Quizzes ({quizzes.length})
        </button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="bg-white border border-platinum p-12 text-center">
          <div className="w-12 h-12 bg-softwhite rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'forms' ? <FileText className="text-platinum" /> : <ClipboardList className="text-platinum" />}
          </div>
          <h3 className="text-base font-medium text-charcoal mb-2">
            No {activeTab} yet
          </h3>
          <p className="text-sm text-platinum mb-4">
            Create your first {activeTab === 'forms' ? 'form' : 'quiz'} to start capturing leads
          </p>
          <button
            onClick={activeTab === 'forms' ? handleCreateForm : handleCreateQuiz}
            className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal text-white text-sm"
          >
            <Plus size={16} />
            Create {activeTab === 'forms' ? 'Form' : 'Quiz'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-platinum">
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium text-charcoal">{item.name}</h3>
                  <p className="text-sm text-platinum mt-1">{item.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Status badge */}
                  <span className={cn(
                    "text-xs px-2 py-1",
                    item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  )}>
                    {item.status}
                  </span>
                  
                  {/* Copy link */}
                  <button
                    onClick={() => copyLink(item.slug, activeTab === 'forms' ? 'form' : 'quiz')}
                    className="p-2 text-platinum hover:text-charcoal hover:bg-softwhite"
                    title="Copy link"
                  >
                    {copiedId === item.slug ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  
                  {/* Preview */}
                  <a
                    href={`/${activeTab === 'forms' ? 'form' : 'quiz'}/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-platinum hover:text-charcoal hover:bg-softwhite"
                    title="Preview"
                  >
                    <ExternalLink size={16} />
                  </a>
                  
                  {/* Edit */}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-platinum hover:text-charcoal hover:bg-softwhite"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  
                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Delete this ${activeTab === 'forms' ? 'form' : 'quiz'}?`)) {
                        if (activeTab === 'forms') {
                          deleteFormMutation.mutate(item.id)
                        } else {
                          deleteQuizMutation.mutate(item.id)
                        }
                      }
                    }}
                    className="p-2 text-platinum hover:text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {/* Link preview */}
              <div className="px-4 py-3 bg-softwhite border-t border-platinum">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-platinum">Link:</span>
                  <code className="text-xs text-charcoal bg-white px-2 py-1 border border-platinum flex-1 truncate">
                    {window.location.origin}/{activeTab === 'forms' ? 'form' : 'quiz'}/{item.slug}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <FormEditor
          item={editingItem}
          type={activeTab}
          onSave={(updates) => {
            if (activeTab === 'forms') {
              updateFormMutation.mutate({ id: editingItem.id, updates })
            } else {
              // For quizzes, we'd have a similar mutation
              db.updateQuiz(editingItem.id, updates).then(() => {
                queryClient.invalidateQueries({ queryKey: ['quizzes'] })
                setEditingItem(null)
              })
            }
          }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}

// Form/Quiz Editor Modal
function FormEditor({ item, type, onSave, onClose }) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description)
  const [fields, setFields] = useState(item.fields || [])

  const addField = () => {
    setFields([...fields, {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    }])
  }

  const updateField = (index, updates) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFields(newFields)
  }

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave({ name, description, fields })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-platinum flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal">
            Edit {type === 'forms' ? 'Form' : 'Quiz'}
          </h2>
          <button onClick={onClose} className="text-platinum hover:text-charcoal">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal"
              />
            </div>
            <div>
              <label className="block text-xs text-platinum uppercase mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal resize-none"
              />
            </div>
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-platinum uppercase">Fields</label>
              <button
                onClick={addField}
                className="text-xs text-sage hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                Add Field
              </button>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-3 p-3 bg-softwhite border border-platinum">
                  <GripVertical size={16} className="text-platinum mt-2 cursor-grab" />
                  
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Field label"
                      className="px-2 py-1.5 border border-platinum text-sm"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value })}
                      className="px-2 py-1.5 border border-platinum text-sm"
                    >
                      {FIELD_TYPES.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <label className="flex items-center gap-1.5 text-xs text-platinum">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                    />
                    Required
                  </label>
                  
                  <button
                    onClick={() => removeField(index)}
                    className="p-1 text-platinum hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-platinum flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-charcoal hover:bg-softwhite"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-charcoal text-white hover:bg-charcoal/90"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
