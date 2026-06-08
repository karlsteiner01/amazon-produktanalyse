import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme-provider'
import { Sidebar } from '@/components/layout/sidebar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Amazon Produktanalyse',
  description: 'Produktanalyse-Dashboard für Amazon-Verkäufer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="ml-56 flex-1 bg-zinc-50 dark:bg-zinc-900 min-h-screen">
              <div className="h-14 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800 flex items-center px-6">
                <h1 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Amazon Produktanalyse
                </h1>
              </div>
              <div className="p-6">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
