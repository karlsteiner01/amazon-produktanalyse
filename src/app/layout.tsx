import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/theme-provider'
import { DataProvider } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { AppLogo } from '@/components/layout/app-logo'
import { HeaderControls } from '@/components/layout/header-controls'
import './globals.css'

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
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <DataProvider>
            <div className="min-h-screen">
              <Sidebar />
              <main className="min-h-screen bg-background pb-24 lg:pl-72 lg:pb-0">
                <div className="sticky top-0 z-20 border-b border-border bg-card/85 backdrop-blur-xl">
                  <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                      <AppLogo compact className="lg:hidden" />
                      <div className="hidden min-w-0 lg:block">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Seller Research
                        </p>
                        <h1 className="truncate text-sm font-semibold sm:text-base">
                          Amazon Produktanalyse
                        </h1>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HeaderControls />
                      <ModeToggle />
                    </div>
                  </div>
                </div>
                <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                  {children}
                </div>
              </main>
            </div>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
