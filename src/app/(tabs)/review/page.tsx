'use client'

import { useState, useEffect, useCallback } from 'react'
import GlassCard from '@/components/GlassCard'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type PeriodType = 'week' | 'month' | 'custom'
type ViewMode = 'summary' | 'detail'

interface ReviewData {
  condition: {
    avg: number; min: number; max: number
    series: Array<{ date: string; score: number }>
  }
  sleep: {
    total_hours: number; avg_hours: number; blocks_avg: number; longest_stretch_avg: number
    series: Array<{ date: string; hours: number; blocks: number; longest_stretch_hours: number; quality_avg: number | null }>
  }
  habits: {
    exercise_rate: number; no_alcohol_rate: number; focus_avg_minutes: number
    focus_series: Array<{ date: string; minutes: number }>
  }
  decisions: {
    drafted: number; cleared: number; executed: number; over_5_percent: number
    over5_series: Array<{ date: string; count: number }>
  }
  risk_flags: Array<{ date: string; type: string; detail?: string }>
}

interface ReviewResponse {
  ok: boolean
  data?: ReviewData
  meta?: { period: string; from: string; to: string }
  error?: string
}

// 기간 프리셋
const periodPresets: Array<{ key: PeriodType | '4weeks'; label: string }> = [
  { key: 'week', label: '이번주' },
  { key: '4weeks', label: '최근4주' },
  { key: 'month', label: '이번달' },
  { key: 'custom', label: '커스텀' },
]

function shortDate(dateStr: string) {
  return dateStr.slice(5) // MM-DD
}

// 아코디언 컴포넌트
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <GlassCard className="!p-0 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-bold text-white">{title}</span>
        <span className="text-gray-400 text-xs">{open ? '접기' : '펼치기'}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </GlassCard>
  )
}

// 원형 진행률 컴포넌트
function ProgressCircle({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <circle
          cx="34" cy="34" r={radius} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 34 34)"
        />
        <text x="34" y="37" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          {Math.round(value)}%
        </text>
      </svg>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  )
}

