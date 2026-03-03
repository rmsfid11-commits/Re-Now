'use client'

import { useState, useEffect, useMemo } from 'react'
import GlassCard from '@/components/GlassCard'
import { createClient } from '@/lib/supabase'
import { createDecisionIntent, updateDecisionStatus, getDecisionIntents } from '@/lib/db'
import type { DecisionKind, AssetType, DecisionIntent } from '@/types/database.types'

type FormMode = null | 'buy' | 'sell'

export default function DecisionPage() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentList, setRecentList] = useState<DecisionIntent[]>([])
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null)
  const [gateLoading, setGateLoading] = useState(false)

  // 폼 상태
  const [asset, setAsset] = useState<AssetType>('stock')
  const [symbol, setSymbol] = useState('')
  const [amountKrw, setAmountKrw] = useState('')
  const [accountTotalKrw, setAccountTotalKrw] = useState('')
  const [reasons, setReasons] = useState<string[]>(['', '', ''])
  const [isStructure, setIsStructure] = useState(false)
  const [rule24hAck, setRule24hAck] = useState(false)
  const [rule5pctAck, setRule5pctAck] = useState(false)

  const percentOfAccount = useMemo(() => {
    const amount = parseFloat(amountKrw)
    const total = parseFloat(accountTotalKrw)
    if (!amount || !total || total === 0) return 0
    return Math.round((amount / total) * 10000) / 100
  }, [amountKrw, accountTotalKrw])

  const isOver5 = percentOfAccount > 5

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        loadRecent(data.user.id)
      }
    })
  }, [supabase])

  async function loadRecent(uid: string) {
    try {
      const list = await getDecisionIntents(supabase, uid)
      setRecentList(list)
    } catch {
      // 무시
    }
  }

  function resetForm() {
    setAsset('stock')
    setSymbol('')
    setAmountKrw('')
    setAccountTotalKrw('')
    setReasons(['', '', ''])
    setIsStructure(false)
    setRule24hAck(false)
    setRule5pctAck(false)
    setError(null)
    setJustCreatedId(null)
  }

  function openForm(kind: 'buy' | 'sell') {
    resetForm()
    if (kind === 'sell') setReasons([''])
    setFormMode(kind)
  }

  async function handleSubmit() {
    if (!userId) return
    setError(null)

    // 유효성 검사
    if (!symbol.trim()) { setError('종목명을 입력하세요'); return }
    if (!amountKrw || parseFloat(amountKrw) <= 0) { setError('금액을 입력하세요'); return }
    if (!accountTotalKrw || parseFloat(accountTotalKrw) <= 0) { setError('계좌 총액을 입력하세요'); return }
    if (!rule24hAck) { setError('24시간 룰을 확인하세요'); return }
    if (isOver5 && !rule5pctAck) { setError('5% 초과 확인이 필요합니다'); return }

    const filledReasons = reasons.filter(r => r.trim())
    if (formMode === 'buy' && filledReasons.length < 3) {
      setError('매수 근거 3개를 모두 입력하세요')
      return
    }
    if (formMode === 'sell' && filledReasons.length < 1) {
      setError('매도 근거를 입력하세요')
      return
    }

    setLoading(true)
    try {
      const result = await createDecisionIntent(supabase, {
        user_id: userId,
        daily_log_id: null,
        kind: formMode as DecisionKind,
        asset,
        symbol: symbol.trim(),
        amount_krw: parseFloat(amountKrw),
        account_total_krw: parseFloat(accountTotalKrw),
        reasons: filledReasons,
        is_structure: isStructure,
        rule_24h_ack: rule24hAck,
        rule_5pct_ack: isOver5 ? rule5pctAck : false,
        status: 'drafted',
      })
      setJustCreatedId(result.id)
      await loadRecent(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '기록 실패')
    } finally {
      setLoading(false)
    }
  }

  async function handleGatePass(intentId: string) {
    setGateLoading(true)
    setError(null)
    try {
      await updateDecisionStatus(supabase, intentId, 'cleared')
      setJustCreatedId(null)
      setFormMode(null)
      resetForm()
      if (userId) await loadRecent(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '게이트 통과 실패 — DB 트리거 거부 가능성')
    } finally {
      setGateLoading(false)
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      drafted: 'bg-yellow-500/20 text-yellow-400',
      cleared: 'bg-blue-500/20 text-blue-400',
      executed: 'bg-green-500/20 text-green-400',
      canceled: 'bg-gray-500/20 text-gray-400',
    }
    const labels: Record<string, string> = {
      drafted: '초안',
      cleared: '통과',
      executed: '실행됨',
      canceled: '취소',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] || ''}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="text-center pt-2">
        <h1 className="text-xl font-bold text-white mb-1">결정 기록</h1>
        <p className="text-sm text-gray-400 italic">
          &ldquo;기억하라. 그리고 다르게 선택하라.&rdquo;
        </p>
      </div>

      {/* 두 버튼 */}
      {!formMode && (
        <div className="flex gap-3">
          <button
            onClick={() => openForm('buy')}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition"
          >
            매수 의도 기록
          </button>
          <button
            onClick={() => openForm('sell')}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition"
          >
            매도 의도 기록
          </button>
        </div>
      )}

      {/* 폼 */}
      {formMode && !justCreatedId && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">
              {formMode === 'buy' ? '매수' : '매도'} 의도
            </h2>
            <button
              onClick={() => { setFormMode(null); resetForm() }}
              className="text-xs text-gray-400 hover:text-white"
            >
              닫기
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* 자산 유형 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">자산 유형</label>
              <select
                value={asset}
                onChange={e => setAsset(e.target.value as AssetType)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="stock">주식</option>
                <option value="crypto">암호화폐</option>
                <option value="etf">ETF</option>
                <option value="other">기타</option>
              </select>
            </div>

            {/* 종목명 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">종목명</label>
              <input
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="예: 삼성전자, BTC"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 금액 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">금액 (원)</label>
              <input
                type="number"
                value={amountKrw}
                onChange={e => setAmountKrw(e.target.value)}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 계좌 총액 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">계좌 총액 (원)</label>
              <input
                type="number"
                value={accountTotalKrw}
                onChange={e => setAccountTotalKrw(e.target.value)}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 비중 표시 */}
            {percentOfAccount > 0 && (
              <div className={`text-sm font-medium ${isOver5 ? 'text-orange-400' : 'text-gray-300'}`}>
                계좌 비중: {percentOfAccount}%
                {isOver5 && <span className="ml-2 text-xs text-orange-500">(5% 초과)</span>}
              </div>
            )}

            {/* 근거 입력 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                {formMode === 'buy' ? '매수 근거 (3개 필수)' : '매도 근거 (1개 필수)'}
              </label>
              {reasons.map((r, i) => (
                <input
                  key={i}
                  type="text"
                  value={r}
                  onChange={e => {
                    const next = [...reasons]
                    next[i] = e.target.value
                    setReasons(next)
                  }}
                  placeholder={`근거 ${i + 1}`}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 mb-2"
                />
              ))}
            </div>

            {/* 체크박스들 */}
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isStructure}
                onChange={e => setIsStructure(e.target.checked)}
                className="accent-blue-500"
              />
              구조적 매매인가?
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={rule24hAck}
                onChange={e => setRule24hAck(e.target.checked)}
                className="accent-blue-500"
              />
              24시간 룰 확인
            </label>

            {isOver5 && (
              <label className="flex items-center gap-2 text-sm text-orange-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule5pctAck}
                  onChange={e => setRule5pctAck(e.target.checked)}
                  className="accent-orange-500"
                />
                5% 초과 매매 — 정말 진행하겠습니까?
              </label>
            )}

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
            >
              {loading ? '기록 중...' : '기록'}
            </button>
          </div>
        </GlassCard>
      )}

      {/* 게이트 통과 단계 */}
      {justCreatedId && (
        <GlassCard>
          <div className="text-center flex flex-col gap-4">
            <p className="text-sm text-green-400">초안이 기록되었습니다.</p>
            <p className="text-xs text-gray-400">
              24시간 후에도 같은 생각이라면, 게이트를 통과하세요.
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={() => handleGatePass(justCreatedId)}
              disabled={gateLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition disabled:opacity-50"
            >
              {gateLoading ? '처리 중...' : '게이트 통과 → 토스로'}
            </button>
            <button
              onClick={() => { setFormMode(null); resetForm() }}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              나중에 하기
            </button>
          </div>
        </GlassCard>
      )}

      {/* 최근 기록 목록 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">최근 결정 기록</h3>
        {recentList.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8">아직 기록이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentList.map(item => (
              <GlassCard key={item.id} className="!p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${item.kind === 'buy' ? 'text-blue-400' : 'text-red-400'}`}>
                      {item.kind === 'buy' ? '매수' : '매도'}
                    </span>
                    <span className="text-sm text-white font-medium">{item.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.percent_of_account > 5 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                        {item.percent_of_account.toFixed(1)}%
                      </span>
                    )}
                    {statusBadge(item.status)}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span>{Number(item.amount_krw).toLocaleString()}원</span>
                  <span>{item.percent_of_account.toFixed(1)}%</span>
                  <span>{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
