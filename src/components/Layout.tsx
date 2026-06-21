import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useSidebarStore } from '@/store/useSidebarStore'

export default function Layout() {
  const collapsed = useSidebarStore((s) => s.collapsed)

  return (
    <div className="min-h-screen bg-cream flex">
      <Sidebar />
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          collapsed ? 'ml-[72px]' : 'ml-[220px]'
        }`}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
