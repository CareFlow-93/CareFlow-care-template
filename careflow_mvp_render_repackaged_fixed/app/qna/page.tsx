import { SectionCard } from '@/components/layout';

export default function QnaPage() {
  return <SectionCard><div className="stackMd"><h1>Q&A</h1><ul className="plainList"><li>지도는 현재 화면 범위 기준으로 센터를 다시 불러옵니다.</li><li>센터 검색은 이름 기준 자동완성 20건까지 제공합니다.</li><li>사진은 post-images 버킷으로 업로드됩니다.</li><li>관리자 인증 요청은 manager_claims 테이블에 저장됩니다.</li></ul></div></SectionCard>;
}
