import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RevealText } from './RevealText'
import { MagneticButton } from './MagneticButton'
import { SAMPLE_RESPONSE, SAMPLE_USER_IDS } from '../data/sampleResponse'
import { CATEGORIES, METRICS } from '../data/pipeline'

const outExpo = [0.16, 1, 0.3, 1] as const
const API_BASE = 'http://localhost:8000'
const MAX_USER_ID = METRICS.seededUsers - 1 // 299, matches data-gen/generate.py --users 300
const MIN_K = 1
const MAX_K = 20

type RecItem = { item_id: number; category: string; score: number }
type ApiResponse = { user_id: number; k: number; items: RecItem[]; cache_hit: boolean }
type Status = 'idle' | 'loading' | 'live' | 'fallback' | 'not-found'

// Deterministic color per category, sourced from the real category list in data/pipeline.ts —
// not hardcoded against a guessed set of names.
const PALETTE = ['#6366f1', '#0ea5e9', '#f97316', '#10b981', '#ec4899', '#eab308', '#14b8a6', '#8b5cf6']
const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c, i) => [c, PALETTE[i % PALETTE.length]])
)

const clampUserId = (n: number) =>
  Number.isFinite(n) ? Math.min(MAX_USER_ID, Math.max(0, Math.round(n))) : 0

