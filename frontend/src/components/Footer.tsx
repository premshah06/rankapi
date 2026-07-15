export function Footer() {
  return (
    <footer className="relative px-6 md:px-10 py-16 border-t border-black/[0.08]">
      <div className="max-w-5xl mx-auto">
        <p className="text-body text-ink/70 leading-relaxed max-w-2xl mb-6">
          RankAPI is a portfolio project demonstrating backend engineering, ranking algorithm
          design, and evaluation methodology — not a production recommendation system. It runs on
          synthetic data at a scale of hundreds of users and items, chosen specifically so ranking
          quality could be measured against a known ground truth rather than assumed.
        </p>
        <p className="font-mono text-xs text-ink/40">
          data-gen → candidates.py → mf.py + ranking.py → evaluate.py → main.py
        </p>
      </div>
    </footer>
  )
}
