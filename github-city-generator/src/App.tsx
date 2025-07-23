import { Scene } from './components/Scene'
import './App.css'

function App() {
  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {/* Header UI */}
      <div className="absolute top-4 left-4 z-10 text-white bg-black bg-opacity-50 p-4 rounded-lg backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-2 text-blue-400">GitHub City Generator</h1>
        <p className="text-sm opacity-75 mb-3">
          A 3D visualization of code repositories as cities
        </p>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Classes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Functions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Modules</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Components</span>
          </div>
        </div>
      </div>

      {/* Controls info */}
      <div className="absolute bottom-4 right-4 z-10 text-white bg-black bg-opacity-50 p-3 rounded-lg backdrop-blur-sm text-xs">
        <div className="space-y-1">
          <div>🖱️ Click + Drag: Rotate</div>
          <div>🔍 Scroll: Zoom</div>
          <div>⚡ Height: Lines of Code</div>
          <div>💎 Opacity: Complexity</div>
        </div>
      </div>

      <Scene />
    </div>
  )
}

export default App
