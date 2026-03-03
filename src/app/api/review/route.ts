import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const period = params.get('period') || 'week'
  const customFrom = params.get('from')
  const customTo = params.get('to')

  // 기간 계산
  const now = new Date()
  let fromDate: string
  let toDate: string

  if (period === 'custom' && customFrom && customTo) {
    fromDate = customFrom
    toDate = customTo
  } else if (period === 'month') {
    toDate = now.toISOString().slice(0, 10)
    const d = new Date(now)
    d.setDate(d.getDate() - 29)
    fromDate = d.toISOString().slice(0, 10)
  } else {
    // week (기본)
    toDate = now.toISOString().slice(0, 10)
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    fromDate = d.toISOString().slice(0, 10)
  }

  try {
    // 병렬 쿼리
    const [dailyLogsRes, sleepRes, habitsRes, decisionsRes] = await Promise.all([
      // daily_logs
      supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: true }),
      // sleep_blocks (daily_log_id를 통해 조인)
      supabase
        .from('sleep_blocks')
        .select('*, daily_logs!inner(date)')
        .eq('user_id', user.id)
        .gte('daily_logs.date', fromDate)
        .lte('daily_logs.date', toDate),
      // daily_habits (daily_log_id를 통해 조인)
      supabase
        .from('daily_habits')
        .select('*, daily_logs!inner(date)')
        .eq('user_id', user.id)
        .gte('daily_logs.date', fromDate)
        .lte('daily_logs.date', toDate),
      // decision_intents
      supabase
        .from('decision_intents')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`),
    ])

    const dailyLogs = dailyLogsRes.data || []
    const sleepBlocks = sleepRes.data || []
    const habits = habitsRes.data || []
    const decisions = decisionsRes.data || []

    // --- Condition 계산 ---
    const scores = dailyLogs.map(l => l.condition_score as number).filter(s => s != null)
    const conditionAvg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const conditionMin = scores.length ? Math.min(...scores) : 0
    const conditionMax = scores.length ? Math.max(...scores) : 0
    const conditionSeries = dailyLogs.map(l => ({
      date: l.date as string,
      score: l.condition_score as number,
    }))

    // --- Sleep 계산 ---
    // daily_log_id별로 그룹핑
    interface SleepBlockRow {
      id: string
      start_at: string
      end_at: string
      quality: number | null
      daily_log_id: string
      daily_logs: { date: string }
    }
    const sleepByDate: Record<string, SleepBlockRow[]> = {}
    for (const block of sleepBlocks as SleepBlockRow[]) {
      const date = block.daily_logs?.date
      if (!date) continue
      if (!sleepByDate[date]) sleepByDate[date] = []
      sleepByDate[date].push(block)
    }

    let totalSleepHours = 0
    let totalBlocks = 0
    let totalLongestStretch = 0
    const sleepSeries: Array<{
      date: string
      hours: number
      blocks: number
      longest_stretch_hours: number
      quality_avg: number | null
    }> = []

    const sleepDates = Object.keys(sleepByDate).sort()
    for (const date of sleepDates) {
      const blocks = sleepByDate[date]
      let dayHours = 0
      let longestStretch = 0
      const qualities: number[] = []

      for (const b of blocks) {
        const start = new Date(b.start_at).getTime()
        const end = new Date(b.end_at).getTime()
        const hours = (end - start) / (1000 * 60 * 60)
        dayHours += hours
        if (hours > longestStretch) longestStretch = hours
        if (b.quality != null) qualities.push(b.quality)
      }

      totalSleepHours += dayHours
      totalBlocks += blocks.length
      totalLongestStretch += longestStretch

      sleepSeries.push({
        date,
        hours: Math.round(dayHours * 100) / 100,
        blocks: blocks.length,
        longest_stretch_hours: Math.round(longestStretch * 100) / 100,
        quality_avg: qualities.length
          ? Math.round((qualities.reduce((a, b) => a + b, 0) / qualities.length) * 100) / 100
          : null,
      })
    }

    const sleepDayCount = sleepDates.length || 1

    // --- Habits 계산 ---
    interface HabitRow {
      exercise: boolean
      no_alcohol_snack: boolean
      focus_minutes: number
      daily_logs: { date: string }
    }
    const habitsTyped = habits as HabitRow[]
    const totalDays = dailyLogs.length || 1
    const exerciseCount = habitsTyped.filter(h => h.exercise).length
    const noAlcoholCount = habitsTyped.filter(h => h.no_alcohol_snack).length
    const totalFocusMinutes = habitsTyped.reduce((sum, h) => sum + (h.focus_minutes || 0), 0)

    const focusSeries = habitsTyped.map(h => ({
      date: h.daily_logs?.date || '',
      minutes: h.focus_minutes || 0,
    })).filter(f => f.date)

    // --- Decisions 계산 ---
    interface DecisionRow {
      status: string
      percent_of_account: number
      created_at: string
    }
    const decisionsTyped = decisions as DecisionRow[]
    const draftedCount = decisionsTyped.filter(d => d.status === 'drafted').length
    const clearedCount = decisionsTyped.filter(d => d.status === 'cleared').length
    const executedCount = decisionsTyped.filter(d => d.status === 'executed').length
    const over5Count = decisionsTyped.filter(d => d.percent_of_account > 5).length

    // over5 시리즈 (날짜별 5% 초과 건수)
    const over5ByDate: Record<string, number> = {}
    for (const d of decisionsTyped) {
      if (d.percent_of_account > 5) {
        const date = d.created_at.slice(0, 10)
        over5ByDate[date] = (over5ByDate[date] || 0) + 1
      }
    }
    const over5Series = Object.entries(over5ByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // --- Risk Flags ---
    // 날짜별 condition_score 매핑
    const conditionByDate: Record<string, number> = {}
    for (const log of dailyLogs) {
      conditionByDate[log.date as string] = log.condition_score as number
    }

    // 날짜별 수면 시간 매핑
    const sleepHoursByDate: Record<string, number> = {}
    for (const s of sleepSeries) {
      sleepHoursByDate[s.date] = s.hours
    }

    const riskFlags: Array<{ date: string; type: string; detail?: string }> = []

    // 모든 날짜 확인
    const allDates = new Set([
      ...Object.keys(conditionByDate),
      ...Object.keys(sleepHoursByDate),
    ])

    for (const date of allDates) {
      const condition = conditionByDate[date]
      const sleepH = sleepHoursByDate[date]

      // low_sleep_low_condition
      if (sleepH != null && sleepH < 4 && condition != null && condition <= 2) {
        riskFlags.push({
          date,
          type: 'low_sleep_low_condition',
          detail: `수면 ${sleepH.toFixed(1)}h, 컨디션 ${condition}`,
        })
      }

      // over5_when_low_condition
      if (condition != null && condition <= 2) {
        const dayOver5 = decisionsTyped.filter(
          d => d.percent_of_account > 5 && d.created_at.slice(0, 10) === date
        )
        if (dayOver5.length > 0) {
          riskFlags.push({
            date,
            type: 'over5_when_low_condition',
            detail: `컨디션 ${condition}일 때 5% 초과 매매 ${dayOver5.length}건`,
          })
        }
      }
    }

    riskFlags.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      ok: true,
      data: {
        condition: {
          avg: Math.round(conditionAvg * 100) / 100,
          min: conditionMin,
          max: conditionMax,
          series: conditionSeries,
        },
        sleep: {
          total_hours: Math.round(totalSleepHours * 100) / 100,
          avg_hours: Math.round((totalSleepHours / sleepDayCount) * 100) / 100,
          blocks_avg: Math.round((totalBlocks / sleepDayCount) * 100) / 100,
          longest_stretch_avg: Math.round((totalLongestStretch / sleepDayCount) * 100) / 100,
          series: sleepSeries,
        },
        habits: {
          exercise_rate: Math.round((exerciseCount / totalDays) * 10000) / 100,
          no_alcohol_rate: Math.round((noAlcoholCount / totalDays) * 10000) / 100,
          focus_avg_minutes: Math.round(totalFocusMinutes / totalDays),
          focus_series: focusSeries,
        },
        decisions: {
          drafted: draftedCount,
          cleared: clearedCount,
          executed: executedCount,
          over_5_percent: over5Count,
          over5_series: over5Series,
        },
        risk_flags: riskFlags,
      },
      meta: { period, from: fromDate, to: toDate },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
