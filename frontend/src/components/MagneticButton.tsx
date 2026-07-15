import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { cn } from '../lib/cn'

type MagneticButtonProps = {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
  as?: 'button' | 'a'
}

/** Magnetic hover: element tracks toward the cursor within its bounds (strength 0.4)
 * and springs back to rest on mouseleave. Transform-only, GSAP-driven. */
export function MagneticButton({ children, className, href, onClick, as = 'button' }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) * 0.4
      const deltaY = (e.clientY - centerY) * 0.4
      gsap.to(el, { x: deltaX, y: deltaY, duration: 0.3, ease: 'power2.out' })
    }

    const handleMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' })
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const Tag = as as 'button'
  const extraProps = as === 'a' ? { href } : {}

  return (
    <Tag
      ref={ref}
      onClick={onClick}
      className={cn('will-anim inline-flex items-center justify-center', className)}
      {...extraProps}
    >
      {children}
    </Tag>
  )
}
