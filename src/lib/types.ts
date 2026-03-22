export interface Organization {
  id: string
  name: string
  address?: string
  city?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  organization_id: string
  name: string
  email: string
  card_id: string
  phone?: string
  membership_status: 'active' | 'inactive' | 'suspended'
  face_encoding?: string
  registered_at: string
  updated_at: string
}

export interface Entry {
  id: string
  organization_id: string
  camera_id: string
  member_id?: string
  entry_time: string
  is_member: boolean
  card_id?: string
  confidence_score?: number
}

export interface Alert {
  id: string
  organization_id: string
  alert_type: 'CARD_SHARING' | 'UNAUTHORIZED_ENTRY' | 'LOITERING' | 'SUSPICIOUS_BEHAVIOR'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  person_id?: string
  description: string
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
  created_at: string
  updated_at: string
}
