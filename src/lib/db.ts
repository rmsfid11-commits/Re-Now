import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Profile, ProfileInsert, ProfileUpdate,
  UserSettings, UserSettingsInsert, UserSettingsUpdate,
  DailyLog, DailyLogInsert, DailyLogUpdate,
  DailyHabitInsert, DailyHabitUpdate,
  SleepBlock, SleepBlockInsert,
  StudyLog, StudyLogInsert,
  LocationLogInsert,
  DecisionIntent, DecisionIntentInsert, DecisionIntentUpdate, DecisionStatus,
  DreamEntry, DreamEntryInsert, DreamEntryUpdate,
  Goal, GoalInsert, GoalUpdate,
} from '@/types/database.types'

// 공통 에러 핸들링 헬퍼
function handleError(error: unknown, context: string): never {
  const message = error instanceof Error ? error.message : String(error)
  throw new Error(`[${context}] ${message}`)
}

// ============================
// Profile
// ============================

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') handleError(error, 'getProfile')
  return data as Profile | null
}

export async function upsertProfile(supabase: SupabaseClient, profile: ProfileInsert) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) handleError(error, 'upsertProfile')
  return data as Profile
}

export async function updateProfile(supabase: SupabaseClient, userId: string, updates: ProfileUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) handleError(error, 'updateProfile')
  return data as Profile
}

// ============================
// UserSettings
// ============================

export async function getUserSettings(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') handleError(error, 'getUserSettings')
  return data as UserSettings | null
}

export async function upsertUserSettings(supabase: SupabaseClient, settings: UserSettingsInsert) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(settings, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) handleError(error, 'upsertUserSettings')
  return data as UserSettings
}

export async function updateUserSettings(supabase: SupabaseClient, userId: string, updates: UserSettingsUpdate) {
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) handleError(error, 'updateUserSettings')
  return data as UserSettings
}

// ============================
// DailyLog
// ============================

export async function getDailyLog(supabase: SupabaseClient, userId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (error && error.code !== 'PGRST116') handleError(error, 'getDailyLog')
  return data as DailyLog | null
}

export async function upsertDailyLog(supabase: SupabaseClient, log: DailyLogInsert) {
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(log, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) handleError(error, 'upsertDailyLog')
  return data as DailyLog
}

