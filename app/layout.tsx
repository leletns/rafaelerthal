import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F4F6' },
    { media: '(prefers-color-scheme: dark)',  color: '#0F0F12' },
  ],
};

export const metadata: Metadata = {
  title: 'Mydash — Clínica Blue',
  description: 'Painel de gestão da Clínica Blue — Dr. Rafael Erthal',
  robots: 'noindex, nofollow',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
};

// Define o tema antes da primeira pintura — evita piscar de tela clara.
const THEME_BOOTSTRAP = `(function(){try{
var t=localStorage.getItem('theme');
if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* App Router: a folha entra no <head> de todas as páginas.
            O aviso do lint vale para o Pages Router, não para cá. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500;600;700;800&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
