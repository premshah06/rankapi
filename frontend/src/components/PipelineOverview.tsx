import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RevealText } from './RevealText'
import { STAGES, type Stage } from '../data/pipeline'
import { useScrollStore, ACCENT_HEX } from '../lib/scrollStore'

gsap.registerPlugin(ScrollTrigger)

const outExpo = [0.16, 1, 0.3, 1] as const

/**
 * Condensed replacement for the old TwoStageExplainer + 5x full-viewport
 * StageSection scroll. Same source data (data/pipeline.ts STAGES), same
 * scroll-driven accent-color mechanism (GSAP ScrollTrigger -> Zustand), but
 * laid out as a single compact vertical timeline instead of 5+ screens.
 */
export function PipelineOverview() {
  return (
    <section id="pipeline" className="relative px-6 md:px-10 py-28 md:py-36 max-w-4xl mx-auto">
      <p className="font-mono text-sm2 uppercase tracking-[0.2em] text-ink/50 mb-6">How it works</p>
      <RevealText
        as="h2"
        text="Retrieval, then ranking — five steps, start to finish."
        className="text-h2 mb-6"
      />
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: outExpo }}
        className="text-body text-ink/70 max-w-2xl leading-relaxed mb-16"
      >
        Real recommender systems run a cheap, broad retrieval pass first, then spend expensive
        model compute only on what survived it. RankAPI mirrors that shape at a portfolio scale —
        150 items, not 150 million — across the five steps below, from synthetic ground truth to
        a served API response.
      </motion.p>

      <div className="space-y-3">
        {STAGES.map((stage, i) => (
          <PipelineStep key={stage.index} stage={stage} stageIndex={i} isLast={i === STAGES.length - 1} />
        ))}
      </div>
    </section>
  )
}

function PipelineStep({
  stage,
  stageIndex,
  isLast,
}: {
  stage: Stage
  stageIndex: number
  isLast: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const setActiveAccent = useScrollStore((s) => s.setActiveAccent)
  const accentHex = ACCENT_HEX[stage.accent]

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 65%',
      end: 'bottom 35%',
      onEnter: () => setActiveAccent(stage.accent, stageIndex),
      onEnterBack: () => setActiveAccent(stage.accent, stageIndex),
    })

    return () => trigger.kill()
  }, [setActiveAccent, stage.accent, stageIndex])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: outExpo, delay: Math.min(stageIndex * 0.08, 0.6) }}
      className="will-anim rounded-2xl border border-black/[0.08] bg-surface/50 p-6 md:p-7 flex gap-5 md:gap-7"
    >
      <div className="shrink-0 flex flex-col items-center">
        <span
          className="font-mono text-sm2 h-9 w-9 rounded-full flex items-center justify-center border shrink-0"
          style={{ borderColor: accentHex, color: accentHex }}
        >
          {stage.index}
        </span>
        {!isLast && <span className="mt-2 w-px flex-1 bg-black/[0.08]" />}
      </div>
      <div className="min-w-0 pb-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
          <h3 className="text-lg md:text-xl font-semibold text-heading">{stage.title}</h3>
          <span className="font-mono text-xs text-ink/40">{stage.file}</span>
        </div>
        <p
          className="font-mono text-xs uppercase tracking-[0.15em] mb-2"
          style={{ color: accentHex }}
        >
          {stage.eyebrow}
        </p>
        <p className="text-sm2 text-ink/70 leading-relaxed">{stage.summary}</p>
      </div>
    </motion.div>
  )
}
