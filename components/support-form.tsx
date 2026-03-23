'use client';

import { useState } from 'react';
import { createInquiry } from '@/lib/inquiries';
import { getErrorMessage } from '@/lib/errors';

export function SupportForm() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    try {
      setBusy(true);
      setError('');
      setNotice('');
      await createInquiry({ name, organization, role, phone, email, message });
      setNotice('문의 / 건의 사항이 접수되었습니다. 개발자 계정에서 확인할 수 있습니다.');
      setName('');
      setOrganization('');
      setRole('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(getErrorMessage(err, '문의 접수에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="sectionTitle">
        <div>
          <h2>문의 / 건의 사항</h2>
          <p className="muted inlineDescription">기관명, 이름, 직책, 연락처 등 회신에 필요한 정보를 함께 남겨주세요. 내용은 비공개로 저장됩니다.</p>
        </div>
      </div>
      <input className="field" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="기관명" />
      <div className="searchRow searchRowWide">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
        <input className="field" value={role} onChange={(e) => setRole(e.target.value)} placeholder="직책" />
      </div>
      <div className="searchRow searchRowWide">
        <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" />
        <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" />
      </div>
      <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="문의나 개선 의견을 자유롭게 적어주세요." maxLength={2000} />
      <button className="primaryBtn" disabled={busy} onClick={() => void handleSubmit()}>
        {busy ? '전송 중...' : '보내기'}
      </button>
      {notice ? <div className="notice">{notice}</div> : null}
      {error ? <div className="error">{error}</div> : null}
    </section>
  );
}
