import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Stage } from '../data/pipeline'
import { useScrollStore, ACCENT_HEX } from '../lib/scrollStore'
import { RevealText } from './RevealText'
import { cn } from '../lib/cn'

gsap.registerPlugin(ScrollTrigger)

const outExpo = [0.16, 1, 0.3, 1] as const

type StageSectionProps = {
  stage: Stage
  stageIndex: number
  reverse?: boolean
}

export function StageSection({ stage, stageIndex, reverse = false }: StageSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const setActiveAccent = useScrollStore((s) => s.setActiveAccent)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveAccent(stage.accent, stageIndex),
      onEnterBack: () => setActiveAccent(stage.accent, stageIndex),
    })

    return () => trigger.kill()
  }, [setActiveAccent, stage.accent, stageIndex])

  const accentHex = ACCENT_HEX[stage.accent]

  return (
    <section
      ref={sectionRef}
      className="relative px-6 md:px-10 py-24 md:py-32 max-w-6xl mx-auto"
    >
      <div className={cn('grid md:grid-cols-2 gap-12 md:gap-16 items-start', reverse && 'md:[&>*:first-child]:order-2')}>
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span
              className="font-mono text-sm2 h-9 w-9 rounded-full flex items-center justify-center border"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              {stage.index}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink/50">{stage.eyebrow}</span>
          </div>

          <RevealText as="h3" text={stage.title} className="text-h2 mb-3" />

          <p className="font-mono text-xs text-ink/40 mb-6">{stage.file}</p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: outExpo }}
            className="text-body text-ink/70 leading-relaxed mb-8"
          >
            {stage.summary}
          </motion.p>

          <ul className="space-y-4">
            {stage.details.map((detail, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, ease: outExpo, delay: i * 0.08 }}
                className="flex gap-3 text-sm2 text-ink/70 leading-relaxed"
              >
                <span
                  className="mt-2 h-1 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: accentHex }}
                />
                {detail}
              </motion.li>
            ))}
          </ul>
        </div>

        {stage.code && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: outExpo, delay: 0.15 }}
            className="will-anim rounded-2xl border border-black/[0.08] bg-[#0d0d10] p-6 md:p-8 overflow-x-auto sticky top-28"
          >
            <div className="flex gap-1.5 mb-5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            </div>
            <pre className="font-mono text-[13px] leading-relaxed text-[#e8e8e8] whitespace-pre-wrap">
              <code>{stage.code}</code>
            </pre>
          </motion.div>
        )}
      </div>
    </section>
  )
}
