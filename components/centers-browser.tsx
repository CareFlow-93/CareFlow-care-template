'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import CenterCard from './center-card'
import { NaverMapView } from './naver-map-view'
import {
  type BrowseMode,
  type CenterFilters,
  type FilterOptionsTree,
  KOREA_VIEWPORT,
  getCenterFilterOptions,
  getCentersByViewport,
  getDistrictOptions,
  getTownOptions,
  searchCenters,
} from '@/lib/centers'
import { getNearbyCenters } from '@/lib/nearby'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { Center, Viewport } from '@/types/domain'

type CenterWithDistance = Center & {
  distanceKm?: number
}

const DEFAULT_FILTERS: CenterFilters = {
  keyword: '',
  city: '',
  district: '',
  town: '',
  typeName: '',
}

const EMPTY_OPTIONS: FilterOptionsTree = {
  cities: [],
  districtsByCity: {},
  townsByCityDistrict: {},
  typeNames: [],
}

export default function CentersBrowser() {
  const [mode, setMode] = useState<BrowseMode>('map')
  const [mapBounds, setMapBounds] = useState<Viewport>(KOREA_VIEWPORT)
  const [filters, setFilters] = useState<CenterFilters>(DEFAULT_FILTERS)
  const [options, setOptions] = useState<FilterOptionsTree>(EMPTY_OPTIONS)
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const districtOptions = useMemo(() => {
    return getDistrictOptions(options, filters.city)
  }, [options, filters.city])

  const townOptions = useMemo(() => {
    return getTownOptions(options, filters.city, filters.district)
  }, [options, filters.city, filters.district])

  const hydrateNearbyCenters = useCallback(async (nearbyRows: { id: number; distance: number }[]) => {
    if (!nearbyRows.length) return [] as CenterWithDistance[]

    const supabase = getSupabaseBrowserClient()
    const ids = nearbyRows.map((row) => row.id)

    const { data, error } = await supabase
      .from('centers')
      .select('*')
      .in('id', ids)

    if (error) throw error

    const centerMap = new Map((data ?? []).map((center) => [center.id, center as Center]))

    return nearbyRows
      .map((row) => {
        const center = centerMap.get(row.id)
        if (!center) return null
        return {
          ...center,
          distanceKm: row.distance,
        } as CenterWithDistance
      })
      .filter(Boolean) as CenterWithDistance[]
  }, [])

  const loadCenters = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      let nextCenters: CenterWithDistance[] = []

      if (mode === 'nearby') {
        if (!userLocation) {
          setCenters([])
          setSelectedCenterId(null)
          return
        }

        const nearbyRows = await getNearbyCenters(userLocation.latitude, userLocation.longitude, 10)
        nextCenters = await hydrateNearbyCenters(nearbyRows)
      } else if (mode === 'map') {
        nextCenters = await getCentersByViewport(mapBounds)
      } else {
        nextCenters = await searchCenters({
          ...filters,
          bounds: mapBounds,
        })
      }

      setCenters(nextCenters)
      setSelectedCenterId((currentId) => {
        if (currentId && nextCenters.some((center) => center.id === currentId)) {
          return currentId
        }

        return nextCenters[0]?.id ?? null
      })
    } catch (loadError) {
      console.error(loadError)
      setError('센터 정보를 불러오지 못했습니다. 환경변수와 Supabase 연결을 확인해 주세요.')
      setCenters([])
      setSelectedCenterId(null)
    } finally {
      setLoading(false)
    }
  }, [filters, hydrateNearbyCenters, mapBounds, mode, userLocation])

  useEffect(() => {
    async function boot() {
      try {
        const filterOptions = await getCenterFilterOptions()
        setOptions(filterOptions)
      } catch (bootError) {
        console.error(bootError)
        setError('필터 옵션을 불러오지 못했습니다. Supabase 연결과 view를 확인해 주세요.')
      }
    }

    void boot()
  }, [])

  useEffect(() => {
    void loadCenters()
  }, [loadCenters])

  const visibleCenters = useMemo<CenterWithDistance[]>(() => {
    return centers as CenterWithDistance[]
  }, [centers])

  const selectedCenter = useMemo(() => {
    return visibleCenters.find((center) => center.id === selectedCenterId) ?? null
  }, [selectedCenterId, visibleCenters])

  const modeLabel =
    mode === 'nearby' ? '내 주변' : mode === 'search' ? '필터 검색' : '지도 탐색'

  async function refreshUserLocation() {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('이 브라우저는 위치정보를 지원하지 않습니다.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (locationError) => reject(locationError),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  async function handleNearby() {
    setLoading(true)
    setError('')

    try {
      const location = await refreshUserLocation()
      setUserLocation(location)
      setMode('nearby')
    } catch (locationError) {
      console.error(locationError)
      setError('위치 정보를 가져오지 못했습니다. 위치 권한을 확인해 주세요.')
      setLoading(false)
    }
  }

  async function handleLocationRefresh() {
    try {
      const location = await refreshUserLocation()
      setUserLocation(location)
      setMode('nearby')
    } catch (locationError) {
      console.error(locationError)
      setError('위치 정보를 새로고침하지 못했습니다.')
    }
  }

  function updateFilter<Key extends keyof CenterFilters>(
    key: Key,
    value: CenterFilters[Key]
  ) {
    setFilters((current) => {
      if (key === 'city') {
        return {
          ...current,
          city: value as string,
          district: '',
          town: '',
        }
      }

      if (key === 'district') {
        return {
          ...current,
          district: value as string,
          town: '',
        }
      }

      return {
        ...current,
        [key]: value,
      }
    })
  }

  function handleSearch() {
    setMode('search')
  }

  function handleReset() {
    setMode('map')
    setFilters(DEFAULT_FILTERS)
    setUserLocation(null)
    setMapBounds(KOREA_VIEWPORT)
    setSelectedCenterId(null)
  }

  return (
    <div className="stack">
      <section className="hero heroCompact">
        <div className="between chipRow">
          <div className="stackXs">
            <span className="chip">CareFlow</span>
            <div>
              <h1>요양기관 찾기</h1>
              <p>
                지도 이동 결과와 리스트를 항상 동기화하고, 필터는 시/도 → 시/군/구 → 읍/면/동 순서로 좁혀집니다.
              </p>
            </div>
          </div>
          <span className="chip">현재 모드: {modeLabel}</span>
        </div>

        <div className="searchGrid">
          <input
            value={filters.keyword}
            onChange={(event) => updateFilter('keyword', event.target.value)}
            placeholder="센터명 검색"
            className="field"
          />

          <select
            value={filters.city}
            onChange={(event) => updateFilter('city', event.target.value)}
            className="select"
          >
            <option value="">시/도 선택</option>
            {options.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={filters.district}
            onChange={(event) => updateFilter('district', event.target.value)}
            disabled={!filters.city}
            className="select"
          >
            <option value="">시/군/구 선택</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>

          <select
            value={filters.town}
            onChange={(event) => updateFilter('town', event.target.value)}
            disabled={!filters.city || !filters.district}
            className="select"
          >
            <option value="">읍/면/동 선택</option>
            {townOptions.map((town) => (
              <option key={town} value={town}>
                {town}
              </option>
            ))}
          </select>

          <select
            value={filters.typeName}
            onChange={(event) => updateFilter('typeName', event.target.value)}
            className="select"
          >
            <option value="">기관 유형 선택</option>
            {options.typeNames.map((typeName) => (
              <option key={typeName} value={typeName}>
                {typeName}
              </option>
            ))}
          </select>
        </div>

        <div className="actionRow">
          <button type="button" className="primaryBtn" onClick={handleSearch}>
            필터 검색
          </button>
          <button type="button" className="ghostBtn" onClick={handleNearby}>
            내 주변
          </button>
          <button
            type="button"
            className="ghostBtn"
            onClick={handleLocationRefresh}
            disabled={!userLocation}
          >
            위치 새로고침
          </button>
          <button type="button" className="ghostBtn" onClick={handleReset}>
            전국 다시 보기
          </button>
        </div>

        <div className="metaRow muted">
          <span>{mode === 'nearby' ? 'RPC 기준 내 주변 재조회' : '지도 bounds 기준 재조회'}</span>
          <span>현재 결과 {visibleCenters.length}개</span>
          {selectedCenter ? <span>선택 센터: {selectedCenter.name}</span> : null}
        </div>

        {error ? <div className="error">{error}</div> : null}
      </section>

      <section className="grid2">
        <div className="panel stackXs">
          <div className="sectionTitle compactTitle">
            <div>
              <h2>지도</h2>
              <p className="inlineDescription">
                지도는 Discovery Layer입니다. 이동하면 같은 범위의 리스트가 함께 갱신됩니다.
              </p>
            </div>
          </div>

          <NaverMapView
            centers={visibleCenters}
            selectedCenterId={selectedCenterId}
            onSelectCenter={(center) => setSelectedCenterId(center.id)}
            onIdleViewport={(viewport) => setMapBounds(viewport)}
            userPoint={userLocation}
          />
        </div>

        <div className="panel stackXs">
          <div className="sectionTitle compactTitle">
            <div>
              <h2>센터 리스트</h2>
              <p className="inlineDescription">
                {mode === 'nearby' ? '현재 위치 기준 거리순 결과입니다.' : '지도 범위와 동일한 결과만 표시됩니다.'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty">센터 정보를 불러오는 중입니다...</div>
          ) : visibleCenters.length === 0 ? (
            <div className="empty">현재 조건과 지도 범위에서 검색된 센터가 없습니다.</div>
          ) : (
            <div className="list scrollList">
              {visibleCenters.map((center) => {
                const isSelected = center.id === selectedCenterId

                return (
                  <button
                    key={center.id}
                    type="button"
                    className={`cardButton ${isSelected ? 'cardButtonActive' : ''}`}
                    onClick={() => setSelectedCenterId(center.id)}
                  >
                    <CenterCard center={center} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
