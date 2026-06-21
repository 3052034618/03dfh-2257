import { X } from 'lucide-react'
import type { CaseAsset } from '@/types'

interface CompareModalProps {
  preOp: CaseAsset | undefined
  postOp: CaseAsset | undefined
  onClose: () => void
}

export default function CompareModal({ preOp, postOp, onClose }: CompareModalProps) {
  if (!preOp && !postOp) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-5xl w-[90vw] max-h-[85vh] overflow-hidden shadow-2xl animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/5">
          <h3 className="section-title">前后对比</h3>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg hover:bg-charcoal/5">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-charcoal/10 text-charcoal text-xs px-3 py-1 rounded-full font-medium">
                  术前
                </span>
                {preOp && (
                  <span className="text-xs text-charcoal/50">
                    {preOp.customerName} · {preOp.treatmentProject}
                  </span>
                )}
              </div>
              {preOp ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-cream-dark">
                  <img
                    src={preOp.mediaUrl}
                    alt="术前"
                    className="w-full h-full object-cover"
                  />
                  {preOp.isBlurred && (
                    <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30">
                      <span className="text-white text-sm bg-charcoal/60 px-3 py-1.5 rounded-lg">
                        敏感部位已打码
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-cream-dark flex items-center justify-center">
                  <span className="text-charcoal/30 text-sm">暂无术前照片</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-rose-gold/10 text-rose-gold text-xs px-3 py-1 rounded-full font-medium">
                  术后
                </span>
                {postOp && (
                  <span className="text-xs text-charcoal/50">
                    恢复 {postOp.recoveryDays} 天
                  </span>
                )}
              </div>
              {postOp ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-cream-dark">
                  <img
                    src={postOp.mediaUrl}
                    alt="术后"
                    className="w-full h-full object-cover"
                  />
                  {postOp.isBlurred && (
                    <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30">
                      <span className="text-white text-sm bg-charcoal/60 px-3 py-1.5 rounded-lg">
                        敏感部位已打码
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-cream-dark flex items-center justify-center">
                  <span className="text-charcoal/30 text-sm">暂无术后照片</span>
                </div>
              )}
            </div>
          </div>
          {postOp?.doctorComment && (
            <div className="mt-6 p-4 bg-cream rounded-xl">
              <p className="text-xs text-charcoal/50 mb-1">医生点评</p>
              <p className="text-sm text-charcoal leading-relaxed">{postOp.doctorComment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
