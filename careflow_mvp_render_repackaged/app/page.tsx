import Link from 'next/link';
import { SectionCard } from '@/components/layout';

export default function HomePage() {
  return <SectionCard><div className="hero"><div><h1>CareFlow MVP</h1><p>전국 장기요양기관 지도, 센터 기록 피드, 사진, 댓글.</p></div><div className="row"><Link href="/centers" className="button">지도 열기</Link><Link href="/login" className="button secondary">개발자 로그인</Link></div></div></SectionCard>;
}
