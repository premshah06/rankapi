import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { RevealText } from './RevealText'
import { AnimatedStat } from './AnimatedStat'
import { METRICS } from '../data/pipeline'

const outExpo = [0.16, 1, 0.3, 1] as const

export function MetricsShowcase() {
  return (
    <section id="metrics" className="relative px-6 md:px-10 py-32 md:py-40">
      <div className="absolute inset-0 -z-10 bg-surface/50" />
      <div className="max-w-5xl mx-auto text-center">
        <p className="font-mono text-sm2 uppercase tracking-[0.2em] text-ink/50 mb-6">
          The proof, not the pitch
        </p>
        <RevealText
          as="h2"
          text="Measured against hidden ground truth."
          className="text-h1 justify-center mb-16"
        />

        <div className="grid sm:grid-cols-2 gap-8 max-w-2xl mx-auto mb-16">
          <MetricCard
            label={`Precision@${METRICS.k}`}
            value={<AnimatedStat target={METRICS.precisionAt10} decimals={3} className="font-mono-tab" />}
            accent="#f97316"
            explain="Of the top 10 items recommended, this share landed in a category the user's hidden preferences actually favor."
          />
          <MetricCard
            label={`Recall@${METRICS.k}`}
            value={<AnimatedStat target={METRICS.recallAt10} decimals={3} className="font-mono-tab" />}
            accent="#10b981"
            explain="Of the relevant items reachable in the candidate set, this share got surfaced in the top 10."
          />
        </div>

        <p className="font-mono text-sm2 text-ink/40 mb-20">
          evaluated across all {METRICS.usersEvaluated} seeded users &middot; python run_eval.py --k 10
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: outExpo }}
          className="text-left max-w-3xl mx-auto rounded-2xl border border-black/[0.08] bg-base p-8 md:p-10"
        >
          <h3 className="text-h3 mb-4">What "true preference vectors" means, and why it matters</h3>
          <p className="text-body text-ink/70 leading-relaxed mb-4">
            Every synthetic user was generated with a hidden preference vector over the 8 item
            categories — the ground truth of what they actually like. That vector is stored in a
            separate <code className="font-mono text-sm2 bg-surface px-1.5 py-0.5 rounded">true_preferences</code> table
            that the candidate generator and the ranking model never query. The model only ever
            sees interactions — noisy, indirect evidence of taste.
          </p>
          <p className="text-body text-ink/70 leading-relaxed">
            Evaluating against interactions would just measure whether the model memorized what
            already happened. Evaluating against the true preference vectors instead measures
            whether it recovered the user's actual hidden taste — which is the only honest way to
            validate a ranking system built on synthetic data with no real user feedback loop.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  accent,
  explain,
}: {
  label: string
  value: ReactNode
  accent: string
  explain: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: outExpo }}
      className="will-anim rounded-2xl border border-black/[0.08] bg-base p-8 relative overflow-hidden"
    >
      <div
        className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-[0.12] blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-ink/50 mb-3">{label}</p>
      <p className="text-5xl md:text-6xl font-semibold mb-4" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-sm2 text-ink/60 leading-relaxed">{explain}</p>
    </motion.div>
  )
}
