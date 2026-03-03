import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ensureProfileAndSettings } from '@/lib/db'

// 이메일 확인 콜백 처리
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // 첫 로그인 시 프로필+설정 자동 생성
      await ensureProfileAndSettings(supabase, data.user.id)
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // 에러 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login`)
}
