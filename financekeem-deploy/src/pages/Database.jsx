import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/supabase'
import { cn, formatDate, formatPhone } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  Trash2,
  X,
  ChevronDown
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-800' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
]

const PROTECTION_STATES = [
  'Well Aligned',
  'In Place, Needs Review', 
  'Partially Built',
  'Not Yet Protected'
]

export default function Database() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const queryClient = useQueryClient()

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: db.getLeads
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => db.updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => db.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setSelectedLead(null)
      setIsModalOpen(false)
    }
  })

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = (leadId, newStatus) => {
    updateMutation.mutate({ id: leadId, updates: { status: newStatus } })
  }

  const openLeadModal = (lead) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-platinum px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-charcoal">Lead Database</h1>
            <p className="text-sm text-platinum">{leads.length} total leads</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-platinum" size={16} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-platinum text-sm w-full sm:w-64 focus:outline-none focus:border-charcoal"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-platinum text-sm focus:outline-none focus:border-charcoal"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-platinum text-sm">No leads found</p>
            <p className="text-platinum text-xs mt-1">Leads from your quiz will appear here</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-softwhite border-b border-platinum sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider">Protection State</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-platinum">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="hover:bg-softwhite cursor-pointer"
                  onClick={() => openLeadModal(lead)}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-charcoal">{lead.name || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-sm text-charcoal">
                          <Mail size={14} className="text-platinum" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-charcoal">
                          <Phone size={14} className="text-platinum" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {lead.protection_state && (
                      <span className={cn(
                        "text-xs px-2 py-1",
                        lead.protection_state === 'Well Aligned' ? 'bg-green-100 text-green-800' :
                        lead.protection_state === 'In Place, Needs Review' ? 'bg-yellow-100 text-yellow-800' :
                        lead.protection_state === 'Partially Built' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {lead.protection_state}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={cn(
                        "text-xs px-2 py-1 border-0 cursor-pointer",
                        STATUS_OPTIONS.find(s => s.value === lead.status)?.color
                      )}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-platinum">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this lead?')) {
                          deleteMutation.mutate(lead.id)
                        }
                      }}
                      className="p-1 text-platinum hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Lead Detail Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-platinum flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal">Lead Details</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-platinum hover:text-charcoal">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-platinum uppercase">Name</label>
                <p className="text-sm text-charcoal">{selectedLead.name || '-'}</p>
              </div>
              
              <div>
                <label className="text-xs text-platinum uppercase">Email</label>
                <p className="text-sm text-charcoal">{selectedLead.email || '-'}</p>
              </div>
              
              <div>
                <label className="text-xs text-platinum uppercase">Phone</label>
                <p className="text-sm text-charcoal">{selectedLead.phone || '-'}</p>
              </div>
              
              <div>
                <label className="text-xs text-platinum uppercase">Protection State</label>
                <p className="text-sm text-charcoal">{selectedLead.protection_state || '-'}</p>
              </div>
              
              {selectedLead.quiz_answers && (
                <div>
                  <label className="text-xs text-platinum uppercase mb-2 block">Quiz Responses</label>
                  <div className="bg-softwhite p-3 text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedLead.quiz_answers, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-xs text-platinum uppercase">Created</label>
                <p className="text-sm text-charcoal">{formatDate(selectedLead.created_at)}</p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-platinum flex justify-end gap-3">
              <button
                onClick={() => {
                  if (confirm('Delete this lead?')) {
                    deleteMutation.mutate(selectedLead.id)
                  }
                }}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm bg-charcoal text-white hover:bg-charcoal/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
