'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';

export function TopbarClient() {
  const { profile, loading, signOutUser } = useAuth();

  return (
    <header className="topbar">
      <div className="shell topbarInner">
        <Link href="/" className="brand">CareFlow</Link>
        <div className="chipRow topbarStatus">
          {loading ? <span className="chip">세션 확인 중</span> : null}
          {profile ? <span className="chip">{profile.display_name || profile.email || '로그인'} · {profile.role}</span> : <span className="chip">비로그인</span>}
        </div>
        <details className="hamburgerMenu">
          <summary aria-label="메뉴 열기">☰</summary>
          <nav className="menuPanel">
            <Link href="/centers">전국 지도 보기</Link>
            <Link href="/write">우리 센터 활동 알리기</Link>
            <Link href="/claim">소속 센터 등록하기</Link>
            <Link href="/login">{profile ? '내 계정' : '로그인 / 회원가입'}</Link>
            <Link href="/support" className="tinyLink">문의 / 건의 사항</Link>
            {profile ? <button type="button" className="ghostBtn menuLogout" onClick={() => void signOutUser()}>로그아웃</button> : null}
          </nav>
        </details>
      </div>
    </header>
  );
}
