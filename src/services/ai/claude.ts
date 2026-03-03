// Claude API 호출 래퍼
export async function callClaude(
  prompt: string,
  systemPrompt?: string
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const body: Record<string, unknown> = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  }
  if (systemPrompt) {
    body.system = systemPrompt
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('Claude API 오류:', res.status, await res.text())
    return null
  }

  const data = await res.json()
  const block = data.content?.[0]
  return block?.type === 'text' ? block.text : null
}
