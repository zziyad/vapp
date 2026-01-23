import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 space-y-6 text-center">
        <h1 className="text-4xl font-bold text-foreground">
          Hello from React + Vite + shadcn/ui!
        </h1>
        <p className="text-muted-foreground">
          Welcome to your new app with Tailwind CSS and shadcn/ui
        </p>
        <div className="space-y-4">
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={() => setCount((count) => count + 1)}>
              Count is {count}
            </Button>
            <Button variant="secondary" onClick={() => setCount(0)}>
              Reset
            </Button>
            <Button variant="destructive" onClick={() => setCount((count) => count - 1)}>
              Decrease
            </Button>
            <Button variant="outline" disabled>
              Disabled
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            ✅ shadcn/ui Button component working!
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
