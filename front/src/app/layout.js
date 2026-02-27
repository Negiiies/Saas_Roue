import "./globals.css";
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata = {
  title: "SpinReview",
  description: "Plateforme de génération d'avis Google",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Sora', sans-serif" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}