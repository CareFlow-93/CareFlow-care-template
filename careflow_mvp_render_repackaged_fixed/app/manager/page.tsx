"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SectionCard } from '@/components/layout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/local-auth';

type CenterOption = { id: string; name: string };

export default function ManagerPage() {
  const searchParams = useSearchParams();
  const [centerId, setCenterId] = useState(searchParams.get('centerId') || '');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [centers, setCenters] = useState<CenterOption[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadCenters() {
      const client = supabase;
      if (!client) return;
      const { data } = await client.from('centers').select('id,name').limit(50);
      setCenters((data || []) as CenterOption[]);
    }
    loadCenters();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const client = supabase;
    if (!client) return;
    const user = getCurrentUser();
    await client.from('manager_claims').insert({ center_id: centerId || null, requester_name: user?.name || '미로그인 사용자', requester_phone: phone, note, status: 'pending' });
    setMessage('관리자 인증 요청이 저장되었습니다.');
    setNote('');
  }

  return <SectionCard><form className="stackMd" onSubmit={onSubmit}><h1>센터 관리자 인증 요청</h1><select value={centerId} onChange={(e) => setCenterId(e.target.value)}><option value="">센터 선택</option>{centers.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}</select><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" /><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder="직책, 인증 메모" />{message ? <p className="successText">{message}</p> : null}<button className="button" type="submit">요청 저장</button></form></SectionCard>;
}
