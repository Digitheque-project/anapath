import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import ThemeProvider from '../components/ThemeProvider';
import { SearchProvider } from '../components/SearchContext'; // ← ajout

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({ 
  subsets: ["latin"], 
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Service d'Anatomie Pathologique",
  description: "Plateforme d'anatomie pathologique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-body text-on-surface antialiased`}>
        <div
          className="fixed top-0 left-64 right-0 bottom-0 -z-20 pointer-events-none"
          style={{
            backgroundImage: `url('/assets/bg-content.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px)',
            opacity: 0.4,
          }}
        />
        <div className="fixed top-0 left-64 right-0 bottom-0 -z-20 bg-white/60 pointer-events-none" />
        <ThemeProvider>
          <SearchProvider>  {/* ← ajout */}
            <div className="grain-overlay"></div>
            {children}
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}