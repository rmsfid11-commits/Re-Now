'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  getDreamEntries,
  upsertDreamEntry,
  deleteDreamEntry,
  getGoals,
  upsertGoal,
  updateGoal,
  deleteGoal,
} from '@/lib/db'
import type { DreamEntry, Goal, GoalSpan } from '@/types/database.types'
import GlassCard from '@/components/GlassCard'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function DreamPage() {
  const supabase = createClient()

  // 상태
  const [userId, setUserId] = useState<string | null>(null)
  const [dreams, setDreams] = useState<DreamEntry[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  // 꿈 기록 폼
  const [showDreamForm, setShowDreamForm] = useState(false)
  const [editingDream, setEditingDream] = useState<DreamEntry | null>(null)
  const [dreamDate, setDreamDate] = useState(todayStr())
  const [dreamTitle, setDreamTitle] = useState('')
  const [dreamContent, setDreamContent] = useState('')

  // 목표 폼
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalFormSpan, setGoalFormSpan] = useState<GoalSpan>('yearly')
  const [goalTargetDate, setGoalTargetDate] = useState(todayStr())
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')

  // 펼침 상태
  const [expandedDream, setExpandedDream] = useState<string | null>(null)

  const fetchData = useCallback(async (uid: string) => {
    try {
      const [d, g] = await Promise.all([
        getDreamEntries(supabase, uid),
        getGoals(supabase, uid),
      ])
      setDreams(d)
      setGoals(g)
    } catch (e) {
      console.error('Dream 데이터 로드 실패:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        fetchData(data.user.id)
      } else {
        setLoading(false)
      }
    })
  }, [supabase, fetchData])

  // === 꿈 기록 CRUD ===

  function resetDreamForm() {
    setShowDreamForm(false)
    setEditingDream(null)
    setDreamDate(todayStr())
    setDreamTitle('')
    setDreamContent('')
  }

  function openEditDream(dream: DreamEntry) {
    setEditingDream(dream)
    setDreamDate(dream.date)
    setDreamTitle(dream.title || '')
    setDreamContent(dream.content)
    setShowDreamForm(true)
  }

  async function handleSaveDream() {
    if (!userId || !dreamContent.trim()) return
    try {
      if (editingDream) {
        await upsertDreamEntry(supabase, {
          ...editingDream,
          user_id: userId,
          date: dreamDate,
          title: dreamTitle.trim() || null,
          content: dreamContent.trim(),
        })
      } else {
        await upsertDreamEntry(supabase, {
          user_id: userId,
          date: dreamDate,
          title: dreamTitle.trim() || null,
          content: dreamContent.trim(),
        })
      }
      resetDreamForm()
      fetchData(userId)
    } catch (e) {
      console.error('꿈 저장 실패:', e)
    }
  }

  async function handleDeleteDream(id: string) {
    if (!userId) return
    try {
      await deleteDreamEntry(supabase, id)
      fetchData(userId)
    } catch (e) {
      console.error('꿈 삭제 실패:', e)
    }
  }

  // === 목표 CRUD ===

  function resetGoalForm() {
    setShowGoalForm(false)
    setGoalFormSpan('yearly')
    setGoalTargetDate(todayStr())
    setGoalTitle('')
    setGoalDesc('')
  }

  function openGoalForm(span: GoalSpan) {
    setGoalFormSpan(span)
    setShowGoalForm(true)
  }

  async function handleSaveGoal() {
    if (!userId || !goalTitle.trim()) return
    try {
      await upsertGoal(supabase, {
        user_id: userId,
        span: goalFormSpan,
        target_date: goalTargetDate,
        title: goalTitle.trim(),
        description: goalDesc.trim() || null,
        is_done: false,
      })
      resetGoalForm()
      fetchData(userId)
    } catch (e) {
      console.error('목표 저장 실패:', e)
    }
  }

  async function handleToggleDone(goal: Goal) {
    if (!userId) return
    try {
      await updateGoal(supabase, goal.id, { is_done: !goal.is_done })
      fetchData(userId)
    } catch (e) {
      console.error('목표 상태 변경 실패:', e)
    }
  }

  async function handleDeleteGoal(id: string) {
    if (!userId) return
    try {
      await deleteGoal(supabase, id)
      fetchData(userId)
    } catch (e) {
      console.error('목표 삭제 실패:', e)
    }
  }

  // 분류
  const yearlyGoals = goals.filter((g) => g.span === 'yearly')
  const monthlyGoals = goals.filter((g) => g.span === 'monthly')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-gray-400 text-sm">로그인이 필요합니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 헤더 */}
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-teal-400">Dream</h1>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          꿈과 목표를 기록하는 곳
        </p>
      </header>

      {/* ===== 꿈 기록 섹션 ===== */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-teal-300">꿈 기록</h2>
          <button
            onClick={() => { resetDreamForm(); setShowDreamForm(true) }}
            className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
          >
            새 꿈 기록
          </button>
        </div>

        {/* 꿈 기록 폼 */}
        {showDreamForm && (
          <GlassCard variant="mint" className="flex flex-col gap-3">
            <input
              type="date"
              value={dreamDate}
              onChange={(e) => setDreamDate(e.target.value)}
              className="bg-white/5 border border-teal-500/20 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-teal-400/50"
            />
            <input
              type="text"
              placeholder="제목 (선택)"
              value={dreamTitle}
              onChange={(e) => setDreamTitle(e.target.value)}
              className="bg-white/5 border border-teal-500/20 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-teal-400/50"
            />
            <textarea
              placeholder="꿈의 내용을 자유롭게 적어보세요..."
              value={dreamContent}
              onChange={(e) => setDreamContent(e.target.value)}
              className="bg-white/5 border border-teal-500/20 rounded-lg px-3 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-teal-400/50 min-h-[120px] leading-relaxed resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={resetDreamForm}
                className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveDream}
                disabled={!dreamContent.trim()}
                className="text-xs px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-40"
              >
                {editingDream ? '수정' : '저장'}
              </button>
            </div>
          </GlassCard>
        )}

        {/* 꿈 기록 목록 */}
        {dreams.length === 0 && !showDreamForm ? (
          <GlassCard variant="mint">
            <p className="text-sm text-gray-500 text-center py-4">
              아직 기록된 꿈이 없습니다
            </p>
          </GlassCard>
        ) : (
          dreams.map((dream) => (
            <GlassCard key={dream.id} variant="mint" className="flex flex-col gap-2">
              <button
                onClick={() =>
                  setExpandedDream(expandedDream === dream.id ? null : dream.id)
                }
                className="flex items-start justify-between text-left w-full"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-teal-400/70">{dream.date}</span>
                  {dream.title && (
                    <span className="text-sm font-medium text-gray-200">
                      {dream.title}
                    </span>
                  )}
                  {expandedDream !== dream.id && (
                    <span className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {dream.content}
                    </span>
                  )}
                </div>
                <span className="text-gray-500 text-xs mt-0.5 ml-2 shrink-0">
                  {expandedDream === dream.id ? '접기' : '펼치기'}
                </span>
              </button>

              {expandedDream === dream.id && (
                <div className="flex flex-col gap-3 pt-1">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {dream.content}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openEditDream(dream)}
                      className="text-xs px-3 py-1 rounded-lg text-teal-400 hover:bg-teal-500/10 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteDream(dream.id)}
                      className="text-xs px-3 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          ))
        )}
      </section>

      {/* ===== 목표 섹션 ===== */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-teal-300">목표</h2>

        {/* 목표 추가 폼 */}
        {showGoalForm && (
          <GlassCard variant="mint" className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setGoalFormSpan('yearly')}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  goalFormSpan === 'yearly'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                연간
              </button>
              <button
                onClick={() => setGoalFormSpan('monthly')}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  goalFormSpan === 'monthly'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                월간
              </button>
            </div>
            <input
              type="date"
              value={goalTargetDate}
              onChange={(e) => setGoalTargetDate(e.target.value)}
              className="bg-white/5 border border-teal-500/20 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-teal-400/50"
            />
            <input
              type="text"
              placeholder="목표 제목"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="bg-white/5 border border-teal-500/20 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-teal-400/50"
            />
            <textarea
              placeholder="설명 (선택)"
              value={goalDesc}
              onChange={(e) => setGoalDesc(e.target.value)}
              className="bg-white/5 border border-teal-500/20 rounded-lg px-3 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-teal-400/50 min-h-[80px] leading-relaxed resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={resetGoalForm}
                className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveGoal}
                disabled={!goalTitle.trim()}
                className="text-xs px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </GlassCard>
        )}

        {/* 연간 목표 */}
        <GoalSection
          label="연간 목표"
          goals={yearlyGoals}
          onAdd={() => openGoalForm('yearly')}
          onToggle={handleToggleDone}
          onDelete={handleDeleteGoal}
        />

        {/* 월간 목표 */}
        <GoalSection
          label="월간 목표"
          goals={monthlyGoals}
          onAdd={() => openGoalForm('monthly')}
          onToggle={handleToggleDone}
          onDelete={handleDeleteGoal}
        />
      </section>

      {/* 하단 여백 */}
      <div className="h-4" />
    </div>
  )
}

