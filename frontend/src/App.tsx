import { useLenis } from './lib/useLenis'
import { useScrollTriggerRefresh } from './lib/useScrollTriggerRefresh'
import { Grain } from './components/Grain'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { DemoPanel } from './components/DemoPanel'
import { PipelineOverview } from './components/PipelineOverview'
import { MetricsShowcase } from './components/MetricsShowcase'
import { TechStack } from './components/TechStack'
import { Footer } from './components/Footer'

function App() {
  useLenis()
  useScrollTriggerRefresh()

  return (
    <>
      <Grain />
      <Nav />
      <main>
        <Hero />
        <DemoPanel />
        <PipelineOverview />
        <MetricsShowcase />
        <TechStack />
      </main>
      <Footer />
    </>
  )
}

export default App
