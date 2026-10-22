// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Autonomous Ledger',
  description: 'AI-driven interactive portfolio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-canvas text-ink font-sans">
        {children}
      </body>
    </html>
  );
}