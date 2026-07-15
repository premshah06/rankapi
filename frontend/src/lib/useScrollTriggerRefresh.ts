import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout>
  return () => {
    clearTimeout(t)
    t = setTimeout(fn, ms)
  }
}

/** Refreshes ScrollTrigger on resize only, debounced. Never call on scroll. */
export function useScrollTriggerRefresh() {
  useEffect(() => {
    const handleResize = debounce(() => ScrollTrigger.refresh(), 250)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
}
