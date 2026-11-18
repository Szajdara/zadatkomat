import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Zadatkomat — Zadatki BLIK i Rezerwacje bez prowizji',
  description:
    'Pobieraj zadatki BLIK przez Instagrama, WhatsAppa i link w bio za 0 zł abonamentu.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={poppins.variable}>
      <body className="min-h-screen flex flex-col text-[#0A192F] font-sans selection:bg-[#0D47A1] selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
