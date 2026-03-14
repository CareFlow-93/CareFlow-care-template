"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getCurrentUser, logoutCurrentUser } from '@/lib/local-auth';

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setUserName(getCurrentUser()?.name ?? null);
  }, [pathname]);

  return (
    <div className="siteShell">
      <header className="siteHeader">
        <div className="siteHeaderInner">
          <Link href="/" className="brand">CareFlow</Link>
          <nav className="navBar">
            <Link href="/centers">지도</Link>
            <Link href="/manager">관리자 인증</Link>
            <Link href="/qna">Q&amp;A</Link>
            {userName ? (
              <button
                type="button"
                className="textButton"
                onClick={() => {
                  logoutCurrentUser();
                  setUserName(null);
                  router.push('/');
                }}
              >
                {userName} 로그아웃
              </button>
            ) : (
              <Link href="/login">로그인</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="pageWrap">{children}</main>
    </div>
  );
}

export function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>{title}</h1>
        {subtitle ? <p style={{ color: '#555', marginTop: 8 }}>{subtitle}</p> : null}
      </header>
      {children}
    </main>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <section className="card">{children}</section>;
}

export function SectionCard({ children }: { children: React.ReactNode }) {
  return <Card>{children}</Card>;
}
