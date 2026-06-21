import { useEffect, useRef } from 'react'
import { X, Play } from 'lucide-react'

interface VideoPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title?: string
  autoPlay?: boolean
}

export function VideoPreviewModal({
  isOpen,
  onClose,
  videoUrl,
  title = '视频预览',
  autoPlay = false,
}: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && videoRef.current) {
      if (autoPlay) {
        videoRef.current.play().catch(() => {})
      }
    }
  }, [isOpen, autoPlay, videoUrl])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={containerRef}
        className="relative w-[90vw] max-w-4xl bg-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white font-display">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
            playsInline
          >
            您的浏览器不支持视频播放
          </video>
        </div>

        <div className="px-6 py-3 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Play className="w-4 h-4" />
            <span>视频素材</span>
          </div>
          <div className="text-white/40 text-xs">按 ESC 关闭</div>
        </div>
      </div>
    </div>
  )
}

export function VideoOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/50">
      <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
        <Play className="w-6 h-6 text-white fill-white ml-1" />
      </div>
      <span className="px-3 py-1 bg-black/60 text-white text-xs rounded-full font-medium">
        视频
      </span>
    </div>
  )
}
