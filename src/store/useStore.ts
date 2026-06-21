import { create } from 'zustand'
import type { CaseAsset, MaterialPackage, DownloadRequest, ComplianceNote } from '@/types'
import { caseAssets as initialAssets, materialPackages as initialPackages, downloadRequests as initialRequests } from '@/data/mockData'

const STORAGE_KEY = 'aesthecase-store-v1'

interface PersistedState {
  assets: CaseAsset[]
  packages: MaterialPackage[]
  downloadRequests: DownloadRequest[]
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function saveToStorage(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    // ignore
  }
}

const persisted = loadFromStorage()

function buildInitialAssets() {
  const assets = persisted?.assets || initialAssets
  const packages = persisted?.packages || initialPackages
  const pkgMap = new Map<string, string[]>()
  packages.forEach((pkg) => {
    pkg.caseIds.forEach((cid) => {
      if (!pkgMap.has(cid)) pkgMap.set(cid, [])
      pkgMap.get(cid)!.push(pkg.id)
    })
  })
  return assets.map((a) => ({
    ...a,
    packageIds: Array.from(new Set([...(a.packageIds || []), ...(pkgMap.get(a.id) || [])])),
  }))
}

interface AppState {
  assets: CaseAsset[]
  packages: MaterialPackage[]
  downloadRequests: DownloadRequest[]

  addAsset: (asset: CaseAsset) => void
  updateAsset: (id: string, updates: Partial<CaseAsset>) => void
  batchUpdateAssets: (ids: string[], updates: Partial<CaseAsset>) => void
  deleteAsset: (id: string) => void

  addPackage: (pkg: MaterialPackage) => void
  updatePackage: (id: string, updates: Partial<MaterialPackage>) => void

  addDownloadRequest: (req: DownloadRequest) => void
  updateDownloadRequest: (id: string, updates: Partial<DownloadRequest>) => void

  incrementUsageCount: (caseId: string, amount?: number) => void
  incrementPackageUsage: (caseIds: string[], amount?: number) => void
  addBlurLog: (caseId: string, log: Omit<import('@/types').BlurLog, 'id' | 'timestamp'>) => void
  addComplianceNote: (caseId: string, note: Omit<ComplianceNote, 'id' | 'timestamp'>) => void
  requestDownloadFromPackage: (packageId: string, requestedBy: string) => string
  createDownloadRequest: (data: { packageId: string; packageName: string; caseIds: string[]; requestedBy: string; channel?: string; placementDate?: string; targetChannels?: string[] }) => string
  rejectDownloadRequest: (requestId: string, rejectReason: string, operator: string) => void
  approveDownloadRequestExtended: (requestId: string, approvedBy: string) => void
  resetStore: () => void
}

