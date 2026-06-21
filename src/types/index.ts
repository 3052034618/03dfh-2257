export interface BlurArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'mosaic' | 'blur'
}

export interface BlurLog {
  id: string
  timestamp: string
  action: 'submit' | 'approve' | 'reject' | 'resubmit'
  operator: string
  reason?: string
}

export interface CaseAsset {
  id: string
  customerId: string
  customerName: string
  customerAge: number
  customerAgeGroup: string
  treatmentProject: string
  doctorName: string
  uploadDate: string
  mediaType: 'photo' | 'video'
  mediaUrl: string
  thumbnailUrl: string
  phase: 'pre-op' | 'post-op'
  recoveryDays: number
  shootAngle: string
  lightStandard: string
  canShowFace: boolean
  isBlurred: boolean
  blurAreas: BlurArea[]
  blurReviewStatus: 'pending' | 'approved' | 'rejected'
  blurLogs: BlurLog[]
  blurRejectReason: string
  authorizationStatus: 'authorized' | 'pending' | 'rejected' | 'expired'
  authorizationExpiry: string
  tags: string[]
  applicableChannels: string[]
  doctorComment: string
  consultationSummary: string
  usageCount: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  packageIds: string[]
}

export interface Customer {
  id: string
  name: string
  age: number
  ageGroup: string
}

export interface Doctor {
  id: string
  name: string
  department: string
}

export interface TreatmentProject {
  id: string
  name: string
  category: string
}

export interface MaterialPackage {
  id: string
  name: string
  caseIds: string[]
  createdBy: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  targetChannels: string[]
  downloadCount: number
}

export interface DownloadRequest {
  id: string
  packageId: string
  packageName: string
  requestedBy: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
}

export type AuthStatus = CaseAsset['authorizationStatus']
export type ReviewStatus = CaseAsset['reviewStatus']
export type Phase = CaseAsset['phase']