function scoreBarWidth(score: number, items: RecItem[]) {
  if (items.length === 0) return 0
  if (items.length === 1) return 100 // nothing to normalize against — show a full bar, not a 0% one
  const scores = items.map((it) => it.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1
  return ((score - min) / range) * 100
}

export function DemoPanel() {
  const [userId, setUserId] = useState(SAMPLE_USER_IDS[1])
  const [k, setK] = useState(10)
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<ApiResponse>(SAMPLE_RESPONSE)
  const [showRaw, setShowRaw] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const thisRequest = ++requestIdRef.current
    const controller = new AbortController()
    const debounce = setTimeout(() => {
      void runDemo(userId, k, controller.signal, thisRequest)
    }, 350)

    return () => {
      clearTimeout(debounce)
      controller.abort()
    }
  }, [userId, k])

  const runDemo = async (id: number, kVal: number, signal: AbortSignal, requestId: number) => {
    setStatus('loading')
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    signal.addEventListener('abort', onAbort)
    const timeout = setTimeout(() => controller.abort(), 2500)

    try {
      const res = await fetch(`${API_BASE}/recommendations/${id}?k=${kVal}`, {
        signal: controller.signal,
      })
      if (requestIdRef.current !== requestId) return // superseded by a newer request

      if (res.status === 404) {
        setData({ ...SAMPLE_RESPONSE, user_id: id, k: kVal, items: SAMPLE_RESPONSE.items.slice(0, kVal) })
        setStatus('not-found')
        return
      }
      if (!res.ok) throw new Error(`status ${res.status}`)

      const json = (await res.json()) as ApiResponse
      if (requestIdRef.current !== requestId) return
      setData(json)
      setStatus('live')
    } catch {
      if (signal.aborted && requestIdRef.current !== requestId) return // just debounced away
      if (requestIdRef.current !== requestId) return
      setData({ ...SAMPLE_RESPONSE, user_id: id, k: kVal, items: SAMPLE_RESPONSE.items.slice(0, kVal) })
      setStatus('fallback')
    } finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort', onAbort)
    }
  }

  const randomize = () => setUserId(Math.floor(Math.random() * (MAX_USER_ID + 1)))

  return (
    <section id="demo" className="relative px-6 md:px-10 py-28 md:py-36 max-w-5xl mx-auto">
      <p className="font-mono text-sm2 uppercase tracking-[0.2em] text-ink/50 mb-6">
        Try it live
      </p>
      <RevealText as="h2" text="Query the ranker for any seeded user." className="text-h2 mb-6" />
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: outExpo }}
        className="text-body text-ink/70 max-w-2xl leading-relaxed mb-10"
      >
        Pick any of the 300 seeded users and how many items to return. This queries the API at
        localhost:8000 directly — if it's not running, you'll see a clearly labeled static
        example shaped exactly like a real response.
      </motion.p>

      <div className="flex flex-wrap items-end gap-8 mb-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="demo-user-id" className="font-mono text-xs uppercase tracking-[0.15em] text-ink/50">
            user_id &middot; 0&ndash;{MAX_USER_ID}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="demo-user-id"
              type="number"
              min={0}
              max={MAX_USER_ID}
              value={userId}
              onChange={(e) => setUserId(clampUserId(Number(e.target.value)))}
              className="w-24 rounded-lg border border-black/15 bg-base px-3 py-2 font-mono text-sm2 focus:outline-none focus:border-heading/40"
            />
            <MagneticButton
              onClick={randomize}
              className="font-mono text-xs px-3 py-2 rounded-lg border border-black/15 hover:bg-surface transition-colors duration-300"
            >
              🎲 random
            </MagneticButton>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[220px]">
          <label htmlFor="demo-k" className="font-mono text-xs uppercase tracking-[0.15em] text-ink/50">
            k = {k}
          </label>
          <input
            id="demo-k"
            type="range"
            min={MIN_K}
            max={MAX_K}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-full accent-[#0a0a0a]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-10">
        <span className="font-mono text-xs text-ink/40 mr-1">quick picks</span>
        {SAMPLE_USER_IDS.map((id) => (
          <MagneticButton
            key={id}
            onClick={() => setUserId(id)}
            className={`font-mono text-xs px-3.5 py-1.5 rounded-full border transition-colors duration-300 ${
              userId === id ? 'bg-heading text-base border-heading' : 'border-black/15 hover:bg-surface'
            }`}
          >
            user {id}
          </MagneticButton>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p className="font-mono text-xs text-ink/50">
          GET /recommendations/{userId}?k={k}
        </p>
        <StatusBadge status={status} />
      </div>

      <PipelineBadge status={status} cacheHit={data.cache_hit} />

      <div
        key={`${userId}-${k}-${status}`}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
      >
        {data.items.length === 0 ? (
          <p className="col-span-full font-mono text-sm2 text-ink/40 py-8 text-center border border-dashed border-black/10 rounded-2xl">
            no items returned for this user_id
          </p>
        ) : (
          data.items.map((item, i) => (
            <ItemCard
              key={item.item_id}
              item={item}
              rank={i + 1}
              index={i}
              barWidth={scoreBarWidth(item.score, data.items)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        className="font-mono text-xs text-ink/50 hover:text-ink underline decoration-dotted underline-offset-4 transition-colors duration-300 mb-4"
      >
        {showRaw ? 'hide raw JSON' : 'view raw JSON'}
      </button>

      <AnimatePresence>
        {showRaw && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: outExpo }}
            className="rounded-2xl border border-black/[0.08] bg-[#0d0d10] p-6 md:p-8 overflow-x-auto"
          >
            <div className="flex gap-1.5 mb-5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            </div>
            <pre className="font-mono text-[13px] leading-relaxed text-[#e8e8e8] whitespace-pre-wrap">
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function ItemCard({
  item,
  rank,
  index,
  barWidth,
}: {
  item: RecItem
  rank: number
  index: number
  barWidth: number
}) {
  const color = CATEGORY_COLORS[item.category] ?? '#6366f1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: outExpo, delay: Math.min(index * 0.04, 0.6) }}
      className="will-anim rounded-xl border border-black/[0.08] bg-base p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-ink/40">#{rank}</span>
        <span className="font-mono text-xs text-ink/40">item {item.item_id}</span>
      </div>
      <span
        className="inline-block font-mono text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full mb-3"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        {item.category}
      </span>
      <div className="flex items-center justify-between gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-surface overflow-hidden">
          <div
            className="h-full rounded-full will-anim"
            style={{ width: `${barWidth}%`, backgroundColor: color }}
          />
        </div>
        <span className="font-mono-tab text-xs text-ink/60 shrink-0">{item.score.toFixed(3)}</span>
      </div>
    </motion.div>
  )
}

function PipelineBadge({ status, cacheHit }: { status: Status; cacheHit: boolean }) {
  const showCache = status === 'live'

  // A cache hit returns before the API ever calls get_candidates/rank_candidates
  // (see api/app/main.py) -- so those steps genuinely did not run, and the badge
  // shouldn't claim they did.
  if (showCache && cacheHit) {
    return (
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink/50 mb-8">
        <span className="px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
          ⚡ served from Redis cache
        </span>
        <span className="text-ink/30">&rarr;</span>
        <span className="px-2.5 py-1 rounded-full border border-black/10 bg-surface/60">
          candidate generation + ranking skipped
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink/50 mb-8">
      <span className="px-2.5 py-1 rounded-full border border-black/10 bg-surface/60">
        candidates generated
      </span>
      <span className="text-ink/30">&rarr;</span>
      <span className="px-2.5 py-1 rounded-full border border-black/10 bg-surface/60">
        ranked by matrix factorization
      </span>
      <span className="text-ink/30">&rarr;</span>
      {showCache ? (
        <span className="px-2.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600">
          🧮 freshly ranked
        </span>
      ) : (
        <span className="px-2.5 py-1 rounded-full border border-black/10 bg-surface/60">served</span>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'idle') {
    return <span className="font-mono text-xs text-ink/40">static example &middot; not yet queried</span>
  }
  if (status === 'loading') {
    return <span className="font-mono text-xs text-ink/50">querying localhost:8000…</span>
  }
  if (status === 'live') {
    return (
      <span className="font-mono text-xs text-emerald-600 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live response from local API
      </span>
    )
  }
  if (status === 'not-found') {
    return (
      <span className="font-mono text-xs text-ink/40">
        user_id not found on the API &middot; showing a labeled static example
      </span>
    )
  }
  return (
    <span className="font-mono text-xs text-ink/40">
      API not reachable at localhost:8000 &middot; showing a labeled static example
    </span>
  )
}
