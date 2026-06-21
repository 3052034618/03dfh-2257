import { useState, useMemo } from 'react'
import { Search, Filter, Clock, MessageSquare, ChevronRight, Eye, X, Edit3, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { CaseAsset } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import CompareModal from '@/components/CompareModal'

const statusOptions: { value: CaseAsset['authorizationStatus']; label: string }[] = [
  { value: 'authorized', label: '已授权' },
  { value: 'pending', label: '待授权' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'expired', label: '已过期' },
]

type ModalState =
  | { type: 'compare'; asset: CaseAsset }
  | { type: 'timeline'; asset: CaseAsset }
  | { type: 'comment'; asset: CaseAsset }
  | null

export default function Archive() {
  const { assets, updateAsset } = useStore()
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [editingComment, setEditingComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const projects = useMemo(() => [...new Set(assets.map(a => a.treatmentProject))], [assets])
  const doctors = useMemo(() => [...new Set(assets.map(a => a.doctorName))], [assets])

  const grouped = useMemo(() => {
    const m = new Map<string, CaseAsset[]>()
    assets.forEach(a => {
      const k = `${a.customerId}-${a.treatmentProject}`
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(a)
    })
    return m
  }, [assets])

  const filtered = useMemo(() => assets.filter(a => {
    const q = search.toLowerCase()
    return (!q || a.customerName.toLowerCase().includes(q) || a.customerId.toLowerCase().includes(q))
      && (!filterProject || a.treatmentProject === filterProject)
      && (!filterDoctor || a.doctorName === filterDoctor)
      && (!filterStatus || a.authorizationStatus === filterStatus)
  }), [assets, search, filterProject, filterDoctor, filterStatus])

  const getGroup = (a: CaseAsset) => grouped.get(`${a.customerId}-${a.treatmentProject}`) || []

  const openCompare = (a: CaseAsset) => setModal({ type: 'compare', asset: a })
  const openTimeline = (a: CaseAsset) => setModal({ type: 'timeline', asset: a })
  const openComment = (a: CaseAsset) => {
    setCommentText(a.doctorComment)
    setEditingComment(false)
    setModal({ type: 'comment', asset: a })
  }

  const saveComment = () => {
    if (modal?.type === 'comment') {
      updateAsset(modal.asset.id, { doctorComment: commentText })
      setEditingComment(false)
      setModal(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pill = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${active ? 'bg-rose-gold text-white' : 'bg-charcoal/5 text-charcoal/60 hover:bg-charcoal/10'}`

  const preOp = modal?.type === 'compare' ? getGroup(modal.asset).find(a => a.phase === 'pre-op') : undefined
  const postOp = modal?.type === 'compare' ? getGroup(modal.asset).find(a => a.phase === 'post-op') : undefined
  const timelineItems = modal?.type === 'timeline'
    ? getGroup(modal.asset).filter(a => a.phase === 'post-op').sort((a, b) => a.recoveryDays - b.recoveryDays)
    : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">案例档案</h1>
        <p className="text-charcoal/50 text-sm mt-1">浏览和管理全部案例素材</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/30" />
        <input className="input-field pl-10" placeholder="搜索客户姓名或编号..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-charcoal/30 flex-shrink-0" />
          <span className="text-xs text-charcoal/40 w-6 flex-shrink-0">项目</span>
          <button className={pill(!filterProject)} onClick={() => setFilterProject('')}>全部</button>
          {projects.map(p => <button key={p} className={pill(filterProject === p)} onClick={() => setFilterProject(filterProject === p ? '' : p)}>{p}</button>)}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="invisible flex-shrink-0" />
          <span className="text-xs text-charcoal/40 w-6 flex-shrink-0">医生</span>
          <button className={pill(!filterDoctor)} onClick={() => setFilterDoctor('')}>全部</button>
          {doctors.map(d => <button key={d} className={pill(filterDoctor === d)} onClick={() => setFilterDoctor(filterDoctor === d ? '' : d)}>{d}</button>)}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="invisible flex-shrink-0" />
          <span className="text-xs text-charcoal/40 w-6 flex-shrink-0">状态</span>
          <button className={pill(!filterStatus)} onClick={() => setFilterStatus('')}>全部</button>
          {statusOptions.map(s => <button key={s.value} className={pill(filterStatus === s.value)} onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}>{s.label}</button>)}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-charcoal/30">未找到匹配的案例素材</div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {filtered.map(asset => (
          <div key={asset.id} className="card overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={asset.thumbnailUrl} alt={asset.customerName} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 flex gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${asset.phase === 'pre-op' ? 'bg-charcoal/70 text-white' : 'bg-rose-gold/90 text-white'}`}>
                  {asset.phase === 'pre-op' ? '术前' : '术后'}
                </span>
                {asset.recoveryDays > 0 && (
                  <span className="bg-charcoal/70 text-white text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                    <Clock size={10} />{asset.recoveryDays}天
                  </span>
                )}
              </div>
              <div className="absolute top-2 right-2"><StatusBadge status={asset.authorizationStatus} /></div>
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-charcoal text-sm">{asset.customerName}</span>
                  <span className="text-charcoal/40 text-xs ml-1.5">{asset.customerAgeGroup}岁</span>
                </div>
                <span className="text-charcoal/30 text-xs inline-flex items-center gap-1"><Eye size={12} />{asset.usageCount}</span>
              </div>
              <p className="text-xs text-charcoal/60">{asset.treatmentProject} · {asset.doctorName}</p>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map(t => <span key={t} className="bg-blush/40 text-charcoal/60 text-[10px] px-2 py-0.5 rounded-full">{t}</span>)}
              </div>
              <div className="flex gap-2 pt-1">
                <button className="btn-secondary text-xs px-2.5 py-1.5 inline-flex items-center gap-1" onClick={() => openCompare(asset)}><Eye size={12} />前后对比</button>
                <button className="btn-secondary text-xs px-2.5 py-1.5 inline-flex items-center gap-1" onClick={() => openTimeline(asset)}><Clock size={12} />恢复时间轴</button>
                <button className="btn-secondary text-xs px-2.5 py-1.5 inline-flex items-center gap-1" onClick={() => openComment(asset)}><MessageSquare size={12} />医生点评</button>
              </div>
              {asset.consultationSummary && (
                <div className="border-t border-charcoal/5 pt-2">
                  <button className="inline-flex items-center gap-1 text-xs text-charcoal/40 hover:text-charcoal/60" onClick={() => toggleExpand(asset.id)}>
                    <ChevronRight size={12} className={`transition-transform ${expandedIds.has(asset.id) ? 'rotate-90' : ''}`} />
                    问诊摘要
                  </button>
                  {expandedIds.has(asset.id) && <p className="text-xs text-charcoal/50 mt-1.5 leading-relaxed">{asset.consultationSummary}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal?.type === 'compare' && (
        <CompareModal preOp={preOp} postOp={postOp} onClose={() => setModal(null)} />
      )}

      {modal?.type === 'timeline' && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center animate-fade-in" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-[90vw] max-h-[70vh] overflow-hidden shadow-2xl animate-slide-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/5">
              <h3 className="section-title">恢复时间轴</h3>
              <button onClick={() => setModal(null)} className="btn-ghost p-2 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-charcoal/50 mb-4">{modal.asset.customerName} · {modal.asset.treatmentProject}</p>
              {timelineItems.length === 0 ? (
                <p className="text-center text-charcoal/30 py-8">暂无术后照片</p>
              ) : (
                <div className="overflow-x-auto pb-4">
                  <div className="inline-flex px-4">
                    {timelineItems.map((a, i) => (
                      <div key={a.id} className="flex flex-col items-center" style={{ minWidth: 150 }}>
                        <div className="w-28 aspect-square rounded-xl overflow-hidden bg-cream-dark mb-3">
                          <img src={a.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center w-full">
                          <div className={`flex-1 h-0.5 ${i > 0 ? 'bg-rose-gold/30' : ''}`} />
                          <div className="w-4 h-4 rounded-full bg-rose-gold border-2 border-white shadow-sm z-10 flex-shrink-0" />
                          <div className={`flex-1 h-0.5 ${i < timelineItems.length - 1 ? 'bg-rose-gold/30' : ''}`} />
                        </div>
                        <p className="text-xs font-medium text-charcoal mt-2">{a.recoveryDays}天</p>
                        <p className="text-[10px] text-charcoal/40">{a.uploadDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'comment' && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center animate-fade-in" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-[90vw] overflow-hidden shadow-2xl animate-slide-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/5">
              <h3 className="section-title">医生点评</h3>
              <button onClick={() => setModal(null)} className="btn-ghost p-2 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-charcoal/50">{modal.asset.customerName} · {modal.asset.treatmentProject}</p>
              {editingComment ? (
                <div className="space-y-3">
                  <textarea className="input-field min-h-[100px] resize-none" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="输入医生点评..." />
                  <div className="flex gap-2 justify-end">
                    <button className="btn-ghost px-4 py-2" onClick={() => setEditingComment(false)}>取消</button>
                    <button className="btn-primary px-4 py-2 inline-flex items-center gap-1" onClick={saveComment}><Check size={14} />保存</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-charcoal leading-relaxed">{modal.asset.doctorComment || '暂无点评'}</p>
                  <button className="btn-secondary px-4 py-2 inline-flex items-center gap-1" onClick={() => setEditingComment(true)}>
                    <Edit3 size={14} />{modal.asset.doctorComment ? '编辑点评' : '添加点评'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
