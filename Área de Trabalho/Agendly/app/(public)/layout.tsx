import { Toaster } from '@/components/ui/toaster'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">{children}</main>
      <Toaster />
    </div>
  )
}
