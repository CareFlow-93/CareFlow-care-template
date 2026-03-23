'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { getOwnClaims, getPendingClaims, reviewClaim } from '@/lib/claims';
import { getErrorMessage } from '@/lib/errors';
import { assertEmail, assertPassword, sanitizeRoleForProfileUpdate } from '@/lib/validators';
import type { Claim, UserRole } from '@/types/domain';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'guardian', label: '보호자 / 이용자' },
  { value: 'center_admin', label: '센터 관리자' },
  { value: 'demo_admin', label: '운영자(개발자)' },
];

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile, authUser, loading, error: authError, signInWithEmail, signUpWithEmail, signOutUser, saveProfile } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('guardian');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);

  useEffect(() => {
    setEmail(authUser?.email ?? '');
    setDisplayName(profile?.display_name ?? '');
    setPhone(profile?.phone ?? '');
    setRole(profile?.role ?? 'guardian');
  }, [authUser?.email, profile?.display_name, profile?.phone, profile?.role]);

  useEffect(() => {
    if (!profile) {
      setClaims([]);
      setPendingClaims([]);
      return;
    }
    const currentProfile = profile;
    let active = true;

    async function load() {
      try {
        const own = await getOwnClaims(currentProfile.id);
        if (active) setClaims(own);
        if (currentProfile.role === 'demo_admin' || currentProfile.role === 'center_admin') {
          const pending = await getPendingClaims(currentProfile);
          if (active) setPendingClaims(pending);
        }
      } catch {
        if (active) {
          setClaims([]);
          setPendingClaims([]);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.role, profile?.center_id]);

  useEffect(() => {
    if (profile && params.get('intent') === 'nearby') router.replace('/?nearby=1');
  }, [profile, params, router]);

  const claimStatusText = useMemo(() => (profile?.center_id ? `센터 #${profile.center_id} 연결됨` : '미연결'), [profile?.center_id]);
  const editableRole = profile ? sanitizeRoleForProfileUpdate(role, profile.role) : role;

  async function handleAuthSubmit() {
    try {
      setBusy(true);
      setError('');
      setNotice('');

      const safeEmail = assertEmail(email);
      const safePassword = assertPassword(password);

      if (mode === 'signin') {
        await signInWithEmail(safeEmail, safePassword);
        setNotice('로그인되었습니다.');
      } else {
        if (!agreeTerms) throw new Error('회원가입 전 약관 동의가 필요합니다.');
        if (safePassword !== passwordConfirm) throw new Error('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        const result = await signUpWithEmail({ email: safeEmail, password: safePassword, displayName, phone, role });
        setNotice(result.needsEmailConfirmation ? '회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.' : '회원가입과 로그인에 성공했습니다.');
      }
    } catch (err) {
      setError(getErrorMessage(err, '인증 처리에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleProfileSave() {
    try {
      setBusy(true);
      setError('');
      setNotice('');
      await saveProfile({ display_name: displayName, phone, role: editableRole });
      setNotice('프로필이 저장되었습니다.');
    } catch (err) {
      setError(getErrorMessage(err, '프로필 저장에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleReview(claimId: number, status: 'approved' | 'rejected') {
    if (!profile) return;
    try {
      setBusy(true);
      setError('');
      await reviewClaim({ claimId, status, reviewer: profile });
      setPendingClaims(await getPendingClaims(profile));
      setNotice(status === 'approved' ? '소속 센터 신청을 승인했습니다.' : '소속 센터 신청을 거절했습니다.');
    } catch (err) {
      setError(getErrorMessage(err, '신청 상태 변경에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel stack">
        <div className="sectionTitle">
          <div>
            <h2>{profile ? '내 계정' : '로그인 / 회원가입'}</h2>
            <p className="muted inlineDescription">회원가입 후 소속 센터 등록 승인까지 완료되면 센터 수정과 활동 소식 작성 권한이 열립니다.</p>
          </div>
        </div>

        {profile ? (
          <>
            <div className="detailGrid">
              <div><span>이메일</span><strong>{authUser?.email || '-'}</strong></div>
              <div><span>권한</span><strong>{profile.role}</strong></div>
              <div><span>센터 연결</span><strong>{claimStatusText}</strong></div>
              <div><span>전화번호</span><strong>{profile.phone || '-'}</strong></div>
            </div>
            <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="이름" />
            <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" />
            <select className="select" value={editableRole} onChange={(e) => setRole(e.target.value as UserRole)}>
              {ROLE_OPTIONS.filter((option) => profile.role === 'demo_admin' || option.value !== 'demo_admin').map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="actionRow">
              <button className="primaryBtn" onClick={() => void handleProfileSave()} disabled={busy}>프로필 저장</button>
              <button className="ghostBtn" onClick={() => void signOutUser()} disabled={busy}>로그아웃</button>
              {!profile.center_id ? <Link href="/claim" className="ghostBtn">소속 센터 등록하기</Link> : null}
              {profile.center_id ? <Link href={`/centers/${profile.center_id}`} className="ghostBtn">내 센터 보기</Link> : null}
            </div>
          </>
        ) : (
          <>
            <div className="tabRow">
              <button type="button" className={`tabBtn ${mode === 'signin' ? 'tabBtnActive' : ''}`} onClick={() => setMode('signin')}>로그인</button>
              <button type="button" className={`tabBtn ${mode === 'signup' ? 'tabBtnActive' : ''}`} onClick={() => setMode('signup')}>회원가입</button>
            </div>
            <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" />
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
            {mode === 'signup' ? (
              <>
                <input className="field" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="비밀번호 확인" />
                <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="이름" />
                <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" />
                <select className="select" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                  {ROLE_OPTIONS.filter((option) => option.value !== 'demo_admin').map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <label className="checkboxRow">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} /> <span>서비스 이용약관 및 개인정보 수집·이용에 동의합니다.</span>
                </label>
              </>
            ) : null}
            <button className="primaryBtn" onClick={() => void handleAuthSubmit()} disabled={busy || loading}>
              {busy ? '처리 중...' : mode === 'signin' ? '로그인' : '회원가입'}
            </button>
          </>
        )}

        {notice ? <div className="notice">{notice}</div> : null}
        {error ? <div className="error">{error}</div> : null}
        {authError ? <div className="error">{authError}</div> : null}
      </section>

      {profile ? (
        <section className="panel stack">
          <div className="sectionTitle">
            <div>
              <h2>내 소속 센터 등록 요청</h2>
              <p className="muted inlineDescription">신청 내역은 계정에 저장되어 이후 승인 결과와 함께 추적됩니다.</p>
            </div>
          </div>
          <div className="list compactList">
            {claims.length ? claims.map((claim) => (
              <div key={claim.id} className="pickerItem pickerStatic">
                <strong>{claim.centers?.name || `센터 #${claim.center_id}`}</strong>
                <span>{claim.status} · {new Date(claim.created_at).toLocaleString('ko-KR')}</span>
              </div>
            )) : <div className="empty">아직 등록 요청이 없습니다.</div>}
          </div>
        </section>
      ) : null}

      {profile?.role === 'demo_admin' ? (
        <section className="panel stack">
          <div className="sectionTitle">
            <div>
              <h2>운영자 승인 대기함</h2>
              <p className="muted inlineDescription">운영자 계정에서는 소속 센터 등록 요청을 승인하면 곧바로 해당 사용자에게 센터 관리 권한이 연결됩니다.</p>
            </div>
          </div>
          <div className="list compactList">
            {pendingClaims.length ? pendingClaims.map((claim) => (
              <div key={claim.id} className="pickerItem pickerStatic">
                <strong>{claim.centers?.name || `센터 #${claim.center_id}`}</strong>
                <span>{claim.profiles?.display_name || claim.profiles?.email || claim.user_id}</span>
                <span>{claim.message || '메시지 없음'}</span>
                <div className="actionRow" style={{ marginTop: 10 }}>
                  <button className="primaryBtn" disabled={busy} onClick={() => void handleReview(claim.id, 'approved')}>승인</button>
                  <button className="dangerBtn" disabled={busy} onClick={() => void handleReview(claim.id, 'rejected')}>거절</button>
                </div>
              </div>
            )) : <div className="empty">대기 중인 신청이 없습니다.</div>}
          </div>
        </section>
      ) : null}
    </div>
  );
}
