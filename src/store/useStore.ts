import { create } from 'zustand'
import type { CaseAsset, MaterialPackage, DownloadRequest } from '@/types'
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
