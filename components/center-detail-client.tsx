'use client'

import { cleanCenterName } from '../lib/center-utils'
import { createNaverMapLink } from '../lib/naver-map-link'

type CenterDetailClientProps = {
  center: {
    id: string | number
    name?: string | null
    address?: string | null
    phone?: string | null
    type_name?: string | null
    rating_grade?: string | null
    capacity_total?: number | null
    capacity_current?: number | null
    staff_social_worker?: number | null
    staff_caregiver?: number | null
  }
}

export default function CenterDetailClient({ center }: CenterDetailClientProps) {
  const centerName = cleanCenterName(center.name)
  const naverMapLink = createNaverMapLink(center.name, center.address)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white px-6 py-6 sm:px-8">
          <div className="mb-3 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-stone-600">
            CENTER PROFILE
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {centerName || '이름 없는 센터'}
          </h1>

          {center.type_name ? (
            <p className="mt-2 text-sm text-stone-500">{center.type_name}</p>
          ) : null}
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {center.address ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-1 text-xs font-semibold tracking-wide text-stone-500">
                  주소
                </p>
                <p className="text-sm leading-6 text-stone-800">{center.address}</p>
              </div>
            ) : null}

            {center.phone ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-1 text-xs font-semibold tracking-wide text-stone-500">
                  전화
                </p>
                <p className="text-sm leading-6 text-stone-800">{center.phone}</p>
              </div>
            ) : null}

            {center.rating_grade ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-1 text-xs font-semibold tracking-wide text-stone-500">
                  평가등급
                </p>
                <p className="text-sm leading-6 text-stone-800">{center.rating_grade}</p>
              </div>
            ) : null}

            {typeof center.capacity_total === 'number' ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-1 text-xs font-semibold tracking-wide text-stone-500">
                  정원 / 현원
                </p>
                <p className="text-sm leading-6 text-stone-800">
                  정원 {center.capacity_total}
                  {typeof center.capacity_current === 'number'
                    ? ` / 현원 ${center.capacity_current}`
                    : ''}
                </p>
              </div>
            ) : null}

            {typeof center.staff_social_worker === 'number' ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-1 text-xs font-semibold tracking-wide text-stone-500">
                  사회복지사
                </p>
                <p className="text-sm leading-6 text-stone-800">
                  {center.staff_social_worker}
                </p>
              </div>
            ) : null}

            {typeof center.staff_caregiver === 'number' ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-1 text-xs font-semibold tracking-wide text-stone-500">
                  요양보호사
                </p>
                <p className="text-sm leading-6 text-stone-800">
                  {center.staff_caregiver}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={naverMapLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-600 bg-white px-5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              네이버 지도 보기
            </a>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              소속 센터 등록하기
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
