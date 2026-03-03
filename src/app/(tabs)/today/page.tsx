'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import GlassCard from '@/components/GlassCard'
import {
  getDailyLog,
  upsertDailyLog,
  upsertDailyHabits,
  getSleepBlocks,
  addSleepBlock,
  deleteSleepBlock,
  getStudyLogs,
  addStudyLog,
  addLocationLog,
  getUserSettings,
} from '@/lib/db'
import type {
  ShiftType,
  StudyCategory,
  DailyLog,
  SleepBlock,
  StudyLog,
} from '@/types/database.types'

// ============================
// 상수
// ============================

const MOOD_OPTIONS = [
  '평온', '불안', '기쁨', '피로', '의욕',
  '우울', '감사', '분노', '외로움', '설렘',
] as const

const SHIFT_OPTIONS: { value: ShiftType; label: string }[] = [
  { value: 'day', label: '데이' },
  { value: 'eve', label: '이브닝' },
  { value: 'night', label: '나이트' },
  { value: 'off', label: '오프' },
]

const STUDY_CATEGORIES: { value: StudyCategory; label: string }[] = [
  { value: 'invest', label: '투자' },
  { value: 'nursing', label: '간호' },
  { value: 'coding', label: '코딩' },
  { value: 'english', label: '영어' },
  { value: 'etc', label: '기타' },
]

// ============================
// 헬퍼
// ============================

function todayString() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function calcSleepHours(blocks: SleepBlock[]) {
  let total = 0
  for (const b of blocks) {
    const start = new Date(b.start_at).getTime()
    const end = new Date(b.end_at).getTime()
    if (end > start) total += end - start
  }
  return (total / (1000 * 60 * 60)).toFixed(1)
}

// ============================
// 메인 컴포넌트
// ============================

