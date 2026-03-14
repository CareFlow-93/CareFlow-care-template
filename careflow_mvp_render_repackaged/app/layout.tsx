import './styles.css';
import Script from 'next/script';
import { SiteShell } from '@/components/layout';

export const metadata = { title: 'CareFlow MVP', description: '전국 장기요양기관 지도와 센터 기록 피드' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  return (
    <html lang="ko">
      <body>
        {clientId ? (
          <>
            <Script id="naver-map-sdk" src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`} strategy="beforeInteractive" />
            <Script id="naver-marker-tools" src="https://navermaps.github.io/marker-tools.js/marker-clustering/src/MarkerClustering.js" strategy="beforeInteractive" />
          </>
        ) : null}
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
