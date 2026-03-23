import { SupportForm } from '@/components/support-form';

export const dynamic = 'force-dynamic';

export default function SupportPage() {
  return (
    <main className="page"><div className="shell stack"><section className="hero heroCompact"><h1>문의 / 건의 사항</h1><p>서비스 개선 의견이나 운영 관련 문의를 남길 수 있습니다.</p></section><SupportForm /></div></main>
  );
}
