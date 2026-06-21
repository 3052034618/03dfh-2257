import { useStore } from '@/store/useStore'
import type { CaseAsset } from '@/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  BarChart3, FileImage, Clock, AlertTriangle, TrendingUp,
  Users, Eye, ArrowUpRight,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { allChannels } from '@/data/mockData'

const TODAY = '2026-06-22'
const PIE_COLORS = ['#B76E79', '#2E8B6D', '#E8A838', '#6366f1', '#ec4899']
const USAGE_TREND = [
  { month: '1月', count: 45 },
  { month: '2月', count: 52 },
  { month: '3月', count: 68 },
  { month: '4月', count: 75 },
  { month: '5月', count: 89 },
  { month: '6月', count: 96 },
]

function daysDiff(dateStr: string, base: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date(base).getTime()) / 86400000)
}

export default function Dashboard() {
  const assets = useStore((s) => s.assets)

  const totalCount = assets.length
  const pendingCount = assets.filter((a) => a.reviewStatus === 'pending').length
  const newThisMonth = assets.filter((a) => a.uploadDate.startsWith('2026-06')).length
  const expiringCount = assets.filter((a) => {
    if (!a.authorizationExpiry) return false
    const diff = daysDiff(a.authorizationExpiry, TODAY)
    return diff >= 0 && diff <= 30
  }).length

  const kpiCards = [
    { icon: FileImage, label: '总案例数', value: totalCount, trend: '+12%', up: true },
    { icon: Clock, label: '待审核', value: pendingCount, trend: '+2', up: false },
    { icon: TrendingUp, label: '本月新增', value: newThisMonth, trend: '+33%', up: true },
    { icon: AlertTriangle, label: '即将过期', value: expiringCount, trend: '需关注', up: false },
  ]

  const projectDistribution = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.treatmentProject] = (acc[a.treatmentProject] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const expiringAssets = assets
    .filter((a) => a.authorizationExpiry)
    .map((a) => ({ ...a, daysLeft: daysDiff(a.authorizationExpiry, TODAY) }))
    .filter((a) => a.daysLeft >= -30 && a.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const channelData = allChannels.map((ch) => ({
    name: ch,
    count: assets.filter((a) => a.applicableChannels.includes(ch)).length,
  })).sort((a, b) => b.count - a.count)

  const topUsed = [...assets].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title">数据看板</h1>
        <p className="text-charcoal/50 text-sm mt-1">案例库数据概览与运营洞察</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-rose-gold/10 flex items-center justify-center">
                <card.icon className="w-5 h-5 text-rose-gold" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${card.up ? 'text-emerald' : 'text-amber-warn'}`}>
                <ArrowUpRight className="w-3 h-3" />
                {card.trend}
              </span>
            </div>
            <div className="mt-3 text-2xl font-semibold text-charcoal">{card.value}</div>
            <div className="mt-1 text-xs text-charcoal/50">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-rose-gold" />
            <h2 className="section-title">案例使用趋势</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={USAGE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2EDE9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
              <YAxis tick={{ fontSize: 12 }} stroke="#999" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#B76E79" strokeWidth={2} dot={{ fill: '#B76E79', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">项目分布</h2>
          <div className="flex items-center">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie
                  data={projectDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col gap-2">
              {projectDistribution.map((item, i) => (
                <span key={item.name} className="flex items-center gap-2 text-xs text-charcoal/70">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {item.name} ({item.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-warn" />
          <h2 className="section-title">授权到期提醒</h2>
        </div>
        <div className="space-y-2">
          {expiringAssets.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-cream">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-charcoal">{a.customerName}</span>
                <span className="text-xs text-charcoal/50">{a.treatmentProject}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-charcoal/50">{a.authorizationExpiry}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  a.daysLeft < 0
                    ? 'bg-red-500/10 text-red-600'
                    : a.daysLeft <= 7
                      ? 'bg-amber-warn/10 text-amber-warn'
                      : 'bg-emerald/10 text-emerald'
                }`}>
                  {a.daysLeft < 0 ? `已过期${Math.abs(a.daysLeft)}天` : `剩余${a.daysLeft}天`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-rose-gold" />
            <h2 className="section-title">渠道部署概览</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={channelData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#999" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#999" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#B76E79" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-rose-gold" />
            <h2 className="section-title">热门案例 TOP5</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-charcoal/50 text-xs border-b border-charcoal/5">
                <th className="text-left py-2 font-medium">客户姓名</th>
                <th className="text-left py-2 font-medium">项目</th>
                <th className="text-center py-2 font-medium">使用次数</th>
                <th className="text-center py-2 font-medium">授权状态</th>
              </tr>
            </thead>
            <tbody>
              {topUsed.map((a) => (
                <tr key={a.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="py-2.5 text-charcoal">{a.customerName}</td>
                  <td className="py-2.5 text-charcoal/70">{a.treatmentProject}</td>
                  <td className="py-2.5 text-center font-medium text-rose-gold">{a.usageCount}</td>
                  <td className="py-2.5 text-center">
                    <StatusBadge status={a.authorizationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
