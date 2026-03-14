"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    naver?: any;
    MarkerClustering?: any;
  }
}

type CenterMapRow = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  region_text: string | null;
  type_name: string | null;
};

export default function NaverMap({ focusCenter }: { focusCenter?: CenterMapRow | null }) {
  const router = useRouter();
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clusterRef = useRef<any>(null);
  const [status, setStatus] = useState('지도를 준비 중입니다.');

  useEffect(() => {
    if (!mapNodeRef.current || !window.naver?.maps) return;

    const map = new window.naver.maps.Map(mapNodeRef.current, {
      center: new window.naver.maps.LatLng(36.35, 127.85),
      zoom: 7,
      minZoom: 6,
    });
    mapRef.current = map;

    const clearMarkers = () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (clusterRef.current?.setMap) clusterRef.current.setMap(null);
      clusterRef.current = null;
    };

    const loadCenters = async () => {
      const client = supabase;
      if (!client) {
        setStatus('Supabase 환경변수가 필요합니다.');
        return;
      }
      const bounds = map.getBounds();
      const south = bounds.getSW().lat();
      const north = bounds.getNE().lat();
      const west = bounds.getSW().lng();
      const east = bounds.getNE().lng();
      const { data, error } = await client
        .from('centers')
        .select('id,name,address,latitude,longitude,region_text,type_name')
        .gte('latitude', south)
        .lte('latitude', north)
        .gte('longitude', west)
        .lte('longitude', east)
        .limit(250);
      if (error) {
        setStatus(error.message);
        return;
      }
      clearMarkers();
      const rows = (data || []) as CenterMapRow[];
      setStatus(`${rows.length}개 센터 표시 중`);
      markersRef.current = rows.map((center) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(center.latitude, center.longitude),
          title: center.name,
        });
        const info = new window.naver.maps.InfoWindow({
          content: `<div style="padding:10px;min-width:180px"><strong>${center.name}</strong><br/>${center.region_text || ''}<br/>${center.type_name || ''}</div>`,
        });
        window.naver.maps.Event.addListener(marker, 'click', () => {
          info.open(map, marker);
          router.push(`/centers/${center.id}`);
        });
        return marker;
      });

      if (window.MarkerClustering) {
        clusterRef.current = new window.MarkerClustering({
          minClusterSize: 2,
          maxZoom: 13,
          map,
          markers: markersRef.current,
          disableClickZoom: false,
          gridSize: 120,
          icons: [1, 2, 3, 4].map(() => ({
            content: '<div style="width:42px;height:42px;border-radius:999px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff"></div>',
            size: new window.naver.maps.Size(42, 42),
            anchor: new window.naver.maps.Point(21, 21),
          })),
          indexGenerator: [10, 30, 70, 150],
          stylingFunction: (clusterMarker: any, count: number) => {
            const el = clusterMarker.getElement()?.querySelector('div');
            if (el) el.textContent = String(count);
          },
        });
      } else {
        markersRef.current.forEach((marker) => marker.setMap(map));
      }
    };

    window.naver.maps.Event.addListener(map, 'idle', loadCenters);
    loadCenters();
    return () => clearMarkers();
  }, [router]);

  useEffect(() => {
    if (!focusCenter || !mapRef.current || !window.naver?.maps) return;
    mapRef.current.panTo(new window.naver.maps.LatLng(focusCenter.latitude, focusCenter.longitude));
    mapRef.current.setZoom(12);
  }, [focusCenter]);

  return <div><div ref={mapNodeRef} className="mapFrame" /><p className="mutedText">{status}</p></div>;
}
