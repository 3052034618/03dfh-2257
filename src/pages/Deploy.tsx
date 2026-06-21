import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { CaseAsset, MaterialPackage } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import CompareModal from '@/components/CompareModal'
import { VideoPreviewModal, VideoOverlay } from '@/components/VideoPreviewModal'
import { Filter, Search, Package, Download, Check, X, ChevronDown, ChevronUp, Send, Eye, SlidersHorizontal, Play, Clock, TrendingUp } from 'lucide-react'
import { allChannels, treatmentProjects } from '@/data/mockData'

const ageGroups = ['18-30', '31-40', '41-50']

export default function Deploy() {
  const { assets, packages, downloadRequests, addPackage, updatePackage, updateDownloadRequest, createDownloadRequest, rejectDownloadRequest, approveDownloadRequestExtended } = useStore()
  const [filterOpen, setFilterOpen] = useState(true)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([])
  const [recoveryMin, setRecoveryMin] = useState('')
  const [recoveryMax, setRecoveryMax] = useState('')
  const [authOnly, setAuthOnly] = useState(true)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [canShowFace, setCanShowFace] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showPkgModal, setShowPkgModal] = useState(false)
  const [pkgName, setPkgName] = useState('')
  const [pkgChannels, setPkgChannels] = useState<string[]>([])
  const [compareAsset, setCompareAsset] = useState<CaseAsset | null>(null)
  const [searchText, setSearchText] = useState('')
  const [videoPreview, setVideoPreview] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' })
  const [appliedPkgIds, setAppliedPkgIds] = useState<Set<string>>(new Set())
  const [postCreateRequestModal, setPostCreateRequestModal] = useState<{ open: boolean; packageId: string; packageName: string; targetChannels: string[]; caseIds: string[] }>({ open: false, packageId: '', packageName: '', targetChannels: [], caseIds: [] })
  const [downloadRequestModal, setDownloadRequestModal] = useState<{ open: boolean; packageId: string; packageName: string; targetChannels: string[]; caseIds: string[] }>({ open: false, packageId: '', packageName: '', targetChannels: [], caseIds: [] })
  const [reqChannel, setReqChannel] = useState('')
  const [reqPlacementDate, setReqPlacementDate] = useState(new Date().toISOString().slice(0, 10))
  const [reqApplicant, setReqApplicant] = useState('当前用户')
  const [approvalTab, setApprovalTab] = useState<'pending' | 'all'>('pending')
  const [rejectModal, setRejectModal] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: '' })
  const [rejectReason, setRejectReason] = useState('')
  const [successToast, setSuccessToast] = useState('')

  const toggleFilterItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item])
  }

  const resetFilters = () => {
    setSelectedProjects([])
    setSelectedAgeGroups([])
    setRecoveryMin('')
    setRecoveryMax('')
    setAuthOnly(true)
    setSelectedChannels([])
    setCanShowFace(false)
    setSearchText('')
  }

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (a.reviewStatus !== 'approved') return false
      if (authOnly && a.authorizationStatus !== 'authorized') return false
      if (selectedProjects.length && !selectedProjects.includes(a.treatmentProject)) return false
      if (selectedAgeGroups.length && !selectedAgeGroups.includes(a.customerAgeGroup)) return false
      if (recoveryMin && a.recoveryDays < Number(recoveryMin)) return false
      if (recoveryMax && a.recoveryDays > Number(recoveryMax)) return false
      if (selectedChannels.length && !a.applicableChannels.some((c) => selectedChannels.includes(c))) return false
      if (canShowFace && !a.canShowFace) return false
      if (searchText && !a.customerName.includes(searchText) && !a.treatmentProject.includes(searchText) && !a.tags.some((t) => t.includes(searchText))) return false
      return true
    })
  }, [assets, selectedProjects, selectedAgeGroups, recoveryMin, recoveryMax, authOnly, selectedChannels, canShowFace, searchText])

  const findPreOp = (asset: CaseAsset) =>
    assets.find((a) => a.customerId === asset.customerId && a.treatmentProject === asset.treatmentProject && a.phase === 'pre-op')

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next)
  }

  const openVideo = (asset: CaseAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setVideoPreview({
      isOpen: true,
      url: asset.mediaUrl,
      title: `${asset.customerName} - ${asset.treatmentProject}`,
    })
  }

  const handleCreatePackage = () => {
    if (!pkgName.trim() || !pkgChannels.length) return
    const pkgId = 'PKG' + Date.now()
    const pkg: MaterialPackage = {
      id: pkgId,
      name: pkgName.trim(),
      caseIds: Array.from(selectedIds),
      createdBy: '当前用户',
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'pending',
      targetChannels: pkgChannels,
      downloadCount: 0,
    }
    addPackage(pkg)
    setSelectedIds(new Set())
    setShowPkgModal(false)
    setPkgName('')
    setPkgChannels([])
    setPostCreateRequestModal({
      open: true,
      packageId: pkgId,
      packageName: pkg.name,
      targetChannels: pkgChannels,
      caseIds: pkg.caseIds,
    })
    if (pkgChannels.length > 0) {
      setReqChannel(pkgChannels[0])
    }
  }

  const handleApproveDownload = (req: typeof downloadRequests[0]) => {
    approveDownloadRequestExtended(req.id, '当前用户')
    showToast('审批已通过')
  }

  const handleRejectClick = (requestId: string) => {
    setRejectModal({ open: true, requestId })
    setRejectReason('')
  }

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) return
    rejectDownloadRequest(rejectModal.requestId, rejectReason.trim(), '当前用户')
    setRejectModal({ open: false, requestId: '' })
    setRejectReason('')
    showToast('已拒绝申请')
  }

  const openDownloadRequestModal = (pkg: typeof packages[0]) => {
    setDownloadRequestModal({
      open: true,
      packageId: pkg.id,
      packageName: pkg.name,
      targetChannels: pkg.targetChannels,
      caseIds: pkg.caseIds,
    })
    if (pkg.targetChannels.length > 0) {
      setReqChannel(pkg.targetChannels[0])
    } else {
      setReqChannel('')
    }
    setReqPlacementDate(new Date().toISOString().slice(0, 10))
    setReqApplicant('当前用户')
  }

  const submitDownloadRequest = (packageId: string, packageName: string, caseIds: string[], targetChannels: string[]) => {
    if (!reqApplicant.trim()) return
    createDownloadRequest({
      packageId,
      packageName,
      caseIds,
      requestedBy: reqApplicant.trim(),
      channel: reqChannel || undefined,
      placementDate: reqPlacementDate || undefined,
      targetChannels: targetChannels,
    })
    setAppliedPkgIds((prev) => {
      const next = new Set(prev)
      next.add(packageId)
      return next
    })
    setTimeout(() => {
      setAppliedPkgIds((prev) => {
        const next = new Set(prev)
        next.delete(packageId)
        return next
      })
    }, 3000)
    showToast('申请已提交，等待审批')
  }

  const showToast = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(''), 2000)
  }

  const pendingRequests = downloadRequests.filter((r) => r.status === 'pending')
  const approvedRequests = downloadRequests.filter((r) => r.status === 'approved')
  const displayRequests = approvalTab === 'pending' ? pendingRequests : downloadRequests

  const totalDownloads = approvedRequests.length
  const totalPackages = packages.length
  const approvedPackages = packages.filter(p => p.status === 'approved').length
  const pendingCount = pendingRequests.length

  const channelTrackingData = useMemo(() => {
    const channelMap = new Map<string, { requestCount: number; packageIds: Set<string>; caseUsage: Map<string, number> }>()

    approvedRequests.forEach((req) => {
      const channel = req.channel || (req.targetChannels.length > 0 ? req.targetChannels[0] : '')
      if (!channel) return

      if (!channelMap.has(channel)) {
        channelMap.set(channel, { requestCount: 0, packageIds: new Set(), caseUsage: new Map() })
      }
      const data = channelMap.get(channel)!
      data.requestCount += 1
      data.packageIds.add(req.packageId)

      req.caseIds.forEach((cid) => {
        const current = data.caseUsage.get(cid) || 0
        data.caseUsage.set(cid, current + 1)
      })
    })

    return Array.from(channelMap.entries()).map(([channel, data]) => {
      const sortedCases = Array.from(data.caseUsage.entries())
        .map(([caseId, usageCount]) => {
          const asset = assets.find((a) => a.id === caseId)
          return { caseId, usageCount, asset }
        })
        .filter((item) => item.asset)
        .sort((a, b) => b.usageCount - a.usageCount)

      return {
        channel,
        packageCount: data.packageIds.size,
        downloadCount: data.requestCount,
        caseUsageCount: Array.from(data.caseUsage.values()).reduce((sum, c) => sum + c, 0),
        topCases: sortedCases,
      }
    })
  }, [approvedRequests, assets])

  const CheckboxItem = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-charcoal/70 hover:text-charcoal select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
          checked ? 'bg-rose-gold border-rose-gold text-white' : 'border-charcoal/20'
        }`}
      >
        {checked && <Check size={12} />}
      </span>
      <span className="select-none">{label}</span>
    </label>
  )

  const renderMedia = (asset: CaseAsset) => {
    if (asset.mediaType === 'video') {
      return (
        <div
          className="relative aspect-[4/3] bg-cream-dark cursor-pointer group"
          onClick={(e) => openVideo(asset, e)}
        >
          <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <VideoOverlay />
          <div className="absolute top-2 left-2 flex gap-1.5">
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
      <div className="relative aspect-[4/3] bg-cream-dark">
        <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        {asset.recoveryDays > 0 && (
          <div className="absolute top-2 left-2">
            <span className="bg-charcoal/70 text-white text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
              <Clock size={10} />{asset.recoveryDays}天
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-6 relative">
      {compareAsset && (
        <CompareModal preOp={findPreOp(compareAsset)} postOp={compareAsset} onClose={() => setCompareAsset(null)} />
      )}

      <div className={`transition-all duration-300 ${filterOpen ? 'w-72 min-w-[18rem]' : 'w-10 min-w-[2.5rem]'} flex-shrink-0`}>
        <button onClick={() => setFilterOpen(!filterOpen)} className="btn-ghost flex items-center gap-2 mb-4 text-charcoal/60 hover:text-charcoal">
          <SlidersHorizontal size={18} />
          {filterOpen && <span className="text-sm font-medium">筛选面板</span>}
          {filterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {filterOpen && (
          <div className="card p-4 space-y-5 sticky top-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
              <input className="input-field pl-9 w-full" placeholder="搜索客户/项目/标签" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>

            <div>
              <p className="text-xs font-semibold text-charcoal/50 mb-2">治疗项目</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {treatmentProjects.map((p) => (
                  <CheckboxItem key={p.id} checked={selectedProjects.includes(p.name)} onChange={() => toggleFilterItem(selectedProjects, setSelectedProjects, p.name)} label={p.name} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-charcoal/50 mb-2">年龄段</p>
              <div className="flex flex-wrap gap-3">
                {ageGroups.map((g) => (
                  <CheckboxItem key={g} checked={selectedAgeGroups.includes(g)} onChange={() => toggleFilterItem(selectedAgeGroups, setSelectedAgeGroups, g)} label={g} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-charcoal/50 mb-2">恢复天数</p>
              <div className="flex items-center gap-2">
                <input className="input-field w-full text-center" placeholder="最小" value={recoveryMin} onChange={(e) => setRecoveryMin(e.target.value)} />
                <span className="text-charcoal/30">—</span>
                <input className="input-field w-full text-center" placeholder="最大" value={recoveryMax} onChange={(e) => setRecoveryMax(e.target.value)} />
              </div>
            </div>

            <div>
              <CheckboxItem checked={authOnly} onChange={() => setAuthOnly(!authOnly)} label="仅已授权" />
            </div>

            <div>
              <p className="text-xs font-semibold text-charcoal/50 mb-2">适用渠道</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {allChannels.map((ch) => (
                  <CheckboxItem key={ch} checked={selectedChannels.includes(ch)} onChange={() => toggleFilterItem(selectedChannels, setSelectedChannels, ch)} label={ch} />
                ))}
              </div>
            </div>

            <div>
              <CheckboxItem checked={canShowFace} onChange={() => setCanShowFace(!canShowFace)} label="可露脸" />
            </div>

            <button onClick={resetFilters} className="btn-ghost w-full text-sm text-charcoal/50 hover:text-rose-gold">
              重置筛选
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">投放选用</h1>
            <p className="text-sm text-charcoal/50 mt-1">筛选可公开案例，生成投放素材包</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="card p-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-rose-gold" />
              <div>
                <p className="text-[10px] text-charcoal/50">素材包</p>
                <p className="text-sm font-semibold text-charcoal">{totalPackages}</p>
              </div>
            </div>
            <div className="card p-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald" />
              <div>
                <p className="text-[10px] text-charcoal/50">已通过</p>
                <p className="text-sm font-semibold text-charcoal">{approvedPackages}</p>
              </div>
            </div>
            <div className="card p-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-warn" />
              <div>
                <p className="text-[10px] text-charcoal/50">总下载</p>
                <p className="text-sm font-semibold text-charcoal">{totalDownloads}</p>
              </div>
            </div>
            <div className="card p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              <div>
                <p className="text-[10px] text-charcoal/50">待审批</p>
                <p className="text-sm font-semibold text-charcoal">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {filtered.map((asset) => {
            const preOp = findPreOp(asset)
            const isSelected = selectedIds.has(asset.id)
            return (
              <div key={asset.id} className={`card p-0 overflow-hidden transition-all ${isSelected ? 'ring-2 ring-rose-gold' : ''}`}>
                {renderMedia(asset)}
                <div className="relative">
                  {preOp && (
                    <div className="absolute -top-8 left-2 w-14 h-14 rounded-lg overflow-hidden border-2 border-white/80 shadow-md">
                      <img src={preOp.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      {preOp.mediaType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="absolute -top-8 right-2">
                    <StatusBadge status={asset.authorizationStatus} type="auth" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setCompareAsset(asset) }} className="absolute -top-8 right-14 bg-charcoal/60 hover:bg-charcoal/80 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 transition-colors">
                    <Eye size={12} /> 对比
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">
                        {asset.customerName} · {asset.treatmentProject}
                      </p>
                      <p className="text-xs text-charcoal/50">
                        {asset.customerAgeGroup} · 恢复 {asset.recoveryDays} 天
                        {asset.mediaType === 'video' && <span className="ml-2 text-rose-gold">· 视频</span>}
                      </p>
                      <p className="text-[10px] text-charcoal/40 flex items-center gap-1 mt-0.5">
                        <TrendingUp className="w-3 h-3" />使用 {asset.usageCount} 次
                        {asset.packageIds?.length > 0 && <span className="ml-2">· {asset.packageIds.length} 个素材包</span>}
                      </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id) }} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-rose-gold border-rose-gold text-white' : 'border-charcoal/20'}`}>
                      {isSelected && <Check size={14} />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] bg-cream text-charcoal/60 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-charcoal/30">
              <Filter size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">没有符合条件的案例</p>
            </div>
          )}
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2 mb-0"><Download size={18} /> 下载审批</h2>
            <div className="flex gap-1 bg-cream/50 rounded-lg p-1">
              <button
                onClick={() => setApprovalTab('pending')}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${approvalTab === 'pending' ? 'bg-white text-charcoal shadow-sm font-medium' : 'text-charcoal/50 hover:text-charcoal'}`}
              >
                待审批 ({pendingRequests.length})
              </button>
              <button
                onClick={() => setApprovalTab('all')}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${approvalTab === 'all' ? 'bg-white text-charcoal shadow-sm font-medium' : 'text-charcoal/50 hover:text-charcoal'}`}
              >
                全部 ({downloadRequests.length})
              </button>
            </div>
          </div>
          {displayRequests.length === 0 ? (
            <div className="card p-6 text-center text-charcoal/30 text-sm">暂无{approvalTab === 'pending' ? '待审批' : ''}请求</div>
          ) : (
            <div className="space-y-2">
              {displayRequests.map((req) => {
                const pkg = packages.find(p => p.id === req.packageId)
                const channelDisplay = req.channel
                  ? req.channel
                  : (req.targetChannels.length > 0 ? `${req.targetChannels[0]}等` : '未指定渠道')
                return (
                  <div key={req.id} className="card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-charcoal">{req.packageName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {req.status === 'pending' ? '待审批' : req.status === 'approved' ? '已通过' : '已拒绝'}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal/50">
                          {req.requestedBy} · {req.requestedAt.slice(0, 10)}
                          {pkg && <span className="ml-2">· {pkg.caseIds.length} 个案例</span>}
                        </p>
                        <div>
                          <p className="text-[10px] text-charcoal/40 mb-1">投放渠道：</p>
                          <span className="text-[10px] bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">{channelDisplay}</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-charcoal/40 mb-1">包含案例：</p>
                          {req.caseIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {req.caseIds.slice(0, 8).map((cid) => {
                                const c = assets.find(a => a.id === cid)
                                return c ? (
                                  <span key={cid} className="text-[10px] bg-cream text-charcoal/60 px-2 py-0.5 rounded-full">
                                    {c.customerName}
                                    {c.mediaType === 'video' && <span className="text-rose-gold ml-0.5">▶</span>}
                                  </span>
                                ) : null
                              })}
                              {req.caseIds.length > 8 && (
                                <span className="text-[10px] text-charcoal/40 px-2 py-0.5">+{req.caseIds.length - 8}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-charcoal/40">未知</span>
                          )}
                        </div>
                        {req.status === 'rejected' && req.rejectReason && (
                          <div className="bg-red-50 rounded-lg p-2">
                            <p className="text-[10px] text-red-600 font-medium">拒绝原因：</p>
                            <p className="text-xs text-red-700">{req.rejectReason}</p>
                          </div>
                        )}
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleApproveDownload(req)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><Check size={12} /> 批准</button>
                          <button onClick={() => handleRejectClick(req.id)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><X size={12} /> 拒绝</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title flex items-center gap-2 mb-4"><Package size={18} /> 素材包列表</h2>
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{pkg.name}</p>
                    <p className="text-xs text-charcoal/50">{pkg.createdBy} · {pkg.createdAt}</p>
                  </div>
                  <StatusBadge status={pkg.status} type="review" />
                </div>
                <div className="flex items-center justify-between text-xs text-charcoal/50">
                  <span>{pkg.caseIds.length} 个案例</span>
                  <span className="flex items-center gap-1"><Download size={12} /> {pkg.downloadCount} 次下载</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {pkg.targetChannels.map((ch) => (
                    <span key={ch} className="text-[10px] bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">{ch}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-charcoal/5">
                  <p className="text-[10px] text-charcoal/40 mb-1">包含案例：</p>
                  <div className="flex flex-wrap gap-1">
                    {pkg.caseIds.slice(0, 5).map((cid) => {
                      const c = assets.find(a => a.id === cid)
                      return c ? (
                        <span key={cid} className="text-[10px] bg-cream text-charcoal/60 px-1.5 py-0.5 rounded">
                          {c.customerName}
                          {c.mediaType === 'video' && <span className="text-rose-gold ml-0.5">▶</span>}
                        </span>
                      ) : null
                    })}
                    {pkg.caseIds.length > 5 && (
                      <span className="text-[10px] text-charcoal/40">+{pkg.caseIds.length - 5}</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-charcoal/5">
                  {pkg.status === 'rejected' ? (
                    <div className="space-y-1">
                      <button
                        disabled
                        className="w-full text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 bg-charcoal/5 text-charcoal/30 cursor-not-allowed"
                      >
                        <Download size={12} /> 申请投放
                      </button>
                      <p className="text-[10px] text-charcoal/30 text-center">素材包已拒绝</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={() => openDownloadRequestModal(pkg)}
                        disabled={appliedPkgIds.has(pkg.id)}
                        className={`w-full text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                          appliedPkgIds.has(pkg.id)
                            ? 'bg-emerald/10 text-emerald cursor-default'
                            : 'bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20'
                        }`}
                      >
                        {appliedPkgIds.has(pkg.id) ? (
                          <><Check size={12} /> 申请已提交</>
                        ) : (
                          <><Download size={12} /> 申请投放</>
                        )}
                      </button>
                      {pkg.status === 'pending' && (
                        <p className="text-[10px] text-amber-600/70 text-center">素材包待审批</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title flex items-center gap-2 mb-4"><TrendingUp size={18} /> 渠道投放追踪</h2>
          {channelTrackingData.length === 0 ? (
            <div className="card p-6 text-center text-charcoal/30 text-sm">暂无渠道投放数据</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {channelTrackingData.map((data) => (
                <div key={data.channel} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{data.channel}</p>
                      <p className="text-[10px] text-charcoal/40 mt-0.5">渠道投放统计</p>
                    </div>
                    <span className="text-[10px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded-full">
                      活跃渠道
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-cream/50 rounded-lg p-2">
                      <p className="text-[10px] text-charcoal/40">投放次数</p>
                      <p className="text-base font-semibold text-charcoal">{data.downloadCount}</p>
                    </div>
                    <div className="bg-cream/50 rounded-lg p-2">
                      <p className="text-[10px] text-charcoal/40">素材包数</p>
                      <p className="text-base font-semibold text-charcoal">{data.packageCount}</p>
                    </div>
                    <div className="bg-cream/50 rounded-lg p-2">
                      <p className="text-[10px] text-charcoal/40">案例使用</p>
                      <p className="text-base font-semibold text-charcoal">{data.caseUsageCount}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-charcoal/5">
                    <p className="text-[10px] text-charcoal/40 mb-2">渠道热门案例：</p>
                    <div className="flex flex-wrap gap-1">
                      {data.topCases.slice(0, 8).map((item) => (
                        <span key={item.caseId} className="text-[10px] bg-cream text-charcoal/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          {item.asset!.customerName}
                          {item.asset!.mediaType === 'video' && <span className="text-rose-gold">▶</span>}
                          <span className="text-rose-gold/70">×{item.usageCount}</span>
                        </span>
                      ))}
                      {data.topCases.length > 8 && (
                        <span className="text-[10px] text-charcoal/40 px-2 py-0.5">+{data.topCases.length - 8}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4 z-50 border border-charcoal/5">
          <span className="text-sm text-charcoal/70">已选 <strong className="text-rose-gold">{selectedIds.size}</strong> 个案例</span>
          <button onClick={() => setShowPkgModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Send size={14} /> 生成素材包
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="btn-ghost text-xs text-charcoal/50">取消</button>
        </div>
      )}

      {showPkgModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center" onClick={() => setShowPkgModal(false)}>
          <div className="bg-white rounded-2xl w-[480px] p-6 space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="section-title">创建素材包</h3>
              <button onClick={() => setShowPkgModal(false)} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">素材包名称</label>
              <input className="input-field w-full" placeholder="输入素材包名称" value={pkgName} onChange={(e) => setPkgName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">投放渠道</label>
              <div className="flex flex-wrap gap-2">
                {allChannels.map((ch) => {
                  const active = pkgChannels.includes(ch)
                  return (
                    <button key={ch} onClick={() => toggleFilterItem(pkgChannels, setPkgChannels, ch)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active ? 'bg-rose-gold text-white border-rose-gold' : 'border-charcoal/15 text-charcoal/60 hover:border-rose-gold/50'}`}>
                      {ch}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="bg-cream/50 rounded-lg p-3">
              <p className="text-xs text-charcoal/50 mb-2">已选案例预览</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedIds).slice(0, 8).map((cid) => {
                  const c = assets.find(a => a.id === cid)
                  return c ? (
                    <span key={cid} className="text-[10px] bg-white border border-charcoal/10 text-charcoal/70 px-2 py-1 rounded">
                      {c.customerName}
                      {c.mediaType === 'video' && <span className="text-rose-gold ml-0.5">▶</span>}
                    </span>
                  ) : null
                })}
                {selectedIds.size > 8 && (
                  <span className="text-[10px] text-charcoal/40 px-2 py-1">+{selectedIds.size - 8} 更多</span>
                )}
              </div>
            </div>
            <button onClick={handleCreatePackage} disabled={!pkgName.trim() || !pkgChannels.length} className="btn-primary w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              确认创建（{selectedIds.size} 个案例）
            </button>
          </div>
        </div>
      )}

      {postCreateRequestModal.open && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center" onClick={() => setPostCreateRequestModal({ ...postCreateRequestModal, open: false })}>
          <div className="bg-white rounded-2xl w-[480px] p-6 space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="section-title">素材包创建成功</h3>
              <button onClick={() => setPostCreateRequestModal({ ...postCreateRequestModal, open: false })} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
            </div>
            <p className="text-sm text-charcoal/70">是否立即申请投放下载？</p>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">素材包名称</label>
              <p className="text-sm text-charcoal bg-cream/50 rounded-lg px-3 py-2">{postCreateRequestModal.packageName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">投放渠道</label>
              <div className="flex flex-wrap gap-2">
                {postCreateRequestModal.targetChannels.map((ch) => {
                  const active = reqChannel === ch
                  return (
                    <button key={ch} onClick={() => setReqChannel(ch)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active ? 'bg-rose-gold text-white border-rose-gold' : 'border-charcoal/15 text-charcoal/60 hover:border-rose-gold/50'}`}>
                      {ch}
                    </button>
                  )
                })}
                {postCreateRequestModal.targetChannels.length === 0 && (
                  <select className="input-field w-full text-sm" value={reqChannel} onChange={(e) => setReqChannel(e.target.value)}>
                    <option value="">请选择渠道</option>
                    {allChannels.map((ch) => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">投放日期</label>
              <input type="date" className="input-field w-full text-sm" value={reqPlacementDate} onChange={(e) => setReqPlacementDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">申请人</label>
              <input className="input-field w-full text-sm" placeholder="请输入申请人" value={reqApplicant} onChange={(e) => setReqApplicant(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPostCreateRequestModal({ ...postCreateRequestModal, open: false })} className="btn-secondary flex-1 text-sm">
                稍后再说
              </button>
              <button
                onClick={() => {
                  submitDownloadRequest(
                    postCreateRequestModal.packageId,
                    postCreateRequestModal.packageName,
                    postCreateRequestModal.caseIds,
                    postCreateRequestModal.targetChannels,
                  )
                  setPostCreateRequestModal({ ...postCreateRequestModal, open: false })
                }}
                disabled={!reqApplicant.trim() || (!reqChannel && postCreateRequestModal.targetChannels.length === 0)}
                className="btn-primary flex-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                立即申请
              </button>
            </div>
          </div>
        </div>
      )}

      {downloadRequestModal.open && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center" onClick={() => setDownloadRequestModal({ ...downloadRequestModal, open: false })}>
          <div className="bg-white rounded-2xl w-[480px] p-6 space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="section-title">申请投放下载</h3>
              <button onClick={() => setDownloadRequestModal({ ...downloadRequestModal, open: false })} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">素材包名称</label>
              <p className="text-sm text-charcoal bg-cream/50 rounded-lg px-3 py-2">{downloadRequestModal.packageName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">投放渠道</label>
              {downloadRequestModal.targetChannels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {downloadRequestModal.targetChannels.map((ch) => {
                    const active = reqChannel === ch
                    return (
                      <button key={ch} onClick={() => setReqChannel(ch)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active ? 'bg-rose-gold text-white border-rose-gold' : 'border-charcoal/15 text-charcoal/60 hover:border-rose-gold/50'}`}>
                        {ch}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <select className="input-field w-full text-sm" value={reqChannel} onChange={(e) => setReqChannel(e.target.value)}>
                  <option value="">请选择渠道</option>
                  {allChannels.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">投放日期</label>
              <input type="date" className="input-field w-full text-sm" value={reqPlacementDate} onChange={(e) => setReqPlacementDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">申请人</label>
              <input className="input-field w-full text-sm" placeholder="请输入申请人" value={reqApplicant} onChange={(e) => setReqApplicant(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDownloadRequestModal({ ...downloadRequestModal, open: false })} className="btn-secondary flex-1 text-sm">
                取消
              </button>
              <button
                onClick={() => {
                  submitDownloadRequest(
                    downloadRequestModal.packageId,
                    downloadRequestModal.packageName,
                    downloadRequestModal.caseIds,
                    downloadRequestModal.targetChannels,
                  )
                  setDownloadRequestModal({ ...downloadRequestModal, open: false })
                }}
                disabled={!reqApplicant.trim()}
                className="btn-primary flex-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center" onClick={() => setRejectModal({ open: false, requestId: '' })}>
          <div className="bg-white rounded-2xl w-[400px] p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="section-title">拒绝申请</h3>
              <button onClick={() => setRejectModal({ open: false, requestId: '' })} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60 block mb-1.5">拒绝原因</label>
              <textarea
                className="input-field w-full text-sm min-h-[100px] resize-none"
                placeholder="请输入拒绝原因..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRejectModal({ open: false, requestId: '' })} className="btn-secondary flex-1 text-sm">
                取消
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="btn-primary flex-1 text-sm bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {successToast}
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
