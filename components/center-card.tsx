import Link from 'next/link'
import { cleanCenterName } from '@/lib/center-utils'
import { createNaverMapLink } from '@/lib/naver-map-link'
import type { Center } from '@/types/domain'

type CenterCardProps = {
  center: Center & {
    distanceKm?: number
  }
}

export default function CenterCard({ center }: CenterCardProps) {
  const centerName = cleanCenterName(center.name)
  const locationText = [center.city, center.district, center.town].filter(Boolean).join(' ')
  const naverMapLink = createNaverMapLink(center.name, center.address)

  return (
    <article className="centerCard">
      <div className="between metaRow">
        <div className="chipRow">
          <span className="chip">요양기관</span>
          {center.distanceKm !== undefined ? (
            <span className="chip">약 {center.distanceKm.toFixed(1)}km</span>
          ) : null}
        </div>

        {center.rating_grade ? <span className="chip">{center.rating_grade}등급</span> : null}
      </div>

      <div className="stackXs">
        <h3>{centerName || '이름 없는 센터'}</h3>

        <div className="meta">
          {locationText ? <span>{locationText}</span> : null}
          {center.address ? <span>{center.address}</span> : null}
          {center.type_name ? <span>{center.type_name}</span> : null}
          {typeof center.capacity_total === 'number' ? (
            <span>
              정원 {center.capacity_total}
              {typeof center.capacity_current === 'number'
                ? ` / 현원 ${center.capacity_current}`
                : ''}
            </span>
          ) : null}
        </div>
      </div>

      <div className="centerActionRow">
        <Link href={`/centers/${center.id}`} className="primaryBtn">
          상세보기
        </Link>
        <a
          href={naverMapLink}
          target="_blank"
          rel="noreferrer"
          className="ghostBtn"
        >
          네이버 지도
        </a>
      </div>
    </article>
  )
}
