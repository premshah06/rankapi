import { motion } from 'framer-motion'
import { useScrollStore, ACCENT_HEX } from '../lib/scrollStore'

const LINKS = [
  { href: '#demo', label: 'Demo' },
  { href: '#pipeline', label: 'Pipeline' },
  { href: '#metrics', label: 'Results' },
  { href: '#stack', label: 'Stack' },
]

export function Nav() {
  const activeAccent = useScrollStore((s) => s.activeAccent)

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 will-anim"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-4 flex items-center justify-between backdrop-blur-md bg-base/70 border-b border-black/[0.06]">
        <a href="#top" className="flex items-center gap-2 font-mono text-sm2 tracking-tight text-heading">
          <span
            className="inline-block h-2 w-2 rounded-full transition-colors duration-500"
            style={{ backgroundColor: ACCENT_HEX[activeAccent] }}
          />
          RankAPI
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm2 text-ink/70">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-ink transition-colors duration-300">
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="#stack"
          className="text-sm2 font-medium border border-black/10 rounded-full px-4 py-1.5 hover:bg-surface transition-colors duration-300"
        >
          Tech stack
        </a>
      </div>
    </motion.header>
  )
}
