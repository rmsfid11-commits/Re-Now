import { callClaude } from './claude'
import { callOpenAI } from './openai'

const SYSTEM_PROMPT = `당신은 개인 성장 코치입니다. 사용자의 주간 리뷰 데이터를 분석해서 짧고 핵심적인 피드백을 제공합니다.
반드시 다음 3가지를 한국어로 답해주세요:
1. 이번 주 한 문장 진단
2. 리스크 패턴 1개
3. 다음 주 딱 하나 실천 제안`

export async function getAISummary(
  reviewData: unknown
): Promise<string | null> {
  const prompt = `아래 주간 리뷰 데이터를 분석해주세요:\n\n${JSON.stringify(reviewData, null, 2)}`

  // Claude 우선 시도, 실패 시 OpenAI 폴백
  const claudeResult = await callClaude(prompt, SYSTEM_PROMPT)
  if (claudeResult) return claudeResult

  const openaiResult = await callOpenAI(prompt, SYSTEM_PROMPT)
  if (openaiResult) return openaiResult

  return null
}
