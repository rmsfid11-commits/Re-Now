import { NextRequest, NextResponse } from 'next/server'
import { getAISummary } from '@/services/ai'

export async function POST(req: NextRequest) {
  try {
    const { reviewData } = await req.json()

    if (!reviewData) {
      return NextResponse.json(
        { ok: false, error: '리뷰 데이터가 없습니다' },
        { status: 400 }
      )
    }

    const summary = await getAISummary(reviewData)

    if (!summary) {
      return NextResponse.json(
        { ok: false, error: 'AI 키가 설정되지 않았습니다' },
        { status: 503 }
      )
    }

    return NextResponse.json({ ok: true, summary })
  } catch (e) {
    console.error('AI summary 오류:', e)
    return NextResponse.json(
      { ok: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
