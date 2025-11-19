import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HarnessFlow - Intelligent Wiring Harness Design',
  description: 'Automotive electrical change-impact engine for wiring harness validation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
