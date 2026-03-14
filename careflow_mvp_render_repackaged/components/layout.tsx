"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { getCurrentUser, logoutCurrentUser } from '@/lib/local-auth';

export function SiteShell({ children }: { children: ReactNode }) {
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
            <Link href="/qna">Q&A</Link>
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

export function SectionCard({ children }: { children: ReactNode }) {
  return <section className="card">{children}</section>;
}