import Link from "next/link"

export function LegalPage({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to app
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        Template text. Replace this page with the terms for your product before
        launch.
      </p>
      <div className="mt-8 space-y-8 text-sm leading-7 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold">
        {children}
      </div>
      <nav
        aria-label="Legal"
        className="mt-12 flex gap-4 border-t pt-6 text-sm text-muted-foreground"
      >
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </nav>
    </main>
  )
}