export const useStore = create<AppState>((set) => {
  const initialAssets = buildInitialAssets()
  const baseState = {
    assets: initialAssets,
    packages: persisted?.packages || initialPackages,
    downloadRequests: persisted?.downloadRequests || initialRequests,
  }

  const persist = (state: PersistedState) => {
    saveToStorage(state)
    return state
  }

  return {
    ...baseState,

    addAsset: (asset) =>
      set((state) => {
        const next = { ...state, assets: [...state.assets, asset] }
        persist(next)
        return next
      }),

    updateAsset: (id, updates) =>
      set((state) => {
        const next = {
          ...state,
          assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }
        persist(next)
        return next
      }),

    batchUpdateAssets: (ids, updates) =>
      set((state) => {
        const next = {
          ...state,
          assets: state.assets.map((a) => (ids.includes(a.id) ? { ...a, ...updates } : a)),
        }
        persist(next)
        return next
      }),

    deleteAsset: (id) =>
      set((state) => {
        const next = { ...state, assets: state.assets.filter((a) => a.id !== id) }
        persist(next)
        return next
      }),

    addPackage: (pkg) =>
      set((state) => {
        const next = { ...state, packages: [...state.packages, pkg] }
        next.assets = next.assets.map((a) =>
          pkg.caseIds.includes(a.id)
            ? { ...a, packageIds: Array.from(new Set([...(a.packageIds || []), pkg.id])) }
            : a
        )
        persist(next)
        return next
      }),

    updatePackage: (id, updates) =>
      set((state) => {
        const next = {
          ...state,
          packages: state.packages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }
        persist(next)
        return next
      }),

    addDownloadRequest: (req) =>
      set((state) => {
        const next = { ...state, downloadRequests: [...state.downloadRequests, req] }
        persist(next)
        return next
      }),

    updateDownloadRequest: (id, updates) =>
      set((state) => {
        const next = {
          ...state,
          downloadRequests: state.downloadRequests.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }
        persist(next)
        return next
      }),

    incrementUsageCount: (caseId, amount = 1) =>
      set((state) => {
        const next = {
          ...state,
          assets: state.assets.map((a) =>
            a.id === caseId ? { ...a, usageCount: a.usageCount + amount } : a
          ),
        }
        persist(next)
        return next
      }),

    incrementPackageUsage: (caseIds, amount = 1) =>
      set((state) => {
        const next = {
          ...state,
          assets: state.assets.map((a) =>
            caseIds.includes(a.id) ? { ...a, usageCount: a.usageCount + amount } : a
          ),
        }
        persist(next)
        return next
      }),

    addBlurLog: (caseId, log) =>
      set((state) => {
        const newLog = {
          ...log,
          id: 'BL' + Date.now() + Math.random().toString(36).slice(2, 6),
          timestamp: new Date().toISOString(),
        }
        const next = {
          ...state,
          assets: state.assets.map((a) =>
            a.id === caseId ? { ...a, blurLogs: [...(a.blurLogs || []), newLog] } : a
          ),
        }
        persist(next)
        return next
      }),

    addComplianceNote: (caseId, note) =>
      set((state) => {
        const newNote: ComplianceNote = {
          ...note,
          id: 'CN' + Date.now() + Math.random().toString(36).slice(2, 6),
          timestamp: new Date().toISOString(),
        }
        const next = {
          ...state,
          assets: state.assets.map((a) =>
            a.id === caseId ? { ...a, complianceNotes: [...(a.complianceNotes || []), newNote] } : a
          ),
        }
        persist(next)
        return next
      }),

    requestDownloadFromPackage: (packageId, requestedBy) => {
      let newRequestId = ''
      set((state) => {
        const pkg = state.packages.find((p) => p.id === packageId)
        if (!pkg) return state
        newRequestId = 'DL' + Date.now() + Math.random().toString(36).slice(2, 6)
        const newRequest: DownloadRequest = {
          id: newRequestId,
          packageId: pkg.id,
          packageName: pkg.name,
          requestedBy,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          caseIds: pkg.caseIds,
          targetChannels: pkg.targetChannels,
        }
        const next = {
          ...state,
          downloadRequests: [...state.downloadRequests, newRequest],
        }
        persist(next)
        return next
      })
      return newRequestId
    },

    createDownloadRequest: (data) => {
      let newRequestId = ''
      set((state) => {
        const pkg = state.packages.find((p) => p.id === data.packageId)
        newRequestId = 'DL' + Date.now() + Math.random().toString(36).slice(2, 6)
        const newRequest: DownloadRequest = {
          id: newRequestId,
          packageId: data.packageId,
          packageName: data.packageName || pkg?.name || '',
          requestedBy: data.requestedBy,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          caseIds: data.caseIds.length > 0 ? data.caseIds : (pkg?.caseIds || []),
          targetChannels: data.targetChannels || (pkg?.targetChannels || []),
          channel: data.channel,
          placementDate: data.placementDate,
        }
        const next = {
          ...state,
          downloadRequests: [...state.downloadRequests, newRequest],
        }
        persist(next)
        return next
      })
      return newRequestId
    },

    rejectDownloadRequest: (requestId, reason, operator) =>
      set((state) => {
        const request = state.downloadRequests.find((r) => r.id === requestId)
        if (!request || request.status !== 'pending') return state
        const next = {
          ...state,
          downloadRequests: state.downloadRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'rejected' as const,
                  rejectReason: reason,
                  operator,
                }
              : r
          ),
        }
        persist(next)
        return next
      }),

    approveDownloadRequestExtended: (requestId, approvedBy) =>
      set((state) => {
        const request = state.downloadRequests.find((r) => r.id === requestId)
        if (!request || request.status === 'approved') return state
        const pkg = state.packages.find((p) => p.id === request.packageId)
        const finalCaseIds = request.caseIds.length > 0 ? request.caseIds : (pkg?.caseIds || [])
        const finalChannel = request.channel || (pkg?.targetChannels?.[0] || '')
        const next: PersistedState & Pick<AppState, keyof PersistedState> = {
          ...state,
          downloadRequests: state.downloadRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'approved' as const,
                  approvedAt: new Date().toISOString(),
                  approvedBy,
                  caseIds: finalCaseIds,
                  channel: finalChannel,
                  operator: approvedBy,
                }
              : r
          ),
          packages: state.packages.map((p) =>
            p.id === request.packageId ? { ...p, downloadCount: p.downloadCount + 1 } : p
          ),
          assets: state.assets.map((a) =>
            finalCaseIds.includes(a.id) ? { ...a, usageCount: a.usageCount + 1 } : a
          ),
        }
        persist(next)
        return next
      }),

    resetStore: () => {
      localStorage.removeItem(STORAGE_KEY)
      set({
        assets: buildInitialAssets(),
        packages: initialPackages,
        downloadRequests: initialRequests,
      })
    },
  }
})
