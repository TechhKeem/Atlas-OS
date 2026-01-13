import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'

export default function Database() {
  const [leads, setLeads] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { setLeads(db.getLeads()) }, [])

  const reload = () => setLeads(db.getLeads())

  const handleDelete = (id) => {
    if (confirm('Delete this lead?')) {
      db.deleteLead(id)
      reload()
    }
  }

  const handleStatusChange = (id, status) => {
    db.updateLead(id, { status })
    reload()
  }

  const filtered = leads.filter(lead => {
    const matchSearch = !searchTerm || 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    scheduled: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const stateColors = {
    'Well Aligned': 'bg-green-100 text-green-800',
    'In Place, Needs Review': 'bg-yellow-100 text-yellow-800',
    'Partially Built': 'bg-orange-100 text-orange-800',
    'Not Yet Protected': 'bg-red-100 text-red-800'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-platinum px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-charcoal">Database</h1>
            <p className="text-sm text-platinum">{leads.length} total leads</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-platinum text-sm rounded">
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-platinum text-sm w-48 rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <p className="text-charcoal font-medium mb-2">No leads yet</p>
            <p className="text-sm text-platinum">Leads will appear here when people fill out your forms, quizzes, or book appointments.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-softwhite border-b border-platinum sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-charcoal uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-charcoal uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-charcoal uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-charcoal uppercase">Protection State</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-charcoal uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-charcoal uppercase">Source</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-platinum/50">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-softwhite">
                  <td className="px-4 py-3 text-sm font-medium text-charcoal">{lead.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-charcoal">{lead.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-charcoal">{lead.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {lead.protection_state ? (
                      <span className={cn("text-xs px-2 py-1 rounded", stateColors[lead.protection_state])}>{lead.protection_state}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select value={lead.status || 'new'} onChange={(e) => handleStatusChange(lead.id, e.target.value)} className={cn("text-xs px-2 py-1 rounded border-0 cursor-pointer", statusColors[lead.status || 'new'])}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-platinum">{lead.source || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(lead.id)} className="p-1 text-platinum hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
