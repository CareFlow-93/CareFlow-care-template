'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClaim } from '@/lib/claims';
import { searchCenters } from '@/lib/centers';
import { useAuth } from '@/components/auth-provider';
import { getErrorMessage } from '@/lib/errors';
import { validateFreeText } from '@/lib/validators';
import type { Center } from '@/types/domain';

export function ClaimForm() {
  const params = useSearchParams();
  const { profile, loading } = useAuth();
  const [centerId, setCenterId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Center[]>([]);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const initialCenterId = params.get('centerId');
    if (initialCenterId) setCenterId(initialCenterId);
  }, [params]);

  const canSubmit = useMemo(() => Boolean(profile && centerId.trim() && !busy), [profile, centerId, busy]);

  async function handleSearch() {
    try {
      setError('');
      setNotice('');
      setResults(await searchCenters({ keyword, limit: 10 }));
    } catch (err) {
      setError(getErrorMessage(err, '센터 검색에 실패했습니다.'));
    }
  }

  async function onSubmit() {
    if (!profile) {
      setError('소속 센터 등록은 로그인 후 이용할 수 있습니다.');
      return;
    }
    if (!centerId.trim()) {
      setError('센터를 선택해주세요.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      setNotice('');
      await createClaim({
        userId: profile.id,
        centerId: Number(centerId),
        message: validateFreeText(message, '신청 메시지', 500),
      });
      setNotice('소속 센터 등록 신청이 저장되었습니다. 운영자가 승인하면 계정이 해당 센터와 연결됩니다.');
      setMessage('');
    } catch (err) {
      setError(getErrorMessage(err, '신청 저장에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="sectionTitle">
        <div>
          <h2>소속 센터 등록 신청</h2>
          <p className="muted inlineDescription">센터명으로 찾고 선택한 뒤 본인 역할과 연락 가능 시간을 남겨주세요.</p>
        </div>
      </div>

      <div className="searchRow searchRowWide">
        <input
          className="searchInput"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="센터명 검색"
          onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
        />
        <button className="ghostBtn" type="button" onClick={() => void handleSearch()} disabled={busy}>
          센터 찾기
        </button>
      </div>

      {results.length ? (
        <div className="list compactList">
          {results.map((center) => (
            <button
              key={center.id}
              type="button"
              className={`pickerItem ${String(center.id) === centerId ? 'pickerItemActive' : ''}`}
              onClick={() => setCenterId(String(center.id))}
            >
              <strong>{center.name}</strong>
              <span>{center.address || '주소 없음'}</span>
            </button>
          ))}
        </div>
      ) : null}

      <input className="field" value={centerId} onChange={(e) => setCenterId(e.target.value)} placeholder="선택된 센터 ID" inputMode="numeric" />
      <textarea
        className="textarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="직책, 연락 가능한 시간, 센터와의 관계를 남겨주세요 (선택)"
        maxLength={500}
      />
      <button className="primaryBtn" onClick={() => void onSubmit()} disabled={!canSubmit || loading}>
        {busy ? '요청 중...' : '신청 저장'}
      </button>

      {!profile ? <div className="notice">로그인 후 신청하면 승인 내역과 권한 상태가 계정 페이지에 저장됩니다.</div> : null}
      {notice ? <div className="notice">{notice}</div> : null}
      {error ? <div className="error">{error}</div> : null}
    </section>
  );
}
