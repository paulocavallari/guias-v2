import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestão de Guias de Aprendizagem - SEDUC SP',
  description: 'Sistema PEI de gestão de apontamentos semanais de ensino.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="antialiased">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
