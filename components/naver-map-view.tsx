'use client';

import { useEffect, useRef, useState } from 'react';
import { ENV } from '@/lib/env';
import type { Center, Viewport } from '@/types/domain';

declare global {
  interface Window {
    naver?: {
      maps?: {
        Map: new (el: HTMLElement, options: Record<string, unknown>) => any;
        Marker: new (options: Record<string, unknown>) => any;
        InfoWindow: new (options: Record<string, unknown>) => any;
        LatLng: new (lat: number, lng: number) => any;
        Event: {
          addListener: (target: any, eventName: string, handler: () => void) => void;
        };
      };
    };
  }
}

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`${id} load error`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`${id} load error`));
    document.head.appendChild(script);
  });
}

export function NaverMapView({
  centers,
  selectedCenterId,
  onSelectCenter,
  onIdleViewport,
  userPoint,
}: {
  centers: Center[];
  selectedCenterId: number | null;
  onSelectCenter: (center: Center) => void;
  onIdleViewport: (viewport: Viewport) => void;
  userPoint: { latitude: number; longitude: number } | null;
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let canceled = false;

    async function boot() {
      if (!mapEl.current) return;
      if (!ENV.naverMapClientId) {
        setMapError('NAVER MAP Client ID가 없어 목록형 탐색 화면으로 전환했습니다.');
        return;
      }
      try {
        await loadScript('careflow-naver-sdk', `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ENV.naverMapClientId}`);
        if (canceled || !window.naver?.maps || mapRef.current || !mapEl.current) return;

        const map = new window.naver.maps.Map(mapEl.current, {
          center: new window.naver.maps.LatLng(36.35, 127.8),
          zoom: 7,
          minZoom: 6,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
        });
        mapRef.current = map;

        window.naver.maps.Event.addListener(map, 'idle', () => {
          const bounds = map.getBounds();
          onIdleViewport({
            south: bounds.getMin().y,
            north: bounds.getMax().y,
            west: bounds.getMin().x,
            east: bounds.getMax().x,
          });
        });
      } catch {
        setMapError('지도를 불러오지 못했습니다. 현재는 목록 탐색과 네이버지도 외부 링크를 사용할 수 있습니다.');
      }
    }

    void boot();
    return () => {
      canceled = true;
    };
  }, [onIdleViewport]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));

    markersRef.current = centers
      .filter((center) => typeof center.latitude === 'number' && typeof center.longitude === 'number')
      .map((center) => {
        const marker = new window.naver!.maps!.Marker({
          map,
          position: new window.naver!.maps!.LatLng(center.latitude as number, center.longitude as number),
          title: center.name,
        });
        const info = new window.naver!.maps!.InfoWindow({
          content: `<div style="padding:10px 12px;min-width:180px"><strong>${center.name}</strong><br/>${center.address || ''}</div>`,
        });
        window.naver!.maps!.Event.addListener(marker, 'click', () => {
          onSelectCenter(center);
          info.open(map, marker);
        });
        return marker;
      });
  }, [centers, onSelectCenter]);

  useEffect(() => {
    const map = mapRef.current;
    const target = centers.find((center) => center.id === selectedCenterId);
    if (!map || !window.naver?.maps || !target || typeof target.latitude !== 'number' || typeof target.longitude !== 'number') return;
    map.panTo(new window.naver.maps.LatLng(target.latitude, target.longitude));
  }, [centers, selectedCenterId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps || !userPoint) return;
    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.naver.maps.Marker({ map });
    }
    userMarkerRef.current.setPosition(new window.naver.maps.LatLng(userPoint.latitude, userPoint.longitude));
    userMarkerRef.current.setMap(map);
    map.panTo(new window.naver.maps.LatLng(userPoint.latitude, userPoint.longitude));
    map.setZoom(14, true);
  }, [userPoint]);

  if (mapError) {
    return (
      <div className="mapBox mapFallback">
        <div className="stackXs">
          <strong>지도를 대신할 빠른 탐색 화면</strong>
          <span className="muted">{mapError}</span>
          <span className="muted">현재 검색된 센터 {centers.length}개</span>
        </div>
      </div>
    );
  }

  return <div ref={mapEl} className="mapBox" />;
}
