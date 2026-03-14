# CareFlow MVP Render Package

## 포함 기능
- 전국 장기요양기관 지도
- viewport 기반 센터 조회
- 센터 검색 자동완성
- 센터 상세 공단 정보
- 기록 작성
- 사진 업로드
- 댓글
- 좋아요
- 센터 관리자 인증 요청
- 로컬 개발자 로그인

## 환경변수
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

## 배포
```bash
npm install
npm run build
npm run start
```

## Supabase 적용 순서
1. `db/full_reset_setup.sql` 실행
2. `centers_raw`에 `careflow_centers_all_geocoded.csv` Import
3. SQL 파일 마지막 `insert into centers ... select ... from centers_raw` 블록 다시 실행
4. Render 환경변수 입력 후 배포

## 참고
- `.next`, `node_modules`, CSV 원본은 포함하지 않았습니다.
- 현재 구조는 로컬 로그인 유지 목적의 MVP입니다. 운영 전환 시 Supabase Auth + RLS 재설계가 필요합니다.
