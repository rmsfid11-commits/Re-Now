# RE:NOW - 인생 재시작 프로젝트

자기 관리와 성장을 위한 개인 PWA 앱입니다.
매일의 기록, 의사결정 검증, 꿈과 목표 관리, 주간 리뷰를 하나의 앱에서 관리합니다.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS 4
- **데이터베이스**: Supabase (PostgreSQL + Auth + RLS)
- **애니메이션**: Framer Motion
- **차트**: Recharts
- **배포**: Vercel
- **PWA**: next-pwa

## 주요 기능

| 탭 | 설명 |
|---|---|
| Today | 일일 기록 (근무, 컨디션, 습관, 수면, 공부) |
| Decision | 투자 의사결정 검증 (24시간 룰, 5% 룰) |
| Review | 주간 리뷰 + AI 피드백 |
| Dream | 꿈 기록 + 연간/월간 목표 관리 |

## 설치 방법

```bash
# 저장소 클론
git clone <repository-url>
cd renow

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어서 Supabase 정보 입력
```

## 환경변수 설정

`.env.local` 파일에 아래 값을 설정합니다.

| 변수 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | O | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | O | Supabase anon 키 |
| `OPENAI_API_KEY` | X | OpenAI API 키 (AI 리뷰용) |
| `ANTHROPIC_API_KEY` | X | Anthropic API 키 (AI 리뷰용) |

## Supabase 설정

Supabase SQL Editor에서 아래 SQL 파일들을 순서대로 실행합니다.

1. `sql/` 폴더의 SQL 파일들을 Supabase SQL Editor에 붙여넣기
2. `sql/dream-tables.sql` - Dream 탭 관련 테이블

> `update_updated_at()` 함수가 없다면 먼저 생성해주세요:
> ```sql
> create or replace function update_updated_at()
> returns trigger as $$
> begin
>   new.updated_at = now();
>   return new;
> end;
> $$ language plpgsql;
> ```

## 실행

```bash
# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

## AI 연동 (선택사항)

주간 리뷰에서 AI 피드백을 받으려면 API 키를 설정합니다.

- **Claude** (우선 사용): `ANTHROPIC_API_KEY` 설정
- **OpenAI** (폴백): `OPENAI_API_KEY` 설정
- 둘 다 없으면 AI 피드백 기능이 비활성화됩니다

## 배포 (Vercel)

```bash
# Vercel CLI로 배포
npx vercel

# 또는 GitHub 연동 후 자동 배포
```

Vercel 대시보드에서 환경변수를 설정해주세요.

## 프로젝트 구조

```
src/
  app/
    (tabs)/          # 탭 레이아웃
      today/         # 일일 기록
      decision/      # 의사결정
      review/        # 주간 리뷰
      dream/         # 꿈과 목표
    api/
      ai-summary/    # AI 피드백 API
  components/        # 공용 컴포넌트
  lib/
    db.ts            # Supabase CRUD 함수
    supabase.ts      # 브라우저 클라이언트
  services/
    ai/              # AI 서비스 레이어
  types/
    database.types.ts # 타입 정의
sql/                 # 테이블 생성 SQL
```
