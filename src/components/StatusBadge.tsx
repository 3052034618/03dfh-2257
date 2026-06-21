import type { AuthStatus, ReviewStatus } from '@/types'

interface StatusBadgeProps {
  status: AuthStatus | ReviewStatus
  type?: 'auth' | 'review'
}

const authLabels: Record<AuthStatus, string> = {
  authorized: '已授权',
  pending: '待授权',
  rejected: '已拒绝',
  expired: '已过期',
}

const reviewLabels: Record<ReviewStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已退回',
}

export default function StatusBadge({ status, type = 'auth' }: StatusBadgeProps) {
  const label = type === 'auth' ? authLabels[status as AuthStatus] : reviewLabels[status as ReviewStatus]

  const badgeClass = {
    authorized: 'badge-authorized',
    approved: 'badge-authorized',
    pending: 'badge-pending',
    rejected: 'badge-rejected',
    expired: 'badge-expired',
  }[status] || 'badge-pending'

  return <span className={badgeClass}>{label}</span>
}
