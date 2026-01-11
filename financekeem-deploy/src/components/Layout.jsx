import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Database, 
  Calendar, 
  FileText,
  Link as LinkIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Database', path: '/', icon: Database },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Lead Capture', path: '/quizzes', icon: FileText },
  { name: 'Booking Pages', path: '/booking-pages', icon: LinkIcon },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-softwhite">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-platinum z-50 flex items-center justify-between px-4">
        <span className="text-base font-semibold text-charcoal">FinanceKeem</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-charcoal hover:bg-softwhite rounded"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Always visible on desktop */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-platinum z-40 transition-all duration-300 flex flex-col",
          collapsed ? "lg:w-16" : "lg:w-56",
          "w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header with title and collapse button */}
        <div className="h-14 flex items-center justify-between border-b border-platinum px-4">
          {!collapsed && (
            <span className="text-base font-semibold text-charcoal">Schedule</span>
          )}
          
          {/* Collapse toggle button - on the right */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1.5 text-charcoal hover:bg-softwhite rounded transition-colors hidden lg:flex items-center justify-center",
              collapsed && "mx-auto"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-charcoal hover:bg-softwhite rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                      isActive
                        ? "bg-charcoal text-white"
                        : "text-charcoal hover:bg-softwhite",
                      collapsed && "lg:justify-center lg:px-2"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer - Branding at bottom */}
        <div className="border-t border-platinum p-3">
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "lg:justify-center"
          )}>
            <div className="w-8 h-8 bg-charcoal text-white rounded flex items-center justify-center text-sm font-semibold flex-shrink-0">
              F
            </div>
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium text-charcoal">Finance Keem</span>
                <LogOut size={16} className="text-platinum hover:text-charcoal cursor-pointer" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen pt-14 lg:pt-0 transition-all duration-300",
          collapsed ? "lg:ml-16" : "lg:ml-56"
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
