import { useState } from 'react'
import { useStore } from '@/store/useStore'
import type { CaseAsset } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import { VideoOverlay, VideoPreviewModal } from '@/components/VideoPreviewModal'
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
  History,
  Send,
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

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getActionLabel(action: string) {
  switch (action) {
    case 'submit': return { text: '提交打码', color: 'text-amber-warn' }
    case 'approve': return { text: '打码通过', color: 'text-emerald' }
    case 'reject': return { text: '打码退回', color: 'text-rose-gold' }
    case 'resubmit': return { text: '重新提交', color: 'text-emerald' }
    default: return { text: action, color: 'text-charcoal' }
  }
}

export default function Review() {
  const { assets, updateAsset, addBlurLog } = useStore()
  const [expandedExpired, setExpandedExpired] = useState(false)
  const [expandedBlur, setExpandedBlur] = useState(false)
  const [expandedRejectedBlur, setExpandedRejectedBlur] = useState(false)
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' })

  const pendingReview = assets
    .filter((a) => a.reviewStatus === 'pending' || a.authorizationStatus === 'pending')
    .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())

  const expiredAssets = assets.filter(
    (a) => a.authorizationStatus === 'expired' || isExpired(a.authorizationExpiry) || isExpiringSoon(a.authorizationExpiry)
  )

  const alertAssets = assets.filter(
    (a) => a.authorizationStatus === 'expired' || isExpiringSoon(a.authorizationExpiry)
  )

  const blurredPending = pendingReview.filter((a) => a.isBlurred && a.blurReviewStatus === 'pending')
  const blurredRejected = assets.filter((a) => a.isBlurred && a.blurReviewStatus === 'rejected')

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
    updateAsset(id, {
      blurReviewStatus: 'approved',
      reviewStatus: 'approved',
      authorizationStatus: 'authorized',
      authorizationExpiry: SIX_MONTHS_LATER,
      blurRejectReason: '',
    })
    addBlurLog(id, { action: 'approve', operator: '运营主管' })
  }

  const openRejectModal = (id: string) => {
    setRejectModalOpen(id)
    setRejectReason((prev) => ({ ...prev, [id]: '' }))
  }

  const handleBlurRejectConfirm = (id: string) => {
    const reason = rejectReason[id] || '打码不符合规范，请重新处理'
    updateAsset(id, {
      blurReviewStatus: 'rejected',
      reviewStatus: 'pending',
      isBlurred: false,
      blurAreas: [],
      blurRejectReason: reason,
    })
    addBlurLog(id, { action: 'reject', operator: '运营主管', reason })
    setRejectModalOpen(null)
  }

  const handleBlurResubmit = (id: string) => {
    updateAsset(id, {
      blurReviewStatus: 'pending',
      isBlurred: true,
      blurRejectReason: '',
    })
    addBlurLog(id, { action: 'resubmit', operator: '运营主管' })
  }

  const handleRenew = (id: string) => {
    updateAsset(id, {
      authorizationExpiry: SIX_MONTHS_LATER,
      authorizationStatus: 'authorized',
    })
  }

  const openVideoPreview = (asset: CaseAsset) => {
    setVideoPreview({
      isOpen: true,
      url: asset.mediaUrl,
      title: `${asset.customerName} - ${asset.treatmentProject}`,
    })
  }

  const renderMedia = (asset: CaseAsset, size = 'w-12 h-12') => {
    if (asset.mediaType === 'video') {
      return (
        <div
          className={`relative ${size} rounded overflow-hidden cursor-pointer group`}
          onClick={() => openVideoPreview(asset)}
        >
          <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          <VideoOverlay />
        </div>
      )
    }
    return <img src={asset.thumbnailUrl} alt="" className={`${size} rounded object-cover`} />
  }

  const renderLogs = (asset: CaseAsset) => (
    <div className="space-y-2 mt-3 pt-3 border-t border-cream-dark/30">
      <div className="flex items-center gap-2 text-xs text-charcoal/50">
        <History className="w-3 h-3" />
        <span>打码处理台账</span>
      </div>
      <div className="space-y-1.5">
        {(asset.blurLogs || []).slice().reverse().map((log) => {
          const label = getActionLabel(log.action)
          return (
            <div key={log.id} className="flex items-start gap-2 text-xs">
              <span className="text-charcoal/40 font-mono w-[90px] shrink-0">{formatTime(log.timestamp)}</span>
              <span className={`font-medium ${label.color} shrink-0 w-[70px]`}>{label.text}</span>
              <span className="text-charcoal/70">{log.operator}</span>
              {log.reason && <span className="text-charcoal/50 ml-2">· {log.reason}</span>}
            </div>
          )
        })}
      </div>
      {(!asset.blurLogs || asset.blurLogs.length === 0) && (
        <div className="text-xs text-charcoal/40">暂无打码记录</div>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title">合规审核</h1>
        <p className="text-charcoal/60 mt-1">审核素材合规性与顾客授权状态</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-warn" />
          <div>
            <p className="text-sm text-charcoal/60">待审核</p>
            <p className="text-xl font-semibold text-charcoal">{totalPending}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <EyeOff className="w-5 h-5 text-amber-warn" />
          <div>
            <p className="text-sm text-charcoal/60">打码待确认</p>
            <p className="text-xl font-semibold text-charcoal">{blurredPending.length}</p>
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
                    <td className="p-3">{renderMedia(a)}</td>
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
            <span className="badge-pending text-xs">{blurredPending.length}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedBlur ? 'rotate-180' : ''}`} />
          </button>
          {expandedBlur && (
            <div className="card mt-3 space-y-3 p-4">
              {blurredPending.map((a) => (
                <div key={a.id} className="border-b border-cream-dark/30 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {renderMedia(a)}
                      <div className="absolute -top-1 -right-1 bg-amber-warn rounded-full p-0.5">
                        <EyeOff className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal text-sm">
                        {a.customerName} - {a.treatmentProject}
                        {a.mediaType === 'video' && <span className="ml-2 text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">视频</span>}
                      </p>
                      <p className="text-xs text-charcoal/50">
                        {a.phase === 'pre-op' ? '术前' : '术后'} · 打码区域: {a.blurAreas.length}处
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedLogs(expandedLogs === a.id ? null : a.id)}
                        className="btn-ghost flex items-center gap-1 px-2 py-1 text-xs"
                        title="查看打码台账"
                      >
                        <History className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleBlurApprove(a.id)}
                        className="btn-primary flex items-center gap-1 px-3 py-1 text-xs"
                      >
                        <Check className="w-3 h-3" /> 确认
                      </button>
                      <button
                        onClick={() => openRejectModal(a.id)}
                        className="btn-ghost flex items-center gap-1 px-3 py-1 text-xs"
                      >
                        <X className="w-3 h-3" /> 退回
                      </button>
                    </div>
                  </div>
                  {expandedLogs === a.id && renderLogs(a)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {blurredRejected.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setExpandedRejectedBlur(!expandedRejectedBlur)}
            className="section-title flex items-center gap-2 cursor-pointer"
          >
            <X className="w-5 h-5 text-rose-gold" />
            打码已退回
            <span className="badge-rejected text-xs">{blurredRejected.length}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedRejectedBlur ? 'rotate-180' : ''}`} />
          </button>
          {expandedRejectedBlur && (
            <div className="card mt-3 space-y-3 p-4 bg-rose-gold/5">
              {blurredRejected.map((a) => (
                <div key={a.id} className="border-b border-cream-dark/30 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {renderMedia(a, 'w-12 h-12')}
                      <div className="absolute -top-1 -right-1 bg-rose-gold rounded-full p-0.5">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal text-sm">
                        {a.customerName} - {a.treatmentProject}
                        {a.mediaType === 'video' && <span className="ml-2 text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">视频</span>}
                      </p>
                      <p className="text-xs text-rose-gold">
                        退回原因：{a.blurRejectReason || '打码不符合规范，请重新处理后再次提交'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedLogs(expandedLogs === a.id ? null : a.id)}
                        className="btn-ghost flex items-center gap-1 px-2 py-1 text-xs"
                        title="查看打码台账"
                      >
                        <History className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleBlurResubmit(a.id)}
                        className="btn-secondary flex items-center gap-1 px-3 py-1 text-xs"
                      >
                        <RefreshCw className="w-3 h-3" /> 重新提交打码
                      </button>
                    </div>
                  </div>
                  {expandedLogs === a.id && renderLogs(a)}
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
                  {renderMedia(a)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal text-sm">
                      {a.customerName} - {a.treatmentProject}
                      {a.mediaType === 'video' && <span className="ml-2 text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">视频</span>}
                    </p>
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

      {rejectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setRejectModalOpen(null) }}
        >
          <div className="bg-cream rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-charcoal font-display mb-4">退回打码</h3>
          <p className="text-sm text-charcoal/60 mb-4">请填写退回原因，方便运营同事重新处理</p>
          <textarea
            className="input-field min-h-[100px] resize-y"
            placeholder="例如：眼睛部位打码不够彻底"
            value={rejectReason[rejectModalOpen] || ''}
            onChange={(e) => setRejectReason(prev => ({ ...prev, [rejectModalOpen]: e.target.value }))}
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setRejectModalOpen(null)}
              className="btn-secondary px-4 py-2 text-sm"
            >
              取消
            </button>
            <button
              onClick={() => handleBlurRejectConfirm(rejectModalOpen)}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              <Send className="w-4 h-4" /> 确认退回
            </button>
          </div>
        </div>
        </div>
      )}

      <VideoPreviewModal
        isOpen={videoPreview.isOpen}
        onClose={() => setVideoPreview(prev => ({ ...prev, isOpen: false }))}
        videoUrl={videoPreview.url}
        title={videoPreview.title}
      />
    </div>
  )
}
