import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { db } from '@/lib/supabase'
import { Users, Calendar, ClipboardList, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: db.getLeads
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: db.getBookings
  })

  const { data: quizResponses = [] } = useQuery({
    queryKey: ['quiz-responses'],
    queryFn: db.getQuizResponses
  })

  const stats = [
    { 
      name: 'Total Leads', 
      value: leads.length, 
      icon: Users,
      href: '/database',
      color: 'bg-sage'
    },
    { 
      name: 'Quiz Responses', 
      value: quizResponses.length, 
      icon: ClipboardList,
      href: '/quizzes',
      color: 'bg-charcoal'
    },
    { 
      name: 'Upcoming Bookings', 
      value: bookings.filter(b => new Date(b.scheduled_date) > new Date()).length, 
      icon: Calendar,
      href: '/calendar',
      color: 'bg-sage'
    },
    { 
      name: 'This Month', 
      value: leads.filter(l => {
        const created = new Date(l.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length, 
      icon: TrendingUp,
      href: '/database',
      color: 'bg-charcoal'
    },
  ]

  const recentLeads = leads.slice(0, 5)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">Dashboard</h1>
        <p className="text-sm text-platinum mt-1">Welcome to your protection planning hub</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="bg-white border border-platinum p-5 hover:border-charcoal transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-platinum">{stat.name}</p>
                  <p className="text-2xl font-semibold text-charcoal mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 text-white`}>
                  <Icon size={20} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Leads */}
      <div className="bg-white border border-platinum">
        <div className="px-5 py-4 border-b border-platinum flex items-center justify-between">
          <h2 className="text-base font-semibold text-charcoal">Recent Leads</h2>
          <Link to="/database" className="text-sm text-sage hover:underline">
            View all
          </Link>
        </div>
        
        {recentLeads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-platinum text-sm">No leads yet</p>
            <p className="text-platinum text-xs mt-1">Leads from your quiz will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-platinum">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">{lead.name || lead.email}</p>
                  <p className="text-xs text-platinum">{lead.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {lead.protection_state && (
                    <span className={`text-xs px-2 py-1 ${
                      lead.protection_state === 'Well Aligned' ? 'bg-green-100 text-green-800' :
                      lead.protection_state === 'In Place, Needs Review' ? 'bg-yellow-100 text-yellow-800' :
                      lead.protection_state === 'Partially Built' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {lead.protection_state}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                    lead.status === 'scheduled' ? 'bg-sage/20 text-sage' :
                    'bg-platinum/50 text-charcoal'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
