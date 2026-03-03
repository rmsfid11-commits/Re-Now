'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  alpha: number
  speed: number
  twinkleSpeed: number
  twinklePhase: number
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = '100vw'
      canvas.style.height = '100vh'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    // 별 생성 (200~400개)
    const count = 250 + Math.floor(Math.random() * 150)
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.5 + Math.random() * 1.1,
      alpha: 0.08 + Math.random() * 0.27,
      speed: 0.02 + Math.random() * 0.06,
      twinkleSpeed: 0.3 + Math.random() * 0.7,
      twinklePhase: Math.random() * Math.PI * 2,
    }))

    const loop = (t: number) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const time = t * 0.001

      ctx.clearRect(0, 0, w, h)

      // 은하수 밴드 (희미한 대각 그라데이션)
      const milky = ctx.createLinearGradient(0, h * 0.2, w, h * 0.8)
      milky.addColorStop(0, 'rgba(30, 58, 95, 0)')
      milky.addColorStop(0.3, 'rgba(30, 58, 95, 0.03)')
      milky.addColorStop(0.5, 'rgba(45, 80, 120, 0.045)')
      milky.addColorStop(0.7, 'rgba(30, 80, 100, 0.03)')
      milky.addColorStop(1, 'rgba(30, 58, 95, 0)')
      ctx.fillStyle = milky
      ctx.fillRect(0, 0, w, h)

      // 별 렌더링
      for (const star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase)
        const a = star.alpha + twinkle * 0.08

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 210, 230, ${Math.max(0.03, a)})`
        ctx.fill()

        // 느린 이동
        star.y -= star.speed
        if (star.y < -2) {
          star.y = h + 2
          star.x = Math.random() * w
        }
      }

      // 비네팅 (가장자리 어두움)
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85)
      vig.addColorStop(0, 'rgba(11, 15, 25, 0)')
      vig.addColorStop(0.7, 'rgba(11, 15, 25, 0.3)')
      vig.addColorStop(1, 'rgba(11, 15, 25, 0.7)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
