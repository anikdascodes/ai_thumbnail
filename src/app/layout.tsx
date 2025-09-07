import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'AI Thumbcraft',
  description: 'AI-powered thumbnail maker using Google Gemini',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-body antialiased',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
