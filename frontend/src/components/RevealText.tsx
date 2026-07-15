import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

type RevealTextProps = {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  delayBase?: number
  once?: boolean
}

const outExpo = [0.16, 1, 0.3, 1] as const

/** Word-by-word mask reveal. Splits on spaces, wraps each word in an
 * overflow-hidden container so the inner span can translate up into view. */
export function RevealText({ text, as = 'h2', className, delayBase = 0, once = true }: RevealTextProps) {
  const words = text.split(' ')
  const Tag = motion[as] as typeof motion.div

  return (
    <Tag className={cn('flex flex-wrap gap-x-[0.28em]', className)}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="overflow-hidden inline-block pb-[0.15em] -mb-[0.15em]">
          <motion.span
            className="inline-block will-anim"
            initial={{ y: '110%' }}
            whileInView={{ y: '0%' }}
            viewport={{ once, margin: '-80px' }}
            transition={{ duration: 0.8, ease: outExpo, delay: delayBase + i * 0.06 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
