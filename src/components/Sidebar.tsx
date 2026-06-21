import { NavLink, useLocation } from 'react-router-dom'
import {
  Upload,
  Archive,
  ShieldCheck,
  Send,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useSidebarStore } from '@/store/useSidebarStore'

const navItems = [
  { path: '/ingestion', label: '素材入库', icon: Upload },
  { path: '/archive', label: '案例档案', icon: Archive },
  { path: '/review', label: '合规审核', icon: ShieldCheck },
  { path: '/deploy', label: '投放选用', icon: Send },
  { path: '/dashboard', label: '数据看板', icon: BarChart3 },
]

export default function Sidebar() {
  const { collapsed, toggle } = useSidebarStore()
  const location = useLocation()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-charcoal text-white flex flex-col z-50 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[220px]'
      }`}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-rose-gold flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-sm font-display font-semibold tracking-wide whitespace-nowrap">
              AestheCase
            </h1>
            <p className="text-[10px] text-white/40 whitespace-nowrap">医美案例库工作台</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-rose-gold text-white shadow-lg shadow-rose-gold/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap animate-fade-in">{item.label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={toggle}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-sm w-full transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="animate-fade-in">收起侧栏</span>}
        </button>
      </div>

      <div className="px-5 pb-4">
        {!collapsed && (
          <div className="animate-fade-in bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/50">当前角色</p>
            <p className="text-sm font-medium text-rose-gold-light mt-0.5">运营主管</p>
          </div>
        )}
      </div>
    </aside>
  )
}
