// ============================
// Enums
// ============================

export type ShiftType = 'day' | 'eve' | 'night' | 'off'

export type MantraCategory = 'structure' | 'love' | 'ego' | 'five_percent'

export type ThemeFocus =
  | 'no_proving_bets'
  | 'no_emotional_all_in'
  | 'no_loss_recovery_fantasy'
  | 'no_structureless_running'
  | 'unsure_custom'

export type DecisionKind = 'buy' | 'sell'

export type AssetType = 'stock' | 'crypto' | 'etf' | 'other'

export type DecisionStatus = 'drafted' | 'cleared' | 'executed' | 'canceled'

export type StudyCategory = 'invest' | 'nursing' | 'coding' | 'english' | 'etc'

// ============================
// Table Row 타입
// ============================

export interface Profile {
  user_id: string
  display_name: string | null
  timezone: string
  onboarding_done: boolean
  created_at: string
}

export interface UserSettings {
  user_id: string
  focus: ThemeFocus
  anchor_main_text: string | null
  anchor_popup_text: string | null
  mantra_rotation_mode: string
  created_at: string
  updated_at: string
}

export interface Mantra {
  id: string
  user_id: string
  category: MantraCategory
  text: string
  is_active: boolean
  created_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  shift: ShiftType
  condition_score: number
  mood_tags: string[]
  note: string | null
  created_at: string
  updated_at: string
}

export interface DailyHabit {
  daily_log_id: string
  user_id: string
  exercise: boolean
  no_alcohol_snack: boolean
  focus_minutes: number
  study_done: boolean
  created_at: string
  updated_at: string
}

export interface SleepBlock {
  id: string
  user_id: string
  daily_log_id: string
  start_at: string
  end_at: string
  quality: number | null
  created_at: string
}

export interface StudyLog {
  id: string
  user_id: string
  daily_log_id: string
  category: StudyCategory
  minutes: number
  content: string | null
  created_at: string
}

export interface LocationLog {
  id: string
  user_id: string
  daily_log_id: string
  area_label: string | null
  lat: number
  lng: number
  accuracy_m: number | null
  created_at: string
}

export interface DecisionIntent {
  id: string
  user_id: string
  daily_log_id: string | null
  kind: DecisionKind
  asset: AssetType
  symbol: string
  amount_krw: number
  account_total_krw: number
  percent_of_account: number
  reasons: string[]
  is_structure: boolean
  rule_24h_ack: boolean
  rule_5pct_ack: boolean
  status: DecisionStatus
  executed_at: string | null
  created_at: string
}

// ============================
// Dream 관련 타입
// ============================

export type GoalSpan = 'yearly' | 'monthly'

export interface DreamEntry {
  id: string
  user_id: string
  date: string
  title: string | null
  content: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  span: GoalSpan
  target_date: string
  title: string
  description: string | null
  is_done: boolean
  created_at: string
  updated_at: string
}

// ============================
// Insert / Update 용 부분 타입
// ============================

export type ProfileInsert = Omit<Profile, 'created_at'>
export type ProfileUpdate = Partial<Omit<Profile, 'user_id' | 'created_at'>>

export type UserSettingsInsert = Omit<UserSettings, 'created_at' | 'updated_at'>
export type UserSettingsUpdate = Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>

export type DailyLogInsert = Omit<DailyLog, 'id' | 'created_at' | 'updated_at'>
export type DailyLogUpdate = Partial<Omit<DailyLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export type DailyHabitInsert = Omit<DailyHabit, 'created_at' | 'updated_at'>
export type DailyHabitUpdate = Partial<Omit<DailyHabit, 'daily_log_id' | 'user_id' | 'created_at' | 'updated_at'>>

export type SleepBlockInsert = Omit<SleepBlock, 'id' | 'created_at'>

export type StudyLogInsert = Omit<StudyLog, 'id' | 'created_at'>

export type LocationLogInsert = Omit<LocationLog, 'id' | 'created_at'>

export type DecisionIntentInsert = Omit<DecisionIntent, 'id' | 'created_at' | 'executed_at' | 'percent_of_account'>
export type DecisionIntentUpdate = Partial<Pick<DecisionIntent, 'status' | 'executed_at'>>

export type DreamEntryInsert = Omit<DreamEntry, 'id' | 'created_at' | 'updated_at'>
export type DreamEntryUpdate = Partial<Omit<DreamEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export type GoalInsert = Omit<Goal, 'id' | 'created_at' | 'updated_at'>
export type GoalUpdate = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
