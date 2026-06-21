import { useState, useRef, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import type { CaseAsset } from '@/types'
import { treatmentProjects, doctors, allTags, shootAngles, lightStandards } from '@/data/mockData'
import { Upload, Image, Video, Tag, Archive, Eye, EyeOff, Plus, X, FileImage, Check, Loader2 } from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  type: 'photo' | 'video'
  progress: number
  preview: string
}

const PLACEHOLDER_IMG = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20beauty%20photo%20clinical&image_size=square'

function getAgeGroup(age: number): string {
  if (age <= 30) return '18-30'
  if (age <= 40) return '31-40'
  if (age <= 50) return '41-50'
  return '50+'
}

export default function Ingestion() {
  const addAsset = useStore((s) => s.addAsset)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [blurEnabled, setBlurEnabled] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    age: '',
    treatmentProject: '',
    doctorName: '',
    phase: 'pre-op' as 'pre-op' | 'post-op',
    recoveryDays: '',
    shootAngle: '',
    lightStandard: '',
    canShowFace: true,
    consultationSummary: '',
  })

  const updateField = <K extends keyof typeof form>(key: K, val: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const simulateUpload = useCallback((name: string, type: 'photo' | 'video') => {
    const id = 'F' + Date.now() + Math.random().toString(36).slice(2, 6)
    const file: UploadedFile = { id, name, type, progress: 0, preview: PLACEHOLDER_IMG }
    setFiles((prev) => [...prev, file])
    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: Math.min(f.progress + Math.random() * 25, 100) } : f
        )
      )
    }, 300)
    setTimeout(() => clearInterval(interval), 2000)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      Array.from(e.dataTransfer.files).forEach((f) => {
        const isVideo = f.type.startsWith('video')
        simulateUpload(f.name, isVideo ? 'video' : 'photo')
      })
    },
    [simulateUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      Array.from(e.target.files || []).forEach((f) => {
        const isVideo = f.type.startsWith('video')
        simulateUpload(f.name, isVideo ? 'video' : 'photo')
      })
      e.target.value = ''
    },
    [simulateUpload]
  )

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const addCustomTag = () => {
    const trimmed = customTag.trim()
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed])
    }
    setCustomTag('')
  }

  const handleSubmit = () => {
    if (!form.customerId || !form.customerName || !form.treatmentProject || !form.doctorName || files.length === 0) return
    setSubmitting(true)
    setTimeout(() => {
      const age = Number(form.age) || 0
      files.forEach((f) => {
        const asset: CaseAsset = {
          id: 'A' + Date.now() + Math.random().toString(36).slice(2, 5),
          customerId: form.customerId,
          customerName: form.customerName,
          customerAge: age,
          customerAgeGroup: getAgeGroup(age),
          treatmentProject: form.treatmentProject,
          doctorName: form.doctorName,
          uploadDate: new Date().toISOString().slice(0, 10),
          mediaType: f.type,
          mediaUrl: f.preview,
          thumbnailUrl: f.preview,
          phase: form.phase,
          recoveryDays: Number(form.recoveryDays) || 0,
          shootAngle: form.shootAngle,
          lightStandard: form.lightStandard,
          canShowFace: form.canShowFace,
          isBlurred: blurEnabled,
          blurAreas: [],
          authorizationStatus: 'pending',
          authorizationExpiry: '',
          tags: selectedTags,
          applicableChannels: [],
          doctorComment: '',
          consultationSummary: form.consultationSummary,
          usageCount: 0,
          reviewStatus: 'pending',
        }
        addAsset(asset)
      })
      setSubmitting(false)
      setFiles([])
      setSelectedTags([])
      setForm({ customerId: '', customerName: '', age: '', treatmentProject: '', doctorName: '', phase: 'pre-op', recoveryDays: '', shootAngle: '', lightStandard: '', canShowFace: true, consultationSummary: '' })
      setBlurEnabled(false)
    }, 600)
  }

  const archiveKey = `${form.customerId}-${form.treatmentProject}-${form.doctorName}-${form.recoveryDays}`
  const showArchivePreview = form.customerId && form.treatmentProject && form.doctorName

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-body">
      <div>
        <h1 className="page-title">素材入库</h1>
        <p className="text-charcoal/50 text-sm mt-1">上传术前术后素材，录入元数据并自动归档</p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2"><Upload size={20} /> 批量上传</h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragOver ? 'border-rose-gold bg-rose-gold/5' : 'border-charcoal/15 hover:border-rose-gold/50 hover:bg-cream-dark/50'
          }`}
        >
          <Upload size={32} className="mx-auto text-charcoal/30 mb-3" />
          <p className="text-sm text-charcoal/60">拖拽文件到此处，或点击选择文件</p>
          <p className="text-xs text-charcoal/30 mt-1">支持 JPG、PNG、MP4 等格式</p>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        </div>
        {files.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((f) => (
              <div key={f.id} className="relative group rounded-lg overflow-hidden border border-charcoal/5 bg-cream-dark/50">
                <img src={f.preview} alt={f.name} className={`w-full aspect-square object-cover ${blurEnabled ? 'blur-md' : ''}`} />
                <div className="absolute top-2 left-2 bg-charcoal/60 rounded-full p-1">
                  {f.type === 'photo' ? <Image size={12} className="text-white" /> : <Video size={12} className="text-white" />}
                </div>
                <button onClick={() => removeFile(f.id)} className="absolute top-2 right-2 bg-charcoal/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} className="text-white" />
                </button>
                {f.progress < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-charcoal/20 p-2">
                    <div className="h-1 bg-charcoal/10 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-gold rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                    </div>
                    <p className="text-[10px] text-white mt-1 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> {Math.round(f.progress)}%</p>
                  </div>
                )}
                {f.progress >= 100 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-emerald/70 p-1.5 text-center">
                    <Check size={12} className="text-white inline" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2"><FileImage size={20} /> 元数据录入</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div><label className="text-xs text-charcoal/50 mb-1 block">顾客编号</label><input className="input-field" value={form.customerId} onChange={(e) => updateField('customerId', e.target.value)} placeholder="C001" /></div>
          <div><label className="text-xs text-charcoal/50 mb-1 block">顾客姓名</label><input className="input-field" value={form.customerName} onChange={(e) => updateField('customerName', e.target.value)} placeholder="输入姓名" /></div>
          <div><label className="text-xs text-charcoal/50 mb-1 block">年龄</label><input type="number" className="input-field" value={form.age} onChange={(e) => updateField('age', e.target.value)} placeholder="25" /></div>
          <div><label className="text-xs text-charcoal/50 mb-1 block">治疗项目</label><select className="select-field" value={form.treatmentProject} onChange={(e) => updateField('treatmentProject', e.target.value)}><option value="">选择项目</option>{treatmentProjects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
          <div><label className="text-xs text-charcoal/50 mb-1 block">主刀医生</label><select className="select-field" value={form.doctorName} onChange={(e) => updateField('doctorName', e.target.value)}><option value="">选择医生</option>{doctors.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
          <div>
            <label className="text-xs text-charcoal/50 mb-1 block">术前/术后</label>
            <div className="flex gap-2 mt-0.5">
              {(['pre-op', 'post-op'] as const).map((v) => (
                <label key={v} className={`flex-1 text-center py-2.5 rounded-lg border text-sm cursor-pointer transition-all ${form.phase === v ? 'bg-rose-gold text-white border-rose-gold' : 'border-charcoal/10 text-charcoal/60 hover:border-rose-gold/40'}`}>
                  <input type="radio" className="hidden" checked={form.phase === v} onChange={() => updateField('phase', v)} />
                  {v === 'pre-op' ? '术前' : '术后'}
                </label>
              ))}
            </div>
          </div>
          <div><label className="text-xs text-charcoal/50 mb-1 block">恢复天数</label><input type="number" className="input-field" value={form.recoveryDays} onChange={(e) => updateField('recoveryDays', e.target.value)} placeholder="0" /></div>
          <div><label className="text-xs text-charcoal/50 mb-1 block">拍摄角度</label><select className="select-field" value={form.shootAngle} onChange={(e) => updateField('shootAngle', e.target.value)}><option value="">选择角度</option>{shootAngles.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
          <div><label className="text-xs text-charcoal/50 mb-1 block">光线标准</label><select className="select-field" value={form.lightStandard} onChange={(e) => updateField('lightStandard', e.target.value)}><option value="">选择光线</option>{lightStandards.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-charcoal/60">是否可露脸</span>
            <button onClick={() => updateField('canShowFace', !form.canShowFace)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.canShowFace ? 'bg-emerald' : 'bg-charcoal/20'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.canShowFace ? 'translate-x-5' : ''}`} />
            </button>
            {form.canShowFace ? <Eye size={16} className="text-emerald" /> : <EyeOff size={16} className="text-charcoal/30" />}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-charcoal/60">模糊/马赛克</span>
            <button onClick={() => setBlurEnabled(!blurEnabled)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${blurEnabled ? 'bg-rose-gold' : 'bg-charcoal/20'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${blurEnabled ? 'translate-x-5' : ''}`} />
            </button>
            {blurEnabled && <span className="text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full font-medium">模糊已启用</span>}
          </div>
        </div>
        <div><label className="text-xs text-charcoal/50 mb-1 block">面诊记录摘要</label><textarea className="input-field min-h-[80px] resize-y" value={form.consultationSummary} onChange={(e) => updateField('consultationSummary', e.target.value)} placeholder="输入面诊记录摘要..." /></div>
      </div>

      <div className="card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2"><Tag size={20} /> 项目标签</h2>
          <button onClick={() => setTagPickerOpen(!tagPickerOpen)} className="btn-ghost text-xs flex items-center gap-1"><Plus size={14} /> 添加标签</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 bg-blush/60 text-rose-gold-dark text-xs px-2.5 py-1 rounded-full">
              {tag}
              <button onClick={() => toggleTag(tag)}><X size={12} /></button>
            </span>
          ))}
          {selectedTags.length === 0 && <span className="text-xs text-charcoal/30">暂未选择标签</span>}
        </div>
        {tagPickerOpen && (
          <div className="border border-charcoal/5 rounded-lg p-3 space-y-3 bg-cream-light">
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedTags.includes(tag) ? 'bg-rose-gold text-white border-rose-gold' : 'border-charcoal/10 text-charcoal/60 hover:border-rose-gold/40'}`}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field text-xs flex-1" value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())} placeholder="输入自定义标签后回车" />
              <button onClick={addCustomTag} className="btn-secondary text-xs px-3">添加</button>
            </div>
          </div>
        )}
      </div>

      {showArchivePreview && (
        <div className="card p-6 space-y-3">
          <h2 className="section-title flex items-center gap-2"><Archive size={20} /> 自动归档预览</h2>
          <div className="bg-cream-dark/50 rounded-lg p-4 border border-charcoal/5">
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded text-xs font-medium">{form.customerId}</span>
              <span className="text-charcoal/70">{form.customerName}</span>
              <span className="text-charcoal/20">|</span>
              <span className="text-charcoal/70">{form.treatmentProject}</span>
              <span className="text-charcoal/20">|</span>
              <span className="text-charcoal/70">{form.doctorName}</span>
              <span className="text-charcoal/20">|</span>
              <span className="text-charcoal/70">恢复 {form.recoveryDays || 0} 天</span>
            </div>
            <p className="text-xs text-charcoal/40 mt-2">归档键: {archiveKey}</p>
            <div className="flex gap-2 mt-3">
              {files.slice(0, 4).map((f) => (
                <img key={f.id} src={f.preview} alt="" className={`w-12 h-12 rounded object-cover border border-charcoal/5 ${blurEnabled ? 'blur-sm' : ''}`} />
              ))}
              {files.length > 4 && <span className="text-xs text-charcoal/40 self-center">+{files.length - 4} 更多</span>}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-ghost" onClick={() => { setFiles([]); setSelectedTags([]) }}>清空</button>
        <button className="btn-primary flex items-center gap-2" onClick={handleSubmit} disabled={submitting || files.length === 0}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {submitting ? '提交中...' : '提交入库'}
        </button>
      </div>
    </div>
  )
}
