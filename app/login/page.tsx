import { LoginClient } from '@/components/login-client';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="page">
      <div className="shell stack">
        <section className="hero heroCompact">
          <h1>로그인 / 회원가입</h1>
          <p>회원가입 후 소속 센터 등록 승인까지 완료되면 센터 수정과 활동 소식 작성 권한이 열립니다.</p>
        </section>
        <LoginClient />
      </div>
    </main>
  );
}
