import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'AI Chat demo with Stream AI Components',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
