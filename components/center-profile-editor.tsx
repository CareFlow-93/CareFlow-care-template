'use client';

import { useState } from 'react';
import { updateCenterProfile } from '@/lib/centers';
import { getErrorMessage } from '@/lib/errors';
import type { Center } from '@/types/domain';

export function CenterProfileEditor({ center, onSaved }: { center: Center; onSaved: () => Promise<void> | void }) {
  const [address, setAddress] = useState(center.address || '');
  const [phone, setPhone] = useState(center.phone || '');
  const [introText, setIntroText] = useState(center.intro_text || '');
  const [homepageUrl, setHomepageUrl] = useState(center.homepage_url || '');
  const [heroImageUrl, setHeroImageUrl] = useState(center.hero_image_url || '');
  const [capacityTotal, setCapacityTotal] = useState(center.capacity_total?.toString() || '');
  const [capacityCurrent, setCapacityCurrent] = useState(center.capacity_current?.toString() || '');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    try {
      setBusy(true);
      setError('');
      setNotice('');
      await updateCenterProfile(center.id, {
        address,
        phone,
        intro_text: introText,
        homepage_url: homepageUrl,
        hero_image_url: heroImageUrl,
        capacity_total: capacityTotal ? Number(capacityTotal) : null,
        capacity_current: capacityCurrent ? Number(capacityCurrent) : null,
      });
      await onSaved();
      setNotice('센터 정보가 저장되었습니다. 보호자 검색과 센터 상세 페이지에 즉시 반영됩니다.');
    } catch (err) {
      setError(getErrorMessage(err, '센터 정보 저장에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="sectionTitle">
        <div>
          <h2>센터 프로필 수정</h2>
          <p className="muted inlineDescription">기관 가입 후 누적되는 운영 데이터의 핵심 입력 영역입니다.</p>
        </div>
      </div>
      <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소" />
      <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호" />
      <textarea className="textarea" value={introText} onChange={(e) => setIntroText(e.target.value)} placeholder="센터 소개 / 운영 철학 / 프로그램 강점" maxLength={2000} />
      <input className="field" value={homepageUrl} onChange={(e) => setHomepageUrl(e.target.value)} placeholder="홈페이지 URL" />
      <input className="field" value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="대표 이미지 URL" />
      <div className="searchRow searchRowWide">
        <input className="field" value={capacityTotal} onChange={(e) => setCapacityTotal(e.target.value)} placeholder="정원" inputMode="numeric" />
        <input className="field" value={capacityCurrent} onChange={(e) => setCapacityCurrent(e.target.value)} placeholder="현원" inputMode="numeric" />
      </div>
      <button className="primaryBtn" onClick={() => void handleSave()} disabled={busy}>{busy ? '저장 중...' : '센터 정보 저장'}</button>
      {notice ? <div className="notice">{notice}</div> : null}
      {error ? <div className="error">{error}</div> : null}
    </section>
  );
}
