import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { CaseAsset, MaterialPackage } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import CompareModal from '@/components/CompareModal'
import { Filter, Search, Package, Download, Check, X, ChevronDown, ChevronUp, Send, Eye, SlidersHorizontal } from 'lucide-react'
import { allChannels, treatmentProjects } from '@/data/mockData'

const ageGroups = ['18-30', '31-40', '41-50']

export default function Deploy() {
  const { assets, packages, downloadRequests, addPackage, updatePackage, updateDownloadRequest, incrementPackageUsage } = useStore()
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

  const handleCreatePackage = () => {
    if (!pkgName.trim() || !pkgChannels.length) return
    const pkg: MaterialPackage = {
      id: 'PKG' + Date.now(),
      name: pkgName.trim(),
      caseIds: Array.from(selectedIds),
      createdBy: '当前用户',
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'pending',
      targetChannels: pkgChannels,
      downloadCount: 0,
    }
    addPackage(pkg)
    incrementPackageUsage(Array.from(selectedIds), 1)
    setSelectedIds(new Set())
    setShowPkgModal(false)
    setPkgName('')
    setPkgChannels([])
  }

  const handleApproveDownload = (req: typeof downloadRequests[0]) => {
    updateDownloadRequest(req.id, { status: 'approved' })
    const pkg = packages.find((p) => p.id === req.packageId)
    if (pkg) {
      updatePackage(pkg.id, { downloadCount: pkg.downloadCount + 1 })
      incrementPackageUsage(pkg.caseIds, 1)
    }
  }

  const pendingRequests = downloadRequests.filter((r) => r.status === 'pending')

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
        <div>
          <h1 className="page-title">投放选用</h1>
          <p className="text-sm text-charcoal/50 mt-1">筛选可公开案例，生成投放素材包</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {filtered.map((asset) => {
            const preOp = findPreOp(asset)
            const isSelected = selectedIds.has(asset.id)
            return (
              <div key={asset.id} className={`card p-0 overflow-hidden transition-shadow ${isSelected ? 'ring-2 ring-rose-gold' : ''}`}>
                <div className="relative aspect-[4/3] bg-cream-dark">
                  <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  {preOp && (
                    <div className="absolute bottom-2 left-2 w-16 h-16 rounded-lg overflow-hidden border-2 border-white/80 shadow-md">
                      <img src={preOp.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={asset.authorizationStatus} type="auth" />
                  </div>
                  <button onClick={() => setCompareAsset(asset)} className="absolute bottom-2 right-2 bg-charcoal/60 hover:bg-charcoal/80 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                    <Eye size={12} /> 对比
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{asset.customerName} · {asset.treatmentProject}</p>
                      <p className="text-xs text-charcoal/50">{asset.customerAgeGroup} · 恢复 {asset.recoveryDays} 天</p>
                    </div>
                    <button onClick={() => toggleSelect(asset.id)} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-rose-gold border-rose-gold text-white' : 'border-charcoal/20'}`}>
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
          <h2 className="section-title flex items-center gap-2 mb-4"><Download size={18} /> 下载审批</h2>
          {pendingRequests.length === 0 ? (
            <div className="card p-6 text-center text-charcoal/30 text-sm">暂无待审批请求</div>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{req.packageName}</p>
                    <p className="text-xs text-charcoal/50">{req.requestedBy} · {req.requestedAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleApproveDownload(req)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><Check size={12} /> 批准</button>
                    <button onClick={() => updateDownloadRequest(req.id, { status: 'rejected' })} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><X size={12} /> 拒绝</button>
                  </div>
                </div>
              ))}
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
              </div>
            ))}
          </div>
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
            <button onClick={handleCreatePackage} disabled={!pkgName.trim() || !pkgChannels.length} className="btn-primary w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              确认创建（{selectedIds.size} 个案例）
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
