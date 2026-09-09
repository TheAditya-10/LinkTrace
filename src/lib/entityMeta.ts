import {
  User,
  Phone,
  Car,
  MapPin,
  Building2,
  CalendarClock,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { EntityType, Priority, RiskLevel, EvidenceSourceType, EntityRole } from '@/types'

export const entityIcon: Record<EntityType, LucideIcon> = {
  person: User,
  phone: Phone,
  vehicle: Car,
  location: MapPin,
  organization: Building2,
  event: CalendarClock,
  account: Wallet,
}

export const entityColorVar: Record<EntityType, string> = {
  person: '#3b82f6',
  phone: '#a78bfa',
  vehicle: '#14b8a6',
  location: '#f97316',
  organization: '#ec4899',
  event: '#94a3b8',
  account: '#10b981',
}

export const entityLabel: Record<EntityType, string> = {
  person: 'Person',
  phone: 'Phone',
  vehicle: 'Vehicle',
  location: 'Location',
  organization: 'Organization',
  event: 'Event',
  account: 'Account',
}

export const riskColor: Record<RiskLevel, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

export const priorityColor: Record<Priority, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 35) return 'medium'
  return 'low'
}

export const roleColor: Record<EntityRole, string> = {
  accused: '#ef4444',
  suspect: '#f97316',
  victim: '#64748b',
  witness: '#0ea5e9',
}

export const roleLabel: Record<EntityRole, string> = {
  accused: 'Accused',
  suspect: 'Suspect',
  victim: 'Victim',
  witness: 'Witness',
}

export const evidenceSourceLabel: Record<EvidenceSourceType, string> = {
  FIR: 'FIR',
  CDR: 'Call Detail Record',
  Transaction: 'Financial Transaction',
  Surveillance: 'Surveillance Report',
  'Social Media': 'Social Media',
  'OCR Scan': 'OCR Scan',
  'Vehicle Registry': 'Vehicle Registry',
  'Location Log': 'Location Log',
}
