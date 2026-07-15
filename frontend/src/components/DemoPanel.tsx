import { useState } from 'react'
import { motion } from 'framer-motion'
import { RevealText } from './RevealText'
import { MagneticButton } from './MagneticButton'
import { SAMPLE_RESPONSE, SAMPLE_USER_IDS } from '../data/sampleResponse'

const outExpo = [0.16, 1, 0.3, 1] as const
const API_BASE = 'http://localhost:8000'

type RecItem = { item_id: number; category: string; score: number }
type ApiResponse = { user_id: number; k: number; items: RecItem[]; cache_hit: boolean }

type Status = 'idle' | 'loading' | 'live' | 'fallback'

export function DemoPanel() {
  const [userId, setUserId] = useState(SAMPLE_USER_IDS[1])
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<ApiResponse>(SAMPLE_RESPONSE)

  const runDemo = async (id: number) => {
    setUserId(id)
    setStatus('loading')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2500)
      const res = await fetch(`${API_BASE}/recommendations/${id}?k=10`, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`status ${res.status}`)
      const json = (await res.json()) as ApiResponse
      setData(json)
      setStatus('live')
    } catch {
      setData({ ...SAMPLE_RESPONSE, user_id: id })
      setStatus('fallback')
    }
  }

  return (
    <section id="demo" className="relative px-6 md:px-10 py-32 max-w-5xl mx-auto">
      <p className="font-mono text-sm2 uppercase tracking-[0.2em] text-ink/50 mb-6">
        See it respond
      </p>
      <RevealText as="h2" text="GET /recommendations/{user_id}?k=10" className="text-h2 mb-6 font-mono" />
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: outExpo }}
        className="text-body text-ink/70 max-w-2xl leading-relaxed mb-10"
      >
        Pick a sample user. This tries the API at localhost:8000 first — if it's not running,
        you'll see a clearly labeled static example shaped exactly like a real response.
      </motion.p>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        {SAMPLE_USER_IDS.map((id) => (
          <MagneticButton
            key={id}
            onClick={() => runDemo(id)}
            className={`font-mono text-sm2 px-4 py-2 rounded-full border transition-colors duration-300 ${
              userId === id ? 'bg-heading text-base border-heading' : 'border-black/15 hover:bg-surface'
            }`}
          >
            user {id}
          </MagneticButton>
        ))}
      </div>

      <div className="rounded-2xl border border-black/[0.08] bg-[#0d0d10] p-6 md:p-8 overflow-x-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
          <StatusBadge status={status} />
        </div>
        <pre className="font-mono text-[13px] leading-relaxed text-[#e8e8e8] whitespace-pre-wrap">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'idle') {
    return <span className="font-mono text-xs text-white/40">static example &middot; not yet queried</span>
  }
  if (status === 'loading') {
    return <span className="font-mono text-xs text-white/50">querying localhost:8000…</span>
  }
  if (status === 'live') {
    return (
      <span className="font-mono text-xs text-emerald-400 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> live response from local API
      </span>
    )
  }
  return (
    <span className="font-mono text-xs text-white/40">
      API not reachable at localhost:8000 — showing a labeled static example
    </span>
  )
}
