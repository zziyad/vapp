export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 space-y-6 text-center">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome to VAPP
        </h1>
        <p className="text-muted-foreground">
          This is a public home page. You can add it to routes by uncommenting it in routes.config.js
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Login
          </a>
          <a
            href="/dashboard"
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
