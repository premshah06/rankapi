import { motion } from 'framer-motion'
import { RevealText } from './RevealText'
import { METRICS } from '../data/pipeline'

const outExpo = [0.16, 1, 0.3, 1] as const

export function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] flex flex-col justify-center px-6 md:px-10 pt-24">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 h-[36rem] w-[36rem] rounded-full opacity-[0.07] blur-3xl will-anim"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
      </div>

      <p className="font-mono text-sm2 uppercase tracking-[0.2em] text-ink/50 mb-6">
        Portfolio project &middot; recommendation systems
      </p>

      <RevealText
        as="h1"
        text="A two-stage ranker, proven against ground truth."
        className="text-hero leading-[0.98] max-w-5xl"
      />

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: outExpo, delay: 0.5 }}
        className="text-body text-ink/70 max-w-2xl mt-8 leading-relaxed"
      >
        RankAPI generates synthetic users and items with a known preference signal, retrieves
        candidates, ranks them with matrix factorization written from scratch, and measures
        itself against the hidden ground truth it was never allowed to train on.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: outExpo, delay: 0.7 }}
        className="flex flex-wrap gap-x-10 gap-y-4 mt-14 font-mono text-sm2"
      >
        <Stat label="precision@10" value={METRICS.precisionAt10.toFixed(3)} />
        <Stat label="recall@10" value={METRICS.recallAt10.toFixed(3)} />
        <Stat label="users evaluated" value={String(METRICS.usersEvaluated)} />
        <Stat label="interactions seeded" value={METRICS.seededInteractions.toLocaleString()} />
      </motion.div>

      <motion.a
        href="#pipeline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
        className="absolute bottom-10 left-6 md:left-10 flex items-center gap-3 text-sm2 text-ink/50"
      >
        <span className="h-8 w-px bg-ink/30 animate-pulse" />
        Scroll to walk the pipeline
      </motion.a>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-heading text-lg font-semibold font-mono-tab">{value}</span>
      <span className="text-ink/50 uppercase tracking-wide text-xs">{label}</span>
    </div>
  )
}
