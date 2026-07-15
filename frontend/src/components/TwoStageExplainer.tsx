import { motion } from 'framer-motion'
import { RevealText } from './RevealText'

const outExpo = [0.16, 1, 0.3, 1] as const

const COLS = [
  {
    label: 'Retrieval',
    accent: '#0ea5e9',
    body: 'Cheap, broad, unopinionated. Filters a large catalog down to a plausible candidate set using simple rules — no model weights, no scoring. It has to be fast because it runs over every item.',
    trait: 'Recall-oriented — don\'t miss anything relevant.',
  },
  {
    label: 'Ranking',
    accent: '#f97316',
    body: 'Precise and expensive per item, but only run over the small candidate set retrieval already narrowed down. This is where the learned model — matrix factorization — actually scores things.',
    trait: 'Precision-oriented — order matters, top of the list matters most.',
  },
]

export function TwoStageExplainer() {
  return (
    <section className="relative px-6 md:px-10 py-32 max-w-5xl mx-auto">
      <RevealText as="h2" text="Why split retrieval from ranking?" className="text-h2 mb-6" />
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: outExpo }}
        className="text-body text-ink/70 max-w-2xl leading-relaxed mb-16"
      >
        Real recommender systems almost never score the entire catalog with an expensive model.
        Instead they run a cheap, broad pass first, then spend the expensive compute only on the
        items that survived it. RankAPI mirrors that shape at a portfolio scale — 150 items, not
        150 million — but the division of labor is the same.
      </motion.p>

      <div className="grid md:grid-cols-2 gap-6">
        {COLS.map((col, i) => (
          <motion.div
            key={col.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: outExpo, delay: i * 0.12 }}
            className="relative rounded-2xl border border-black/[0.08] bg-surface/60 p-8 will-anim"
          >
            <div
              className="h-1.5 w-10 rounded-full mb-6"
              style={{ backgroundColor: col.accent }}
            />
            <h3 className="text-h3 mb-3">{col.label}</h3>
            <p className="text-body text-ink/70 leading-relaxed mb-4">{col.body}</p>
            <p className="text-sm2 font-mono text-ink/50">{col.trait}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
