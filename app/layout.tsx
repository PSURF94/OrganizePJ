import type { Metadata, Viewport } from 'next'
import { Poppins, Inter } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Organize PJ — Finanças Organizadas. Lucro Real.',
  description: 'Controle de clientes, receitas, despesas, impostos e fluxo de caixa em uma plataforma simples para prestadores de serviço e microempresas.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF8A00',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`min-h-screen bg-slate-100 ${poppins.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  )
}