// 목표 서브 섹션 컴포넌트
function GoalSection({
  label,
  goals,
  onAdd,
  onToggle,
  onDelete,
}: {
  label: string
  goals: Goal[]
  onAdd: () => void
  onToggle: (goal: Goal) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">{label}</h3>
        <button
          onClick={onAdd}
          className="text-xs px-3 py-1 rounded-lg bg-teal-600/80 hover:bg-teal-700 text-white transition-colors"
        >
          목표 추가
        </button>
      </div>

      {goals.length === 0 ? (
        <GlassCard variant="mint">
          <p className="text-xs text-gray-500 text-center py-3">
            등록된 목표가 없습니다
          </p>
        </GlassCard>
      ) : (
        goals.map((goal) => (
          <GlassCard key={goal.id} variant="mint" className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggle(goal)}
                className={`mt-0.5 w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                  goal.is_done
                    ? 'bg-teal-500 border-teal-500'
                    : 'border-gray-500 hover:border-teal-400'
                }`}
              >
                {goal.is_done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${goal.is_done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                  {goal.title}
                </p>
                {goal.description && (
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {goal.description}
                  </p>
                )}
                <span className="text-xs text-teal-400/60 mt-1 block">
                  {goal.target_date}
                </span>
              </div>
              <button
                onClick={() => onDelete(goal.id)}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors shrink-0"
              >
                삭제
              </button>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  )
}