export async function updateDailyLog(supabase: SupabaseClient, logId: string, updates: DailyLogUpdate) {
  const { data, error } = await supabase
    .from('daily_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single()

  if (error) handleError(error, 'updateDailyLog')
  return data as DailyLog
}

// ============================
// DailyHabit
// ============================

export async function upsertDailyHabits(supabase: SupabaseClient, habits: DailyHabitInsert) {
  const { data, error } = await supabase
    .from('daily_habits')
    .upsert(habits, { onConflict: 'daily_log_id,user_id' })
    .select()
    .single()

  if (error) handleError(error, 'upsertDailyHabits')
  return data
}

export async function updateDailyHabits(supabase: SupabaseClient, logId: string, userId: string, updates: DailyHabitUpdate) {
  const { data, error } = await supabase
    .from('daily_habits')
    .update(updates)
    .eq('daily_log_id', logId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) handleError(error, 'updateDailyHabits')
  return data
}

// ============================
// SleepBlock
// ============================

export async function addSleepBlock(supabase: SupabaseClient, block: SleepBlockInsert) {
  const { data, error } = await supabase
    .from('sleep_blocks')
    .insert(block)
    .select()
    .single()

  if (error) handleError(error, 'addSleepBlock')
  return data as SleepBlock
}

export async function getSleepBlocks(supabase: SupabaseClient, dailyLogId: string) {
  const { data, error } = await supabase
    .from('sleep_blocks')
    .select('*')
    .eq('daily_log_id', dailyLogId)
    .order('start_at', { ascending: true })

  if (error) handleError(error, 'getSleepBlocks')
  return data as SleepBlock[]
}

export async function deleteSleepBlock(supabase: SupabaseClient, blockId: string) {
  const { error } = await supabase
    .from('sleep_blocks')
    .delete()
    .eq('id', blockId)

  if (error) handleError(error, 'deleteSleepBlock')
}

// ============================
// StudyLog
// ============================

export async function addStudyLog(supabase: SupabaseClient, log: StudyLogInsert) {
  const { data, error } = await supabase
    .from('study_logs')
    .insert(log)
    .select()
    .single()

  if (error) handleError(error, 'addStudyLog')
  return data as StudyLog
}

export async function getStudyLogs(supabase: SupabaseClient, dailyLogId: string) {
  const { data, error } = await supabase
    .from('study_logs')
    .select('*')
    .eq('daily_log_id', dailyLogId)
    .order('created_at', { ascending: true })

  if (error) handleError(error, 'getStudyLogs')
  return data as StudyLog[]
}

// ============================
// LocationLog
// ============================

export async function addLocationLog(supabase: SupabaseClient, log: LocationLogInsert) {
  const { data, error } = await supabase
    .from('location_logs')
    .insert(log)
    .select()
    .single()

  if (error) handleError(error, 'addLocationLog')
  return data
}

// ============================
// DecisionIntent
// ============================

export async function createDecisionIntent(supabase: SupabaseClient, intent: DecisionIntentInsert) {
  const { data, error } = await supabase
    .from('decision_intents')
    .insert(intent)
    .select()
    .single()

  if (error) handleError(error, 'createDecisionIntent')
  return data as DecisionIntent
}

export async function updateDecisionStatus(
  supabase: SupabaseClient,
  intentId: string,
  status: DecisionStatus,
  executedAt?: string
) {
  const updates: DecisionIntentUpdate = { status }
  if (executedAt) updates.executed_at = executedAt

  const { data, error } = await supabase
    .from('decision_intents')
    .update(updates)
    .eq('id', intentId)
    .select()
    .single()

  if (error) handleError(error, 'updateDecisionStatus')
  return data as DecisionIntent
}

export async function getDecisionIntents(supabase: SupabaseClient, userId: string, dailyLogId?: string) {
  let query = supabase
    .from('decision_intents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (dailyLogId) {
    query = query.eq('daily_log_id', dailyLogId)
  }

  const { data, error } = await query

  if (error) handleError(error, 'getDecisionIntents')
  return data as DecisionIntent[]
}

// ============================
// DreamEntry
// ============================

export async function getDreamEntries(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('dream_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) handleError(error, 'getDreamEntries')
  return data as DreamEntry[]
}

export async function upsertDreamEntry(supabase: SupabaseClient, entry: DreamEntryInsert) {
  const { data, error } = await supabase
    .from('dream_entries')
    .upsert(entry, { onConflict: 'id' })
    .select()
    .single()

  if (error) handleError(error, 'upsertDreamEntry')
  return data as DreamEntry
}

export async function deleteDreamEntry(supabase: SupabaseClient, entryId: string) {
  const { error } = await supabase
    .from('dream_entries')
    .delete()
    .eq('id', entryId)

  if (error) handleError(error, 'deleteDreamEntry')
}

// ============================
// Goal
// ============================

export async function getGoals(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('target_date', { ascending: true })

  if (error) handleError(error, 'getGoals')
  return data as Goal[]
}

export async function upsertGoal(supabase: SupabaseClient, goal: GoalInsert) {
  const { data, error } = await supabase
    .from('goals')
    .upsert(goal, { onConflict: 'id' })
    .select()
    .single()

  if (error) handleError(error, 'upsertGoal')
  return data as Goal
}

export async function updateGoal(supabase: SupabaseClient, goalId: string, updates: GoalUpdate) {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single()

  if (error) handleError(error, 'updateGoal')
  return data as Goal
}

export async function deleteGoal(supabase: SupabaseClient, goalId: string) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)

  if (error) handleError(error, 'deleteGoal')
}

// ============================
// 초기 프로필 + 설정 자동 생성
// ============================

export async function ensureProfileAndSettings(supabase: SupabaseClient, userId: string) {
  // 프로필 확인 후 없으면 생성
  const profile = await getProfile(supabase, userId)
  if (!profile) {
    await upsertProfile(supabase, {
      user_id: userId,
      display_name: null,
      timezone: 'Asia/Seoul',
      onboarding_done: false,
    })
  }

  // 설정 확인 후 없으면 생성
  const settings = await getUserSettings(supabase, userId)
  if (!settings) {
    await upsertUserSettings(supabase, {
      user_id: userId,
      focus: 'unsure_custom',
      anchor_main_text: null,
      anchor_popup_text: null,
      mantra_rotation_mode: 'random',
    })
  }
}
