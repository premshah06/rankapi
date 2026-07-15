import { motion } from 'framer-motion'
import { RevealText } from './RevealText'

const outExpo = [0.16, 1, 0.3, 1] as const

const STACK = [
  { name: 'Python', role: 'API + data generation' },
  { name: 'FastAPI', role: 'HTTP service layer' },
  { name: 'NumPy', role: 'From-scratch matrix factorization' },
  { name: 'MySQL 8', role: 'Users, items, interactions, true preferences' },
  { name: 'Redis', role: '5-minute TTL cache on recommendation responses' },
  { name: 'Docker + Compose', role: 'Local multi-service orchestration' },
  { name: 'Pytest', role: 'Candidate + ranking test coverage' },
  { name: 'GitHub Actions', role: 'CI workflow scaffold' },
]

export function TechStack() {
  return (
    <section id="stack" className="relative px-6 md:px-10 py-32 max-w-5xl mx-auto">
      <RevealText as="h2" text="Built with" className="text-h2 mb-4" />
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: outExpo }}
        className="text-body text-ink/70 max-w-2xl leading-relaxed mb-12"
      >
        No recommender library, no deep learning framework. The ranking algorithm is matrix
        factorization trained via plain SGD — the point of this project is to show the mechanism,
        not hide it behind an import.
      </motion.p>

      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
        {STACK.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: outExpo, delay: (i % 4) * 0.06 }}
            className="flex items-baseline justify-between gap-4 border-b border-black/[0.08] pb-4"
          >
            <span className="font-mono text-sm2 font-medium text-heading">{item.name}</span>
            <span className="text-sm2 text-ink/50 text-right">{item.role}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
