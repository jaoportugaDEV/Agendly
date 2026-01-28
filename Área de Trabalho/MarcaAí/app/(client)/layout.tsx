import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </div>
  )
}
