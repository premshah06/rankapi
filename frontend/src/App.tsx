import { useLenis } from './lib/useLenis'
import { useScrollTriggerRefresh } from './lib/useScrollTriggerRefresh'
import { Grain } from './components/Grain'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { TwoStageExplainer } from './components/TwoStageExplainer'
import { StageSection } from './components/StageSection'
import { MetricsShowcase } from './components/MetricsShowcase'
import { DemoPanel } from './components/DemoPanel'
import { TechStack } from './components/TechStack'
import { Footer } from './components/Footer'
import { STAGES } from './data/pipeline'

function App() {
  useLenis()
  useScrollTriggerRefresh()

  return (
    <>
      <Grain />
      <Nav />
      <main>
        <Hero />
        <TwoStageExplainer />
        <div id="pipeline">
          {STAGES.map((stage, i) => (
            <StageSection key={stage.index} stage={stage} stageIndex={i} reverse={i % 2 === 1} />
          ))}
        </div>
        <MetricsShowcase />
        <DemoPanel />
        <TechStack />
      </main>
      <Footer />
    </>
  )
}

export default App
