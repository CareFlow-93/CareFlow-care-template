"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SectionCard } from '@/components/layout';
import NaverMap from '@/components/NaverMap';
import { supabase } from '@/lib/supabase';

type SearchCenter = { id: string; name: string; address: string | null; latitude: number; longitude: number; region_text: string | null; type_name: string | null; };

export default function CentersPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchCenter[]>([]);
  const [focused, setFocused] = useState<SearchCenter | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const trimmed = keyword.trim();
    if (!trimmed) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await client.from('centers').select('id,name,address,latitude,longitude,region_text,type_name').ilike('name', `%${trimmed}%`).limit(20);
      setResults((data || []) as SearchCenter[]);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [keyword]);

  const hasKeyword = useMemo(() => keyword.trim().length > 0, [keyword]);

  return (
    <div className="stackLg">
      <SectionCard>
        <div className="stackMd">
          <h1>전국 장기요양기관 지도</h1>
          <div className="searchWrap">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="센터명 검색" />
            {hasKeyword ? <div className="searchDropdown">{loading ? <div className="searchItem mutedText">검색 중...</div> : null}{!loading && results.length === 0 ? <div className="searchItem mutedText">검색 결과 없음</div> : null}{results.map((center) => <button key={center.id} type="button" className="searchItem buttonLike" onClick={() => { setFocused(center); setKeyword(center.name); setResults([]); }}><strong>{center.name}</strong><span>{center.region_text || center.address || ''}</span></button>)}</div> : null}
          </div>
          <NaverMap focusCenter={focused} />
        </div>
      </SectionCard>
      {focused ? <SectionCard><div className="stackSm"><h2>{focused.name}</h2><p>{focused.address}</p><div className="row"><Link href={`/centers/${focused.id}`} className="button">센터 상세</Link><Link href="/manager" className="button secondary">관리자 인증 요청</Link></div></div></SectionCard> : null}
    </div>
  );
}
