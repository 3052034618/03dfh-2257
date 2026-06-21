import { useState } from 'react'
import { X, Play } from 'lucide-react'
import type { CaseAsset } from '@/types'
import { VideoPreviewModal } from '@/components/VideoPreviewModal'

interface CompareModalProps {
  preOp: CaseAsset | undefined
  postOp: CaseAsset | undefined
  onClose: () => void
}

export default function CompareModal({ preOp, postOp, onClose }: CompareModalProps) {
  const [videoPreview, setVideoPreview] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' })

  if (!preOp && !postOp) return null

  const renderMedia = (asset: CaseAsset) => {
    if (asset.mediaType === 'video') {
      return (
        <div
          className="relative aspect-square rounded-xl overflow-hidden bg-cream-dark cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation()
            setVideoPreview({
              isOpen: true,
              url: asset.mediaUrl,
              title: `${asset.customerName} - ${asset.treatmentProject} (${asset.phase === 'pre-op' ? '术前' : '术后'})`,
            })
          }}
        >
          <img
            src={asset.thumbnailUrl}
            alt={asset.phase === 'pre-op' ? '术前' : '术后'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/50">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
            <span className="px-3 py-1 bg-black/60 text-white text-xs rounded-full font-medium">
              点击播放视频
            </span>
          </div>
          {asset.isBlurred && (
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30">
              <span className="text-white text-sm bg-charcoal/60 px-3 py-1.5 rounded-lg">
                敏感部位已打码
              </span>
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden bg-cream-dark">
        <img
          src={asset.mediaUrl}
          alt={asset.phase === 'pre-op' ? '术前' : '术后'}
          className="w-full h-full object-cover"
        />
        {asset.isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30">
            <span className="text-white text-sm bg-charcoal/60 px-3 py-1.5 rounded-lg">
              敏感部位已打码
            </span>
          </div>
        )}
      </div>
    )
  }

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
                  <>
                    <span className="text-xs text-charcoal/50">
                      {preOp.customerName} · {preOp.treatmentProject}
                    </span>
                    {preOp.mediaType === 'video' && (
                      <span className="text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full font-medium">
                        视频
                      </span>
                    )}
                  </>
                )}
              </div>
              {preOp ? (
                renderMedia(preOp)
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
                  <>
                    <span className="text-xs text-charcoal/50">
                      恢复 {postOp.recoveryDays} 天
                    </span>
                    {postOp.mediaType === 'video' && (
                      <span className="text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full font-medium">
                        视频
                      </span>
                    )}
                  </>
                )}
              </div>
              {postOp ? (
                renderMedia(postOp)
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

      <VideoPreviewModal
        isOpen={videoPreview.isOpen}
        onClose={() => setVideoPreview(prev => ({ ...prev, isOpen: false }))}
        videoUrl={videoPreview.url}
        title={videoPreview.title}
      />
    </div>
  )
}
