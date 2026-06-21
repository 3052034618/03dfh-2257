import { useState } from 'react'
import { useStore } from '@/store/useStore'
import type { CaseAsset } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import {
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

const TODAY = new Date('2026-06-22')
const SIX_MONTHS_LATER = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0]

function isExpiringSoon(expiry: string) {
  if (!expiry) return false
  const d = new Date(expiry)
  const diff = (d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= 7
}

function isExpired(expiry: string) {
  if (!expiry) return false
  return new Date(expiry) < TODAY
}

export default function Review() {
  const { assets, updateAsset } = useStore()
  const [expandedExpired, setExpandedExpired] = useState(false)
  const [expandedBlur, setExpandedBlur] = useState(false)

  const pendingReview = assets
    .filter((a) => a.reviewStatus === 'pending' || a.authorizationStatus === 'pending')
    .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())

  const expiredAssets = assets.filter(
    (a) => a.authorizationStatus === 'expired' || isExpired(a.authorizationExpiry) || isExpiringSoon(a.authorizationExpiry)
  )

  const alertAssets = assets.filter(
    (a) => a.authorizationStatus === 'expired' || isExpiringSoon(a.authorizationExpiry)
  )

  const blurredPending = pendingReview.filter((a) => a.isBlurred)

  const totalPending = pendingReview.length
  const approvedToday = assets.filter(
    (a) => a.reviewStatus === 'approved' && a.authorizationStatus === 'authorized'
  ).length
  const expiredCount = assets.filter((a) => a.authorizationStatus === 'expired').length

  const handleApprove = (id: string) => {
    updateAsset(id, {
      authorizationStatus: 'authorized',
      reviewStatus: 'approved',
      authorizationExpiry: SIX_MONTHS_LATER,
    })
  }

  const handleReject = (id: string) => {
    updateAsset(id, {
      authorizationStatus: 'rejected',
      reviewStatus: 'rejected',
    })
  }

  const handleBlurApprove = (id: string) => {
    updateAsset(id, { reviewStatus: 'approved' })
  }

  const handleBlurReject = (id: string) => {}

  const handleRenew = (id: string) => {
    updateAsset(id, {
      authorizationExpiry: SIX_MONTHS_LATER,
      authorizationStatus: 'authorized',
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title">合规审核</h1>
        <p className="text-charcoal/60 mt-1">审核素材合规性与顾客授权状态</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-warn" />
          <div>
            <p className="text-sm text-charcoal/60">待审核</p>
            <p className="text-xl font-semibold text-charcoal">{totalPending}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald" />
          <div>
            <p className="text-sm text-charcoal/60">已通过</p>
            <p className="text-xl font-semibold text-charcoal">{approvedToday}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-gold" />
          <div>
            <p className="text-sm text-charcoal/60">已过期</p>
            <p className="text-xl font-semibold text-charcoal">{expiredCount}</p>
          </div>
        </div>
      </div>

      {alertAssets.length > 0 && (
        <div className="bg-amber-warn/10 border border-amber-warn/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-warn font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <span>授权预警：{alertAssets.length}项素材授权已过期或即将到期</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {alertAssets.map((a) => (
              <span key={a.id} className="text-sm text-charcoal/80 bg-amber-warn/10 px-2 py-0.5 rounded">
                {a.customerName}
              </span>
            ))}
          </div>
        </div>
      )}

      {pendingReview.length > 0 && (
        <div>
          <h2 className="section-title">审核队列</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-dark/50 text-charcoal/60">
                  <th className="text-left p-3">缩略图</th>
                  <th className="text-left p-3">顾客</th>
                  <th className="text-left p-3">项目</th>
                  <th className="text-left p-3">阶段</th>
                  <th className="text-left p-3">授权状态</th>
                  <th className="text-left p-3">上传日期</th>
                  <th className="text-left p-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingReview.map((a) => (
                  <tr key={a.id} className="border-t border-cream-dark/30 hover:bg-cream/50">
                    <td className="p-3">
                      <img src={a.thumbnailUrl} alt="" className="w-12 h-12 rounded object-cover" />
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-charcoal">{a.customerName}</p>
                      <p className="text-charcoal/50 text-xs">{a.customerId}</p>
                    </td>
                    <td className="p-3 text-charcoal/80">{a.treatmentProject}</td>
                    <td className="p-3 text-charcoal/80">
                      {a.phase === 'pre-op' ? '术前' : '术后'}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={a.authorizationStatus} type="auth" />
                    </td>
                    <td className="p-3 text-charcoal/60">{a.uploadDate}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(a.id)}
                          className="btn-primary flex items-center gap-1 px-3 py-1 text-xs"
                        >
                          <Check className="w-3 h-3" /> 通过
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          className="btn-secondary flex items-center gap-1 px-3 py-1 text-xs"
                        >
                          <X className="w-3 h-3" /> 退回
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {blurredPending.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedBlur(!expandedBlur)}
            className="section-title flex items-center gap-2 cursor-pointer"
          >
            <EyeOff className="w-5 h-5 text-charcoal/60" />
            打码确认
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedBlur ? 'rotate-180' : ''}`} />
          </button>
          {expandedBlur && (
            <div className="card mt-3 space-y-3 p-4">
              {blurredPending.map((a) => (
                <div key={a.id} className="flex items-center gap-4 border-b border-cream-dark/30 pb-3 last:border-0 last:pb-0">
                  <div className="relative">
                    <img src={a.thumbnailUrl} alt="" className="w-12 h-12 rounded object-cover" />
                    <div className="absolute -top-1 -right-1 bg-amber-warn rounded-full p-0.5">
                      <EyeOff className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal text-sm">{a.customerName} - {a.treatmentProject}</p>
                    <p className="text-xs text-charcoal/50">
                      {a.phase === 'pre-op' ? '术前' : '术后'} · 打码区域: {a.blurAreas.length}处
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBlurApprove(a.id)}
                      className="btn-primary flex items-center gap-1 px-3 py-1 text-xs"
                    >
                      <Check className="w-3 h-3" /> 确认
                    </button>
                    <button
                      onClick={() => handleBlurReject(a.id)}
                      className="btn-ghost flex items-center gap-1 px-3 py-1 text-xs"
                    >
                      <X className="w-3 h-3" /> 退回
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {expiredAssets.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedExpired(!expandedExpired)}
            className="section-title flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-5 h-5 text-charcoal/60" />
            过期/即将到期授权
            <span className="badge-expired text-xs">{expiredAssets.length}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedExpired ? 'rotate-180' : ''}`} />
          </button>
          {expandedExpired && (
            <div className="card mt-3 space-y-3 p-4">
              {expiredAssets.map((a) => (
                <div key={a.id} className="flex items-center gap-4 border-b border-cream-dark/30 pb-3 last:border-0 last:pb-0">
                  <img src={a.thumbnailUrl} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal text-sm">{a.customerName} - {a.treatmentProject}</p>
                    <p className="text-xs text-charcoal/50">
                      到期日: {a.authorizationExpiry}
                      {isExpiringSoon(a.authorizationExpiry) && !isExpired(a.authorizationExpiry) && (
                        <span className="ml-2 text-amber-warn">即将到期</span>
                      )}
                      {isExpired(a.authorizationExpiry) && (
                        <span className="ml-2 text-rose-gold">已过期</span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={a.authorizationStatus} type="auth" />
                  <button
                    onClick={() => handleRenew(a.id)}
                    className="btn-primary flex items-center gap-1 px-3 py-1 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" /> 续签授权
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
