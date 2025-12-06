import './globals.css'

export const metadata = {
  title: 'FareFlow - Taxi Management System',
  description: 'Modern taxi fleet management application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
