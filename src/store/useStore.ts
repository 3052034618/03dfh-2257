import { create } from 'zustand'
import type { CaseAsset, MaterialPackage, DownloadRequest } from '@/types'
import { caseAssets as initialAssets, materialPackages as initialPackages, downloadRequests as initialRequests } from '@/data/mockData'

interface AppState {
  assets: CaseAsset[]
  packages: MaterialPackage[]
  downloadRequests: DownloadRequest[]

  addAsset: (asset: CaseAsset) => void
  updateAsset: (id: string, updates: Partial<CaseAsset>) => void
  deleteAsset: (id: string) => void

  addPackage: (pkg: MaterialPackage) => void
  updatePackage: (id: string, updates: Partial<MaterialPackage>) => void

  addDownloadRequest: (req: DownloadRequest) => void
  updateDownloadRequest: (id: string, updates: Partial<DownloadRequest>) => void
}

export const useStore = create<AppState>((set) => ({
  assets: initialAssets,
  packages: initialPackages,
  downloadRequests: initialRequests,

  addAsset: (asset) =>
    set((state) => ({ assets: [...state.assets, asset] })),

  updateAsset: (id, updates) =>
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  deleteAsset: (id) =>
    set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),

  addPackage: (pkg) =>
    set((state) => ({ packages: [...state.packages, pkg] })),

  updatePackage: (id, updates) =>
    set((state) => ({
      packages: state.packages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  addDownloadRequest: (req) =>
    set((state) => ({ downloadRequests: [...state.downloadRequests, req] })),

  updateDownloadRequest: (id, updates) =>
    set((state) => ({
      downloadRequests: state.downloadRequests.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
}))
