'use client';

import { useState } from 'react';
import { createConsultationRequest } from '@/lib/consultations';
import { getErrorMessage } from '@/lib/errors';

export function ConsultationForm({ centerId, centerName }: { centerId: number; centerName: string }) {
  const [guardianName, setGuardianName] = useState('');
  const [phone, setPhone] = useState('');
  const [patientRelation, setPatientRelation] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    try {
      setBusy(true);
      setError('');
      setNotice('');
      await createConsultationRequest({
        centerId,
        guardianName,
        phone,
        patientRelation,
        message,
      });
      setNotice(`${centerName} 상담 요청이 접수되었습니다. 기관 관리자 화면에서 상태를 바로 확인할 수 있습니다.`);
      setGuardianName('');
      setPhone('');
      setPatientRelation('');
      setMessage('');
    } catch (err) {
      setError(getErrorMessage(err, '상담 요청 저장에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="sectionTitle">
        <div>
          <h2>상담 요청</h2>
          <p className="muted inlineDescription">전화 전 간단한 문의를 남기면 기관이 연락처를 보고 후속 안내를 할 수 있습니다.</p>
        </div>
      </div>
      <input className="field" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="보호자 이름" />
      <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" inputMode="tel" />
      <input className="field" value={patientRelation} onChange={(e) => setPatientRelation(e.target.value)} placeholder="어르신과의 관계 (예: 딸, 아들)" maxLength={50} />
      <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="상담 받고 싶은 내용, 희망 입소 시기, 방문 가능 시간" maxLength={1000} />
      <button className="primaryBtn" onClick={onSubmit} disabled={busy}>{busy ? '접수 중...' : '상담 요청 보내기'}</button>
      {notice ? <div className="notice">{notice}</div> : null}
      {error ? <div className="error">{error}</div> : null}
    </section>
  );
}
