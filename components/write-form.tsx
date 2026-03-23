'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPost, uploadPostImage } from '@/lib/posts';
import { searchCenters } from '@/lib/centers';
import { useAuth } from '@/components/auth-provider';
import { getErrorMessage } from '@/lib/errors';
import { validateFreeText } from '@/lib/validators';
import type { Center, PostVisibility } from '@/types/domain';

const VISIBILITY_OPTIONS: Array<{ value: PostVisibility; label: string }> = [
  { value: 'public', label: '전체 공개' },
  { value: 'guardians', label: '센터 보호자' },
  { value: 'staff', label: '센터 직원' },
];

export function WriteForm() {
  const params = useSearchParams();
  const { profile, loading } = useAuth();
  const [centerId, setCenterId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Center[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const initialCenterId = params.get('centerId');
    if (profile?.center_id) setCenterId(String(profile.center_id));
    else if (initialCenterId) setCenterId(initialCenterId);
  }, [params, profile?.center_id]);

  const canWrite = profile?.role === 'center_admin' || profile?.role === 'demo_admin';
  const canSubmit = useMemo(() => Boolean(canWrite && centerId.trim() && !busy), [canWrite, centerId, busy]);

  async function handleSearchCenter() {
    try {
      setError('');
      setSearchResults(await searchCenters({ keyword, limit: 10 }));
    } catch (err) {
      setError(getErrorMessage(err, '센터 검색에 실패했습니다.'));
    }
  }

  async function onSubmit() {
    const numericCenterId = Number(centerId);
    if (!profile) return setError('로그인 후 활동 소식을 작성할 수 있습니다.');
    if (!canWrite) return setError('센터 관리자 계정만 활동 소식을 작성할 수 있습니다.');
    if (profile.role !== 'demo_admin' && profile.center_id !== numericCenterId) {
      return setError('본인에게 연결된 센터에만 작성할 수 있습니다.');
    }
    if (!numericCenterId) return setError('소속 센터를 선택해주세요.');

    try {
      setBusy(true);
      setError('');
      setNotice('');
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadPostImage(file, numericCenterId, profile.id);
      await createPost({
        userId: profile.id,
        centerId: numericCenterId,
        title: validateFreeText(title, '제목', 120),
        content: validateFreeText(content, '내용', 2000),
        imageUrl,
        visibility,
      });
      setNotice('센터 활동 소식이 등록되었습니다.');
      setTitle('');
      setContent('');
      setFile(null);
      setVisibility('public');
    } catch (err) {
      setError(getErrorMessage(err, '활동 소식 작성에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="sectionTitle">
        <div>
          <h2>우리 센터 활동 알리기</h2>
          <p className="muted inlineDescription">사진, 소속 센터, 제목, 내용, 공개 범위를 순서대로 입력하세요.</p>
        </div>
      </div>

      {!profile ? <div className="notice">로그인 후 이용 가능합니다.</div> : null}
      {profile && !profile.center_id && profile.role !== 'demo_admin' ? <div className="notice">소속 센터 등록 승인이 완료되면 작성 기능이 열립니다.</div> : null}

      <input className="field" type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

      {profile?.role === 'demo_admin' ? (
        <>
          <div className="searchRow searchRowWide">
            <input
              className="searchInput"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="센터명 검색"
              onKeyDown={(e) => e.key === 'Enter' && void handleSearchCenter()}
            />
            <button className="ghostBtn" type="button" onClick={() => void handleSearchCenter()}>
              센터 찾기
            </button>
          </div>
          {searchResults.length ? (
            <div className="list compactList">
              {searchResults.map((center) => (
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
        </>
      ) : null}

      <input className="field" value={centerId} onChange={(e) => setCenterId(e.target.value)} placeholder="소속 센터 ID" disabled={profile?.role !== 'demo_admin'} inputMode="numeric" />
      <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" maxLength={120} />
      <textarea className="textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" maxLength={2000} />
      <select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value as PostVisibility)}>
        {VISIBILITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <button className="primaryBtn" onClick={() => void onSubmit()} disabled={!canSubmit || !profile || loading}>
        {busy ? '등록 중...' : '활동 소식 등록'}
      </button>
      {notice ? <div className="notice">{notice}</div> : null}
      {error ? <div className="error">{error}</div> : null}
    </section>
  );
}
