import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type AnimatedStatProps = {
  target: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}

/** Counts up to `target` once its container enters the viewport. DOM ref only,
 * never React state, so the tick doesn't trigger re-renders. */
export function AnimatedStat({ target, decimals = 0, suffix = '', prefix = '', className }: AnimatedStatProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obj = { val: 0 }
    const tween = gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
      onUpdate() {
        if (el) el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`
      },
    })

    return () => {
      tween.kill()
    }
  }, [target, decimals, suffix, prefix])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  )
}
