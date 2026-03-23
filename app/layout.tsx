import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { TopbarClient } from '@/components/topbar-client';

export const metadata: Metadata = {
  title: 'CareFlow',
  description: '요양기관 생활 정보 지도 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <TopbarClient />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