export default function ReviewPage() {
  const [period, setPeriod] = useState<PeriodType | '4weeks'>('week')
  const [viewMode, setViewMode] = useState<ViewMode>('summary')
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url: string
      if (period === '4weeks') {
        // 최근 28일
        const to = new Date().toISOString().slice(0, 10)
        const from = new Date(Date.now() - 27 * 86400000).toISOString().slice(0, 10)
        url = `/api/review?period=custom&from=${from}&to=${to}`
      } else if (period === 'custom') {
        if (!customFrom || !customTo) { setLoading(false); return }
        url = `/api/review?period=custom&from=${customFrom}&to=${customTo}`
      } else {
        url = `/api/review?period=${period}`
      }

      const res = await fetch(url)
      const json: ReviewResponse = await res.json()

      if (!json.ok || !json.data) {
        setError(json.error || '데이터 조회 실패')
      } else {
        setData(json.data)
      }
    } catch {
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }, [period, customFrom, customTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const tooltipStyle = {
    contentStyle: { background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: '#9ca3af' },
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div className="text-center pt-2">
        <h1 className="text-xl font-bold text-white">복기</h1>
      </div>

      {/* 기간 필터 */}
      <div className="flex gap-2">
        {periodPresets.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
              period === p.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 커스텀 날짜 입력 */}
      {period === 'custom' && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
          <span className="text-gray-500 text-xs">~</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* 뷰 토글 */}
      <div className="flex gap-2 justify-center">
        {(['summary', 'detail'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              viewMode === mode
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {mode === 'summary' ? '요약' : '디테일'}
          </button>
        ))}
      </div>

      {/* 로딩/에러 */}
      {loading && (
        <p className="text-center text-xs text-gray-500 py-8">로딩 중...</p>
      )}
      {error && (
        <p className="text-center text-xs text-red-400 py-4">{error}</p>
      )}

      {/* 데이터 표시 */}
      {!loading && data && viewMode === 'summary' && (
        <div className="grid grid-cols-2 gap-3">
          <GlassCard>
            <p className="text-[10px] text-gray-400 mb-1">컨디션 평균</p>
            <p className="text-2xl font-bold text-blue-400">{data.condition.avg.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500">
              최저 {data.condition.min} / 최고 {data.condition.max}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-[10px] text-gray-400 mb-1">수면 평균</p>
            <p className="text-2xl font-bold text-blue-400">{data.sleep.avg_hours.toFixed(1)}h</p>
            <p className="text-[10px] text-gray-500">
              총 {data.sleep.total_hours.toFixed(1)}h
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-[10px] text-gray-400 mb-1">운동 비율</p>
            <p className="text-2xl font-bold text-blue-400">{data.habits.exercise_rate.toFixed(0)}%</p>
            <p className="text-[10px] text-gray-500">
              집중 평균 {data.habits.focus_avg_minutes}분
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-[10px] text-gray-400 mb-1">결정 기록</p>
            <p className="text-2xl font-bold text-blue-400">{data.decisions.drafted + data.decisions.cleared + data.decisions.executed}</p>
            <p className="text-[10px] text-gray-500">
              5%초과 {data.decisions.over_5_percent}건
            </p>
          </GlassCard>
        </div>
      )}

      {!loading && data && viewMode === 'detail' && (
        <div className="flex flex-col gap-3">
          {/* 마음 */}
          <Accordion title="마음 (컨디션)">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.condition.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-400">
              <span>평균: {data.condition.avg.toFixed(1)}</span>
              <span>최저: {data.condition.min}</span>
              <span>최고: {data.condition.max}</span>
            </div>
          </Accordion>

          {/* 수면 */}
          <Accordion title="수면">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sleep.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {data.sleep.series.some(s => s.quality_avg !== null) && (
              <div className="h-36 mt-3">
                <p className="text-[10px] text-gray-500 mb-1">수면 질</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.sleep.series.filter(s => s.quality_avg !== null)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="quality_avg" stroke="#2DD4BF" strokeWidth={2} dot={{ r: 3, fill: '#2DD4BF' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 flex gap-4 text-xs text-gray-400">
              <span>일평균: {data.sleep.avg_hours.toFixed(1)}h</span>
              <span>블록 평균: {data.sleep.blocks_avg.toFixed(1)}</span>
              <span>최장 스트레치: {data.sleep.longest_stretch_avg.toFixed(1)}h</span>
            </div>
          </Accordion>

          {/* 습관 */}
          <Accordion title="습관">
            <div className="flex justify-around py-2">
              <ProgressCircle value={data.habits.exercise_rate} label="운동" color="#3B82F6" />
              <ProgressCircle value={data.habits.no_alcohol_rate} label="금주/간식절제" color="#2DD4BF" />
            </div>
            <div className="h-36 mt-3">
              <p className="text-[10px] text-gray-500 mb-1">집중 시간 (분)</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.habits.focus_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="minutes" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Accordion>

          {/* 결정 */}
          <Accordion title="결정">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: '초안', value: data.decisions.drafted, color: 'text-yellow-400' },
                { label: '통과', value: data.decisions.cleared, color: 'text-blue-400' },
                { label: '실행', value: data.decisions.executed, color: 'text-green-400' },
                { label: '5%초과', value: data.decisions.over_5_percent, color: 'text-orange-400' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            {data.decisions.over5_series.length > 0 && (
              <div className="h-36 mb-3">
                <p className="text-[10px] text-gray-500 mb-1">5% 초과 매매</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.decisions.over5_series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 리스크 플래그 */}
            {data.risk_flags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-400 mb-2">리스크 플래그</p>
                <div className="flex flex-col gap-1.5">
                  {data.risk_flags.map((flag, i) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-red-400 font-medium">
                          {flag.type === 'low_sleep_low_condition' ? '수면부족+저컨디션' : '저컨디션 5%초과매매'}
                        </span>
                        <span className="text-[10px] text-gray-500">{flag.date}</span>
                      </div>
                      {flag.detail && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{flag.detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Accordion>
        </div>
      )}

      {!loading && !data && !error && (
        <p className="text-center text-xs text-gray-500 py-8">데이터가 없습니다</p>
      )}
    </div>
  )
}
