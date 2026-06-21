import { useEffect, useRef, useState } from 'react'
import { X, Play, AlertTriangle, RotateCcw } from 'lucide-react'

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
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [isOpen, videoUrl, reloadKey])

  useEffect(() => {
    if (isOpen && videoRef.current && !hasError) {
      if (autoPlay) {
        videoRef.current.play().catch(() => {})
      }
    }
  }, [isOpen, autoPlay, videoUrl, reloadKey, hasError])

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

        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-rose-gold/20 border-t-rose-gold rounded-full animate-spin" />
                <span className="text-white/60 text-sm">视频加载中...</span>
              </div>
            </div>
          )}
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 p-8">
              <div className="flex flex-col items-center text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h4 className="text-white text-lg font-semibold mb-2 font-display">视频无法播放</h4>
                <p className="text-white/60 text-sm mb-5 leading-relaxed">
                  您的浏览器不支持该视频格式，或视频源地址无法访问。建议使用 Chrome / Edge 最新版本浏览器，或检查素材是否为有效的 MP4 / WebM 格式。
                </p>
                <button
                  onClick={() => {
                    setHasError(false)
                    setIsLoading(true)
                    setReloadKey((k) => k + 1)
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-gold hover:bg-rose-gold-dark text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新加载
                </button>
              </div>
            </div>
          ) : (
            <video
              key={reloadKey}
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
              playsInline
              onLoadedData={() => { setIsLoading(false); setHasError(false); }}
              onError={() => { setIsLoading(false); setHasError(true); }}
              onCanPlay={() => setIsLoading(false)}
            >
              您的浏览器不支持视频播放
            </video>
          )}
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
