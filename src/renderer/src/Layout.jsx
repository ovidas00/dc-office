import { useLocation, Link } from 'react-router-dom'
import icon from './assets/icon.png'
import { Database, LayoutDashboard, LayoutList, CloudDownload, LockKeyhole } from 'lucide-react'

export default function DesktopLayout({ children }) {
  const location = useLocation()

  const sidebarItems = [
    { path: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/records', icon: <Database size={18} />, label: 'Records' },
    { path: '/categories', icon: <LayoutList size={18} />, label: 'Categories' },
    { path: '/backup', icon: <CloudDownload size={18} />, label: 'Backup' },
    { path: '/update-password', icon: <LockKeyhole size={18} />, label: 'Security' }
  ]

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-300 flex flex-col">
        {/* Logo / Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-300">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            <img src={icon} alt="Logo" />
          </div>
          <span className="font-medium text-gray-900 text-lg">Charity Ledger</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {sidebarItems.map((item, idx) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={idx}
                to={item.path}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded
                  transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {children || (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h1 className="text-2xl font-semibold mb-2">Welcome to the Desktop App</h1>
            <p className="text-sm">Select an item from the sidebar to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
