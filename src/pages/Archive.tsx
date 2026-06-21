import { useState, useMemo } from 'react'
import { Search, Filter, Clock, MessageSquare, ChevronRight, Eye, X, Edit3, Check, Play, CheckSquare, Square, Users, LayoutList, Shield, Settings2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { CaseAsset } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import CompareModal from '@/components/CompareModal'
import { VideoPreviewModal, VideoOverlay } from '@/components/VideoPreviewModal'

const statusOptions: { value: CaseAsset['authorizationStatus']; label: string }[] = [
  { value: 'authorized', label: '已授权' },
  { value: 'pending', label: '待授权' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'expired', label: '已过期' },
]

const CHANNELS = ['小红书', '抖音', '新氧', '美团', '线下门店', '私域社群', '微信公众号']

type ModalState =
  | { type: 'compare'; asset: CaseAsset }
  | { type: 'timeline'; asset: CaseAsset }
  | { type: 'comment'; asset: CaseAsset }
  | { type: 'batch' }
  | null

export default function Archive() {
  const { assets, updateAsset, batchUpdateAssets } = useStore()
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [editingComment, setEditingComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchMode, setBatchMode] = useState(false)
  const [batchFilter, setBatchFilter] = useState<'customer' | 'project'>('customer')
  const [videoPreview, setVideoPreview] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' })
  const [batchForm, setBatchForm] = useState({
    authorizationStatus: '' as CaseAsset['authorizationStatus'] | '',
    doctorComment: '',
    applicableChannels: [] as string[],
  })

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

  const customerGroups = useMemo(() => {
    const m = new Map<string, CaseAsset[]>()
    assets.forEach(a => {
      if (!m.has(a.customerId)) m.set(a.customerId, [])
      m.get(a.customerId)!.push(a)
    })
    return m
  }, [assets])

  const projectGroups = useMemo(() => {
    const m = new Map<string, CaseAsset[]>()
    assets.forEach(a => {
      if (!m.has(a.treatmentProject)) m.set(a.treatmentProject, [])
      m.get(a.treatmentProject)!.push(a)
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

  const openVideo = (a: CaseAsset) => {
    setVideoPreview({
      isOpen: true,
      url: a.mediaUrl,
      title: `${a.customerName} - ${a.treatmentProject}`,
    })
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)))
    }
  }

  const selectGroup = (key: string, type: 'customer' | 'project') => {
    const group = type === 'customer' ? customerGroups.get(key) : projectGroups.get(key)
    if (!group) return
    const groupIds = new Set(group.map(a => a.id))
    const allSelected = group.every(a => selectedIds.has(a.id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        groupIds.forEach(id => next.delete(id))
      } else {
        groupIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const handleBatchSubmit = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    const updates: Partial<CaseAsset> = {}
    if (batchForm.authorizationStatus) {
      updates.authorizationStatus = batchForm.authorizationStatus
      if (batchForm.authorizationStatus === 'authorized') {
        updates.reviewStatus = 'approved'
        updates.authorizationExpiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    }
    if (batchForm.doctorComment.trim()) {
      updates.doctorComment = batchForm.doctorComment.trim()
    }
    if (batchForm.applicableChannels.length > 0) {
      updates.applicableChannels = batchForm.applicableChannels
    }

    if (Object.keys(updates).length > 0) {
      batchUpdateAssets(ids, updates)
    }

    setSelectedIds(new Set())
    setBatchMode(false)
    setModal(null)
    setBatchForm({ authorizationStatus: '', doctorComment: '', applicableChannels: [] })
  }

  const toggleChannel = (channel: string) => {
    setBatchForm(prev => ({
      ...prev,
      applicableChannels: prev.applicableChannels.includes(channel)
        ? prev.applicableChannels.filter(c => c !== channel)
        : [...prev.applicableChannels, channel]
    }))
  }

  const pill = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${active ? 'bg-rose-gold text-white' : 'bg-charcoal/5 text-charcoal/60 hover:bg-charcoal/10'}`

  const preOp = modal?.type === 'compare' ? getGroup(modal.asset).find(a => a.phase === 'pre-op') : undefined
  const postOp = modal?.type === 'compare' ? getGroup(modal.asset).find(a => a.phase === 'post-op') : undefined
  const timelineItems = modal?.type === 'timeline'
    ? getGroup(modal.asset).filter(a => a.phase === 'post-op').sort((a, b) => a.recoveryDays - b.recoveryDays)
    : []

  const renderMedia = (asset: CaseAsset, onClick?: () => void) => {
    if (asset.mediaType === 'video') {
      return (
        <div
          className="relative aspect-[4/3] overflow-hidden cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation()
            if (onClick) onClick()
            openVideo(asset)
          }}
        >
          <img src={asset.thumbnailUrl} alt={asset.customerName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <VideoOverlay />
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${asset.phase === 'pre-op' ? 'bg-charcoal/70 text-white' : 'bg-rose-gold/90 text-white'}`}>
              {asset.phase === 'pre-op' ? '术前' : '术后'}
            </span>
            <span className="bg-rose-gold text-white text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
              <Play size={10} fill="white" />视频
            </span>
            {asset.recoveryDays > 0 && (
              <span className="bg-charcoal/70 text-white text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                <Clock size={10} />{asset.recoveryDays}天
              </span>
            )}
          </div>
        </div>
      )
    }
    return (
      <div
        className="relative aspect-[4/3] overflow-hidden"
        onClick={onClick}
      >
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
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">案例档案</h1>
          <p className="text-charcoal/50 text-sm mt-1">浏览和管理全部案例素材</p>
        </div>
        <button
          onClick={() => {
            setBatchMode(!batchMode)
            if (batchMode) setSelectedIds(new Set())
          }}
          className={`btn-secondary flex items-center gap-2 px-4 py-2 text-sm ${batchMode ? 'bg-rose-gold text-white border-rose-gold' : ''}`}
        >
          {batchMode ? <CheckSquare className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
          {batchMode ? '退出批量管理' : '批量管理'}
        </button>
      </div>

      {batchMode && selectedIds.size > 0 && (
        <div className="bg-rose-gold/5 border border-rose-gold/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-rose-gold" />
            <span className="text-sm text-charcoal font-medium">已选择 {selectedIds.size} 个素材</span>
          </div>
          <button
            onClick={() => setModal({ type: 'batch' })}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Edit3 className="w-4 h-4" />
            批量编辑
          </button>
        </div>
      )}

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

      {batchMode && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-charcoal">按分组快速选择</span>
            <div className="flex gap-2">
              <button
                onClick={() => setBatchFilter('customer')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${batchFilter === 'customer' ? 'bg-rose-gold text-white' : 'bg-charcoal/5 text-charcoal/60 hover:bg-charcoal/10'}`}
              >
                <Users className="w-3 h-3" />按顾客
              </button>
              <button
                onClick={() => setBatchFilter('project')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${batchFilter === 'project' ? 'bg-rose-gold text-white' : 'bg-charcoal/5 text-charcoal/60 hover:bg-charcoal/10'}`}
              >
                <LayoutList className="w-3 h-3" />按项目
              </button>
            </div>
            <button
              onClick={selectAllFiltered}
              className="text-xs text-rose-gold hover:text-rose-gold/80 ml-auto"
            >
              {selectedIds.size === filtered.length ? '取消全选' : '全选当前筛选'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {batchFilter === 'customer'
              ? Array.from(customerGroups.entries()).map(([cid, items]) => {
                  const customer = items[0]
                  const allSelected = items.every(a => selectedIds.has(a.id))
                  const someSelected = items.some(a => selectedIds.has(a.id))
                  return (
                    <button
                      key={cid}
                      onClick={() => selectGroup(cid, 'customer')}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                        allSelected
                          ? 'bg-rose-gold/10 border-rose-gold/30 text-rose-gold'
                          : someSelected
                          ? 'bg-amber-warn/10 border-amber-warn/30 text-amber-warn'
                          : 'bg-white border-charcoal/10 text-charcoal/60 hover:border-rose-gold/30'
                      }`}
                    >
                      {allSelected ? <CheckSquare className="w-3 h-3" /> : someSelected ? <Square className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                      {customer.customerName} ({items.length})
                    </button>
                  )
                })
              : Array.from(projectGroups.entries()).map(([project, items]) => {
                  const allSelected = items.every(a => selectedIds.has(a.id))
                  const someSelected = items.some(a => selectedIds.has(a.id))
                  return (
                    <button
                      key={project}
                      onClick={() => selectGroup(project, 'project')}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                        allSelected
                          ? 'bg-rose-gold/10 border-rose-gold/30 text-rose-gold'
                          : someSelected
                          ? 'bg-amber-warn/10 border-amber-warn/30 text-amber-warn'
                          : 'bg-white border-charcoal/10 text-charcoal/60 hover:border-rose-gold/30'
                      }`}
                    >
                      {allSelected ? <CheckSquare className="w-3 h-3" /> : someSelected ? <Square className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                      {project} ({items.length})
                    </button>
                  )
                })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-charcoal/30">未找到匹配的案例素材</div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {filtered.map(asset => (
          <div key={asset.id} className={`card overflow-hidden transition-all ${batchMode && selectedIds.has(asset.id) ? 'ring-2 ring-rose-gold' : ''}`}>
            {batchMode && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id) }}
                className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center rounded-md bg-white/90 hover:bg-white shadow-sm"
              >
                {selectedIds.has(asset.id) ? (
                  <CheckSquare className="w-5 h-5 text-rose-gold" />
                ) : (
                  <Square className="w-5 h-5 text-charcoal/30" />
                )}
              </button>
            )}
            {renderMedia(asset)}
            {asset.mediaType === 'photo' && (
              <div className="absolute top-2 right-2"><StatusBadge status={asset.authorizationStatus} /></div>
            )}
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
                        <div className="w-28 aspect-square rounded-xl overflow-hidden bg-cream-dark mb-3 relative group cursor-pointer" onClick={() => a.mediaType === 'video' && openVideo(a)}>
                          <img src={a.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          {a.mediaType === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center w-full">
                          <div className={`flex-1 h-0.5 ${i > 0 ? 'bg-rose-gold/30' : ''}`} />
                          <div className="w-4 h-4 rounded-full bg-rose-gold border-2 border-white shadow-sm z-10 flex-shrink-0" />
                          <div className={`flex-1 h-0.5 ${i < timelineItems.length - 1 ? 'bg-rose-gold/30' : ''}`} />
                        </div>
                        <p className="text-xs font-medium text-charcoal mt-2">{a.recoveryDays}天</p>
                        <p className="text-[10px] text-charcoal/40">{a.uploadDate}</p>
                        {a.mediaType === 'video' && (
                          <span className="text-[10px] bg-rose-gold/10 text-rose-gold px-1.5 py-0.5 rounded mt-1">视频</span>
                        )}
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

      {modal?.type === 'batch' && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center animate-fade-in" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-[90vw] max-h-[85vh] overflow-hidden shadow-2xl animate-slide-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/5">
              <div>
                <h3 className="section-title">批量编辑</h3>
                <p className="text-xs text-charcoal/50 mt-1">将修改 {selectedIds.size} 个素材</p>
              </div>
              <button onClick={() => setModal(null)} className="btn-ghost p-2 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal flex items-center gap-2">
                  <Shield className="w-4 h-4 text-charcoal/50" />授权状态
                </label>
                <select
                  className="select-field"
                  value={batchForm.authorizationStatus}
                  onChange={e => setBatchForm(prev => ({ ...prev, authorizationStatus: e.target.value as CaseAsset['authorizationStatus'] | '' }))}
                >
                  <option value="">不修改</option>
                  {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-charcoal/50" />医生点评
                </label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  placeholder="留空则不修改"
                  value={batchForm.doctorComment}
                  onChange={e => setBatchForm(prev => ({ ...prev, doctorComment: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-charcoal/50" />适用渠道
                </label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map(ch => (
                    <label
                      key={ch}
                      className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                        batchForm.applicableChannels.includes(ch)
                          ? 'bg-rose-gold/10 border-rose-gold/30 text-rose-gold'
                          : 'bg-white border-charcoal/10 text-charcoal/60 hover:border-rose-gold/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={batchForm.applicableChannels.includes(ch)}
                        onChange={() => toggleChannel(ch)}
                      />
                      {ch}
                    </label>
                  ))}
                </div>
                {batchForm.applicableChannels.length === 0 && (
                  <p className="text-xs text-charcoal/40">不选择则不修改适用渠道</p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-charcoal/5">
                <button
                  onClick={() => {
                    setModal(null)
                    setBatchForm({ authorizationStatus: '', doctorComment: '', applicableChannels: [] })
                  }}
                  className="btn-secondary px-5 py-2 text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchSubmit}
                  className="btn-primary px-5 py-2 text-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  确认修改
                </button>
              </div>
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
