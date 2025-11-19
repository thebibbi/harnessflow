export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to HarnessFlow</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Intelligent electrical change-impact engine for automotive wiring harness design
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/projects"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Get Started
          </a>
          <a
            href="/docs"
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition"
          >
            Documentation
          </a>
        </div>
      </div>
    </main>
  );
}
