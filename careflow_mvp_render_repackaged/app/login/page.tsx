"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SectionCard } from '@/components/layout';
import { loginDeveloper } from '@/lib/local-auth';

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState('방민');
  const [password, setPassword] = useState('als53794207!');
  const [error, setError] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = loginDeveloper(id, password);
    if (!result.ok) { setError(result.message); return; }
    router.push('/centers');
  }

  return <SectionCard><form className="stackMd" onSubmit={onSubmit}><h1>로컬 개발자 로그인</h1><input value={id} onChange={(e) => setId(e.target.value)} placeholder="ID" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="PW" />{error ? <p className="errorText">{error}</p> : null}<button className="button" type="submit">로그인</button></form></SectionCard>;
}