export default function TodayPage() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [anchorText, setAnchorText] = useState<string | null>(null)

  // Daily Log
  const [dailyLogId, setDailyLogId] = useState<string | null>(null)
  const [shift, setShift] = useState<ShiftType>('day')
  const [conditionScore, setConditionScore] = useState(3)
  const [moodTags, setMoodTags] = useState<string[]>([])
  const [note, setNote] = useState('')

  // Habits
  const [exercise, setExercise] = useState(false)
  const [noAlcoholSnack, setNoAlcoholSnack] = useState(false)
  const [focusMinutes, setFocusMinutes] = useState(0)
  const [studyDone, setStudyDone] = useState(false)

  // Sleep
  const [sleepBlocks, setSleepBlocks] = useState<SleepBlock[]>([])
  const [showSleepForm, setShowSleepForm] = useState(false)
  const [sleepStart, setSleepStart] = useState('')
  const [sleepEnd, setSleepEnd] = useState('')
  const [sleepQuality, setSleepQuality] = useState(3)

  // Study
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([])
  const [showStudyForm, setShowStudyForm] = useState(false)
  const [studyCategory, setStudyCategory] = useState<StudyCategory>('invest')
  const [studyMinutes, setStudyMinutes] = useState(30)
  const [studyContent, setStudyContent] = useState('')

  // Location
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [areaLabel, setAreaLabel] = useState('')

  // 저장 상태 피드백
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({})

  const flash = useCallback((key: string, msg: string) => {
    setSaveStatus(prev => ({ ...prev, [key]: msg }))
    setTimeout(() => setSaveStatus(prev => ({ ...prev, [key]: '' })), 2000)
  }, [])

  // ============================
  // 초기 데이터 로딩
  // ============================

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // 설정 가져오기
      const settings = await getUserSettings(supabase, user.id)
      if (settings?.anchor_main_text) {
        setAnchorText(settings.anchor_main_text)
      }

      // 오늘 일지
      const date = todayString()
      const log = await getDailyLog(supabase, user.id, date)

      if (log) {
        setDailyLogId(log.id)
        setShift(log.shift)
        setConditionScore(log.condition_score)
        setMoodTags(log.mood_tags || [])
        setNote(log.note || '')

        // 습관
        const { data: habits } = await supabase
          .from('daily_habits')
          .select('*')
          .eq('daily_log_id', log.id)
          .eq('user_id', user.id)
          .single()

        if (habits) {
          setExercise(habits.exercise)
          setNoAlcoholSnack(habits.no_alcohol_snack)
          setFocusMinutes(habits.focus_minutes)
          setStudyDone(habits.study_done)
        }

        // 수면
        const blocks = await getSleepBlocks(supabase, log.id)
        setSleepBlocks(blocks)

        // 공부
        const logs = await getStudyLogs(supabase, log.id)
        setStudyLogs(logs)
      }

      setLoading(false)
    }

    init()
  }, [supabase])

  // ============================
  // Daily Log 저장 (+ daily_log_id 반환)
  // ============================

  const ensureDailyLog = useCallback(async (): Promise<string | null> => {
    if (!userId) return null

    if (dailyLogId) return dailyLogId

    const log = await upsertDailyLog(supabase, {
      user_id: userId,
      date: todayString(),
      shift,
      condition_score: conditionScore,
      mood_tags: moodTags,
      note: note || null,
    })

    setDailyLogId(log.id)
    return log.id
  }, [userId, dailyLogId, supabase, shift, conditionScore, moodTags, note])

  // ============================
  // 저장 핸들러들
  // ============================

  const saveDailyLog = useCallback(async () => {
    if (!userId) return
    try {
      const log = await upsertDailyLog(supabase, {
        user_id: userId,
        date: todayString(),
        shift,
        condition_score: conditionScore,
        mood_tags: moodTags,
        note: note || null,
      })
      setDailyLogId(log.id)
      flash('daily', '저장 완료')
    } catch (e) {
      flash('daily', '저장 실패')
    }
  }, [userId, supabase, shift, conditionScore, moodTags, note, flash])

  const saveHabits = useCallback(async () => {
    if (!userId) return
    try {
      const logId = await ensureDailyLog()
      if (!logId) return

      await upsertDailyHabits(supabase, {
        daily_log_id: logId,
        user_id: userId,
        exercise,
        no_alcohol_snack: noAlcoholSnack,
        focus_minutes: focusMinutes,
        study_done: studyDone,
      })
      flash('habits', '저장 완료')
    } catch (e) {
      flash('habits', '저장 실패')
    }
  }, [userId, supabase, ensureDailyLog, exercise, noAlcoholSnack, focusMinutes, studyDone, flash])

  const handleAddSleep = useCallback(async () => {
    if (!userId || !sleepStart || !sleepEnd) return
    try {
      const logId = await ensureDailyLog()
      if (!logId) return

      const block = await addSleepBlock(supabase, {
        user_id: userId,
        daily_log_id: logId,
        start_at: sleepStart,
        end_at: sleepEnd,
        quality: sleepQuality,
      })
      setSleepBlocks(prev => [...prev, block])
      setShowSleepForm(false)
      setSleepStart('')
      setSleepEnd('')
      setSleepQuality(3)
      flash('sleep', '추가 완료')
    } catch (e) {
      flash('sleep', '추가 실패')
    }
  }, [userId, supabase, ensureDailyLog, sleepStart, sleepEnd, sleepQuality, flash])

  const handleDeleteSleep = useCallback(async (blockId: string) => {
    try {
      await deleteSleepBlock(supabase, blockId)
      setSleepBlocks(prev => prev.filter(b => b.id !== blockId))
      flash('sleep', '삭제 완료')
    } catch (e) {
      flash('sleep', '삭제 실패')
    }
  }, [supabase, flash])

  const handleAddStudy = useCallback(async () => {
    if (!userId) return
    try {
      const logId = await ensureDailyLog()
      if (!logId) return

      const log = await addStudyLog(supabase, {
        user_id: userId,
        daily_log_id: logId,
        category: studyCategory,
        minutes: studyMinutes,
        content: studyContent || null,
      })
      setStudyLogs(prev => [...prev, log])
      setShowStudyForm(false)
      setStudyCategory('invest')
      setStudyMinutes(30)
      setStudyContent('')
      flash('study', '추가 완료')
    } catch (e) {
      flash('study', '추가 실패')
    }
  }, [userId, supabase, ensureDailyLog, studyCategory, studyMinutes, studyContent, flash])

  const handleDeleteStudy = useCallback(async (studyId: string) => {
    try {
      const { error } = await supabase
        .from('study_logs')
        .delete()
        .eq('id', studyId)
      if (error) throw error
      setStudyLogs(prev => prev.filter(s => s.id !== studyId))
      flash('study', '삭제 완료')
    } catch (e) {
      flash('study', '삭제 실패')
    }
  }, [supabase, flash])

  const handleAddLocation = useCallback(async () => {
    if (!userId || !areaLabel.trim()) return
    try {
      const logId = await ensureDailyLog()
      if (!logId) return

      await addLocationLog(supabase, {
        user_id: userId,
        daily_log_id: logId,
        area_label: areaLabel.trim(),
        lat: 0,
        lng: 0,
        accuracy_m: null,
      })
      setShowLocationForm(false)
      setAreaLabel('')
      flash('location', '기록 완료')
    } catch (e) {
      flash('location', '기록 실패')
    }
  }, [userId, supabase, ensureDailyLog, areaLabel, flash])

  // ============================
  // 무드 태그 토글
  // ============================

  const toggleMood = useCallback((mood: string) => {
    setMoodTags(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    )
  }, [])

  // ============================
  // 렌더링
  // ============================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 mt-3">불러오는 중...</p>
      </div>
    )
  }

  if (!userId) return null

  const today = todayString()

  return (
    <div className="flex flex-col gap-4">
      {/* ========== 헤더 ========== */}
      <div className="text-center mb-2">
        <p className="text-xs text-gray-500 tracking-widest uppercase mb-1">
          2026 Theme: 설계
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          {anchorText || '그때 그 미래를 지킬 수 있는 사람이 되어라.'}
        </p>
        <p className="text-xs text-gray-500 mt-2">{today}</p>
      </div>

      {/* ========== 일일 기록 ========== */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">일일 기록</h2>
          {saveStatus.daily && (
            <span className="text-xs text-blue-400 animate-pulse">{saveStatus.daily}</span>
          )}
        </div>

        {/* 근무 */}
        <label className="text-sm text-gray-400 block mb-1">근무</label>
        <div className="flex gap-2 mb-4">
          {SHIFT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setShift(opt.value)}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                shift === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 컨디션 */}
        <label className="text-sm text-gray-400 block mb-1">
          컨디션 ({conditionScore}/5)
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={conditionScore}
          onChange={e => setConditionScore(Number(e.target.value))}
          className="w-full mb-4 accent-blue-500"
        />

        {/* 기분 태그 */}
        <label className="text-sm text-gray-400 block mb-1">기분</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {MOOD_OPTIONS.map(mood => (
            <button
              key={mood}
              onClick={() => toggleMood(mood)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                moodTags.includes(mood)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>

        {/* 메모 */}
        <label className="text-sm text-gray-400 block mb-1">메모</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="오늘 하루 한 줄..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-blue-500/50 placeholder:text-gray-600"
        />

        <button
          onClick={saveDailyLog}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
        >
          일일 기록 저장
        </button>
      </GlassCard>

      {/* ========== 습관 ========== */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">습관 체크</h2>
          {saveStatus.habits && (
            <span className="text-xs text-blue-400 animate-pulse">{saveStatus.habits}</span>
          )}
        </div>

        <div className="space-y-3">
          <ToggleItem label="운동" checked={exercise} onChange={setExercise} />
          <ToggleItem label="금주/금간식" checked={noAlcoholSnack} onChange={setNoAlcoholSnack} />
          <ToggleItem label="공부 완료" checked={studyDone} onChange={setStudyDone} />

          <div>
            <label className="text-sm text-gray-400 block mb-1">집중 시간 (분)</label>
            <input
              type="number"
              min={0}
              value={focusMinutes}
              onChange={e => setFocusMinutes(Math.max(0, Number(e.target.value)))}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <button
          onClick={saveHabits}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
        >
          습관 저장
        </button>
      </GlassCard>

      {/* ========== 수면 ========== */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">수면 기록</h2>
          {saveStatus.sleep && (
            <span className="text-xs text-blue-400 animate-pulse">{saveStatus.sleep}</span>
          )}
        </div>

        {sleepBlocks.length > 0 && (
          <div className="mb-3 space-y-2">
            {sleepBlocks.map(block => (
              <div
                key={block.id}
                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
              >
                <div className="text-sm text-gray-300">
                  <span>{formatTime(block.start_at)}</span>
                  <span className="text-gray-500 mx-1">~</span>
                  <span>{formatTime(block.end_at)}</span>
                  {block.quality != null && (
                    <span className="text-gray-500 ml-2">품질 {block.quality}/5</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSleep(block.id)}
                  className="text-red-400 hover:text-red-300 text-xs ml-2"
                >
                  삭제
                </button>
              </div>
            ))}
            <p className="text-xs text-gray-500">
              총 {calcSleepHours(sleepBlocks)}시간 / {sleepBlocks.length}블록
            </p>
          </div>
        )}

        {showSleepForm ? (
          <div className="space-y-2">
            <div>
              <label className="text-sm text-gray-400 block mb-1">시작</label>
              <input
                type="datetime-local"
                value={sleepStart}
                onChange={e => setSleepStart(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">종료</label>
              <input
                type="datetime-local"
                value={sleepEnd}
                onChange={e => setSleepEnd(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                수면 품질 ({sleepQuality}/5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={sleepQuality}
                onChange={e => setSleepQuality(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddSleep}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => setShowSleepForm(false)}
                className="flex-1 bg-white/5 border border-white/10 text-gray-400 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/10"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSleepForm(true)}
            className="w-full bg-white/5 border border-white/10 text-gray-400 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            + 수면 추가
          </button>
        )}
      </GlassCard>

      {/* ========== 공부 ========== */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">공부 기록</h2>
          {saveStatus.study && (
            <span className="text-xs text-blue-400 animate-pulse">{saveStatus.study}</span>
          )}
        </div>

        {studyLogs.length > 0 && (
          <div className="mb-3 space-y-2">
            {studyLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
              >
                <div className="text-sm text-gray-300">
                  <span className="text-blue-400 mr-2">
                    {STUDY_CATEGORIES.find(c => c.value === log.category)?.label || log.category}
                  </span>
                  <span>{log.minutes}분</span>
                  {log.content && (
                    <span className="text-gray-500 ml-2 truncate max-w-[120px] inline-block align-bottom">
                      {log.content}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteStudy(log.id)}
                  className="text-red-400 hover:text-red-300 text-xs ml-2"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        {showStudyForm ? (
          <div className="space-y-2">
            <div>
              <label className="text-sm text-gray-400 block mb-1">카테고리</label>
              <select
                value={studyCategory}
                onChange={e => setStudyCategory(e.target.value as StudyCategory)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
              >
                {STUDY_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">시간 (분)</label>
              <input
                type="number"
                min={1}
                value={studyMinutes}
                onChange={e => setStudyMinutes(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">내용 (선택)</label>
              <textarea
                value={studyContent}
                onChange={e => setStudyContent(e.target.value)}
                placeholder="무엇을 공부했나요?"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-blue-500/50 placeholder:text-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddStudy}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => setShowStudyForm(false)}
                className="flex-1 bg-white/5 border border-white/10 text-gray-400 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/10"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowStudyForm(true)}
            className="w-full bg-white/5 border border-white/10 text-gray-400 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            + 공부 추가
          </button>
        )}
      </GlassCard>

      {/* ========== 위치 ========== */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">위치 기록</h2>
          {saveStatus.location && (
            <span className="text-xs text-blue-400 animate-pulse">{saveStatus.location}</span>
          )}
        </div>

        {showLocationForm ? (
          <div className="space-y-2">
            <div>
              <label className="text-sm text-gray-400 block mb-1">장소명</label>
              <input
                type="text"
                value={areaLabel}
                onChange={e => setAreaLabel(e.target.value)}
                placeholder="예: 병원, 카페, 집..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder:text-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddLocation}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
              >
                기록
              </button>
              <button
                onClick={() => setShowLocationForm(false)}
                className="flex-1 bg-white/5 border border-white/10 text-gray-400 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/10"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLocationForm(true)}
            className="w-full bg-white/5 border border-white/10 text-gray-400 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            + 지금 위치 기록
          </button>
        )}
      </GlassCard>
    </div>
  )
}

// ============================
// 서브 컴포넌트
// ============================

function ToggleItem({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

function formatTime(isoOrLocal: string) {
  try {
    const d = new Date(isoOrLocal)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  } catch {
    return isoOrLocal
  }
}
