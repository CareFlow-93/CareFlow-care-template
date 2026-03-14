import Link from 'next/link';
import { SectionCard } from '@/components/layout';

export default function NotFoundPage() {
  return <SectionCard><div className="stackMd"><h1>페이지를 찾을 수 없습니다.</h1><Link href="/centers" className="button">지도로 이동</Link></div></SectionCard>;
}
