import './globals.css'

export const metadata = {
  title: 'Creativo',
  description: 'Express. Create. Inspire.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning style={{
        margin: 0,
        padding: 0,
        fontFamily: "'DM Sans', sans-serif",
        background: '#F5F0FF',
        color: '#231647',
        minHeight: '100vh',
      }}>
        {children}
      </body>
    </html>
  )
}
