import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { CaseAsset } from '@/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  BarChart3, FileImage, Clock, AlertTriangle, TrendingUp,
  Users, Eye, ArrowUpRight, Package, Download, Play, Layers,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { allChannels, treatmentProjects } from '@/data/mockData'

const TODAY = '2026-06-22'
const PIE_COLORS = ['#B76E79', '#2E8B6D', '#E8A838', '#6366f1', '#ec4899']

function daysDiff(dateStr: string, base: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date(base).getTime()) / 86400000)
}

export default function Dashboard() {
  const { assets, packages, downloadRequests } = useStore()
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [channelTab, setChannelTab] = useState<'overview' | 'review'>('overview')

  const totalCount = assets.length
  const pendingCount = assets.filter((a) => a.reviewStatus === 'pending').length
  const newThisMonth = assets.filter((a) => a.uploadDate.startsWith('2026-06')).length
  const expiringCount = assets.filter((a) => {
    if (!a.authorizationExpiry) return false
    const diff = daysDiff(a.authorizationExpiry, TODAY)
    return diff >= 0 && diff <= 30
  }).length

  const totalPackages = packages.length
  const totalDownloads = packages.reduce((sum, p) => sum + p.downloadCount, 0)
  const totalUsage = assets.reduce((sum, a) => sum + a.usageCount, 0)
  const videoCount = assets.filter(a => a.mediaType === 'video').length

  const USAGE_TREND = useMemo(() => {
    const currentMonth = totalUsage
    const baseLine = Math.floor(currentMonth / 6)
    return [
      { month: '1月', count: Math.max(20, baseLine + Math.floor(Math.random() * 10) - 5) },
      { month: '2月', count: Math.max(25, Math.floor(baseLine * 1.2 + Math.random() * 10) - 5) },
      { month: '3月', count: Math.max(35, Math.floor(baseLine * 1.5 + Math.random() * 15) - 7) },
      { month: '4月', count: Math.max(50, Math.floor(baseLine * 2 + Math.random() * 15) - 7) },
      { month: '5月', count: Math.max(65, Math.floor(baseLine * 2.5 + Math.random() * 20) - 10) },
      { month: '6月', count: currentMonth },
    ]
  }, [totalUsage])

  const PACKAGE_TREND = useMemo(() => {
    return [
      { name: '已创建', value: totalPackages },
      { name: '待审批', value: downloadRequests.filter(r => r.status === 'pending').length },
      { name: '已下载', value: totalDownloads },
    ]
  }, [totalPackages, totalDownloads, downloadRequests])

  const kpiCards = [
    { icon: FileImage, label: '总案例数', value: totalCount, trend: '+12%', up: true, color: 'text-rose-gold' },
    { icon: Package, label: '素材包数', value: totalPackages, trend: '+3', up: true, color: 'text-emerald' },
    { icon: Download, label: '累计下载', value: totalDownloads, trend: '+18%', up: true, color: 'text-amber-warn' },
    { icon: TrendingUp, label: '累计使用', value: totalUsage, trend: '+25%', up: true, color: 'text-rose-gold' },
  ]

  const secondaryCards = [
    { icon: Clock, label: '待审核', value: pendingCount, trend: '+2', up: false },
    { icon: FileImage, label: '图片素材', value: totalCount - videoCount, trend: '+8', up: true },
    { icon: Play, label: '视频素材', value: videoCount, trend: '+4', up: true },
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

  const topUsed = useMemo(() => {
    let filtered = assets
    if (selectedChannel && selectedChannel !== 'all') {
      filtered = assets.filter(a => a.applicableChannels.includes(selectedChannel))
    }
    return [...filtered].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5)
  }, [assets, selectedChannel])

  const topPackages = [...packages].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 5)

  const channelReviewData = useMemo(() => {
    return allChannels.map((ch) => {
      const channelAssets = assets.filter(a => a.applicableChannels.includes(ch))
      const channelPackages = packages.filter(p => p.targetChannels.includes(ch))
      const top3ForChannel = [...channelAssets]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 3)
      return {
        name: ch,
        assetCount: channelAssets.length,
        packageCount: channelPackages.length,
        totalDownloads: channelPackages.reduce((s, p) => s + p.downloadCount, 0),
        totalUsage: channelAssets.reduce((s, a) => s + a.usageCount, 0),
        topCases: top3ForChannel,
      }
    })
  }, [assets, packages])

  const packageDownloadChartData = useMemo(() => {
    if (!selectedChannel || selectedChannel === 'all') return []
    return packages
      .filter(p => p.targetChannels.includes(selectedChannel))
      .map(p => ({
        name: p.name,
        下载次数: p.downloadCount,
      }))
  }, [packages, selectedChannel])

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
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${card.up ? 'text-emerald' : 'text-amber-warn'}`}>
                <ArrowUpRight className={`w-3 h-3 ${!card.up ? 'rotate-180' : ''}`} />
                {card.trend}
              </span>
            </div>
            <div className="mt-3 text-2xl font-semibold text-charcoal">{card.value}</div>
            <div className="mt-1 text-xs text-charcoal/50">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {secondaryCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center">
                <card.icon className="w-4 h-4 text-charcoal/50" />
              </div>
              <div>
                <div className="text-xl font-semibold text-charcoal">{card.value}</div>
                <div className="text-xs text-charcoal/50 flex items-center gap-1">
                  {card.label}
                  <span className={card.up ? 'text-emerald' : 'text-amber-warn'}>{card.trend}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-rose-gold" />
          <h2 className="section-title">视图切换</h2>
        </div>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setChannelTab('overview')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              channelTab === 'overview'
                ? 'bg-rose-gold text-white shadow-md'
                : 'bg-cream text-charcoal/70 hover:bg-charcoal/5'
            }`}
          >
            总览
          </button>
          <button
            onClick={() => setChannelTab('review')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              channelTab === 'review'
                ? 'bg-rose-gold text-white shadow-md'
                : 'bg-cream text-charcoal/70 hover:bg-charcoal/5'
            }`}
          >
            按渠道复盘
          </button>
        </div>
        {channelTab === 'review' && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-charcoal/5">
            <button
              onClick={() => setSelectedChannel('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedChannel === 'all'
                  ? 'bg-rose-gold text-white'
                  : 'bg-cream text-charcoal/60 hover:bg-charcoal/5'
              }`}
            >
              全部渠道
            </button>
            {allChannels.map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedChannel === ch
                    ? 'bg-rose-gold text-white'
                    : 'bg-cream text-charcoal/60 hover:bg-charcoal/5'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-rose-gold" />
            <h2 className="section-title">案例使用趋势</h2>
            <span className="ml-auto text-xs text-charcoal/50 bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">
              实时更新
            </span>
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
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-rose-gold" />
            <h2 className="section-title">素材包统计</h2>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={PACKAGE_TREND}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#B76E79" />
                  <Cell fill="#E8A838" />
                  <Cell fill="#2E8B6D" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {PACKAGE_TREND.map((item, i) => (
              <div key={item.name} className="text-center">
                <div
                  className="w-2.5 h-2.5 rounded-full mx-auto mb-1"
                  style={{ background: ['#B76E79', '#E8A838', '#2E8B6D'][i] }}
                />
                <div className="text-sm font-semibold text-charcoal">{item.value}</div>
                <div className="text-[10px] text-charcoal/50">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
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

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-warn" />
            <h2 className="section-title">授权到期提醒</h2>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {expiringAssets.length === 0 ? (
              <div className="text-center py-8 text-charcoal/30 text-sm">暂无到期提醒</div>
            ) : (
              expiringAssets.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-cream">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-charcoal">{a.customerName}</span>
                    <span className="text-xs text-charcoal/50">{a.treatmentProject}</span>
                    {a.mediaType === 'video' && (
                      <span className="text-[10px] bg-rose-gold/10 text-rose-gold px-1.5 py-0.5 rounded">视频</span>
                    )}
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
              ))
            )}
          </div>
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
            <span className="ml-auto text-xs text-charcoal/50 bg-emerald/10 text-emerald px-2 py-0.5 rounded-full">
              实时更新
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-charcoal/50 text-xs border-b border-charcoal/5">
                <th className="text-left py-2 font-medium">客户姓名</th>
                <th className="text-left py-2 font-medium">项目</th>
                <th className="text-center py-2 font-medium">类型</th>
                <th className="text-center py-2 font-medium">使用次数</th>
                <th className="text-center py-2 font-medium">授权</th>
              </tr>
            </thead>
            <tbody>
              {topUsed.map((a, i) => (
                <tr key={a.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="py-2.5 text-charcoal flex items-center gap-1.5">
                    <span className="text-[10px] bg-rose-gold/10 text-rose-gold w-4 h-4 rounded flex items-center justify-center font-semibold">
                      {i + 1}
                    </span>
                    {a.customerName}
                  </td>
                  <td className="py-2.5 text-charcoal/70">{a.treatmentProject}</td>
                  <td className="py-2.5 text-center">
                    {a.mediaType === 'video' ? (
                      <span className="text-[10px] bg-rose-gold/10 text-rose-gold px-1.5 py-0.5 rounded">视频</span>
                    ) : (
                      <span className="text-[10px] bg-charcoal/5 text-charcoal/50 px-1.5 py-0.5 rounded">图片</span>
                    )}
                  </td>
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

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-rose-gold" />
          <h2 className="section-title">素材包下载排行</h2>
          <span className="ml-auto text-xs text-charcoal/50 bg-amber-warn/10 text-amber-warn px-2 py-0.5 rounded-full">
            实时更新
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {topPackages.map((pkg, i) => (
            <div key={pkg.id} className="bg-cream rounded-xl p-3 text-center">
              <div className="text-[10px] bg-rose-gold/10 text-rose-gold w-5 h-5 rounded-full flex items-center justify-center font-semibold mx-auto mb-2">
                {i + 1}
              </div>
              <p className="text-sm font-medium text-charcoal truncate mb-1">{pkg.name}</p>
              <div className="flex items-center justify-center gap-1 text-charcoal/50 text-xs mb-2">
                <Package className="w-3 h-3" />
                {pkg.caseIds.length} 个案例
              </div>
              <div className="flex items-center justify-center gap-1 text-rose-gold font-semibold">
                <Download className="w-3 h-3" />
                {pkg.downloadCount}
              </div>
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {pkg.targetChannels.slice(0, 2).map(ch => (
                  <span key={ch} className="text-[9px] bg-white text-charcoal/60 px-1.5 py-0.5 rounded">
                    {ch}
                  </span>
                ))}
                {pkg.targetChannels.length > 2 && (
                  <span className="text-[9px] text-charcoal/40">+{pkg.targetChannels.length - 2}</span>
                )}
              </div>
            </div>
          ))}
          {topPackages.length === 0 && (
            <div className="col-span-5 text-center py-8 text-charcoal/30 text-sm">暂无素材包</div>
          )}
        </div>
      </div>

      {channelTab === 'review' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-rose-gold" />
            <h2 className="section-title">投放渠道复盘</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {channelReviewData.map((data, idx) => (
              <div key={data.name} className="bg-cream rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-charcoal">{data.name}</h3>
                  <span className="text-[10px] bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full font-medium">
                    #{idx + 1}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-2.5">
                    <div className="text-xs text-charcoal/50 text-[11px]">可用素材数</div>
                    <div className="text-lg font-semibold text-charcoal mt-0.5">{data.assetCount}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <div className="text-xs text-charcoal/50 text-[11px]">素材包数</div>
                    <div className="text-lg font-semibold text-charcoal mt-0.5">{data.packageCount}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <div className="text-xs text-charcoal/50 text-[11px]">累计下载数</div>
                    <div className="text-lg font-semibold text-emerald mt-0.5">{data.totalDownloads}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <div className="text-xs text-charcoal/50 text-[11px]">累计使用次数</div>
                    <div className="text-lg font-semibold text-rose-gold mt-0.5">{data.totalUsage}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-charcoal/60 text-[11px] mb-2 font-medium">渠道热门案例 TOP3</div>
                  {data.topCases.length > 0 ? (
                    <div className="space-y-1.5">
                      {data.topCases.map((a, i) => (
                        <div key={a.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-rose-gold/10 text-rose-gold w-4 h-4 rounded flex items-center justify-center font-semibold">
                              {i + 1}
                            </span>
                            <div>
                              <div className="text-xs font-medium text-charcoal">{a.customerName}</div>
                              <div className="text-[10px] text-charcoal/50">{a.treatmentProject}</div>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-rose-gold">{a.usageCount}次</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-charcoal/30 text-xs py-2 bg-white rounded-lg">暂无案例</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {channelTab === 'review' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-4 h-4 text-rose-gold" />
            <h2 className="section-title">下载次数趋势对比</h2>
            {selectedChannel && selectedChannel !== 'all' && (
              <span className="ml-2 text-xs text-charcoal/50 bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">
                {selectedChannel}
              </span>
            )}
          </div>
          {selectedChannel && selectedChannel !== 'all' ? (
            packageDownloadChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={packageDownloadChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2EDE9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#999" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                  <Tooltip />
                  <Bar dataKey="下载次数" fill="#B76E79" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-charcoal/30 text-sm">该渠道暂无素材包数据</div>
            )
          ) : (
            <div className="flex items-center justify-center py-16 text-charcoal/40 text-sm">
              <div className="text-center">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <div>请在上方渠道选择器中选择具体渠道，查看该渠道素材包下载次数对比</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
