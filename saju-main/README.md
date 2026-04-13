# 🔮 별숨 — AI 사주 × 점성술 앱

AI 기반 사주 & 서양 점성술 상담 앱

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

## 📦 배포 (Vercel)

1. GitHub에 push
2. vercel.com 에서 repo 연결
3. 자동 배포 완료!

## 🔑 환경변수 (Vercel 대시보드에서 설정)

- 현재 데모 버전은 별도 API 키 불필요
- 실서비스 전환 시 Anthropic API 키 설정 필요

## 📁 구조

```
minjung-app/
├── src/
│   ├── App.jsx      ← 앱 전체 코드
│   └── main.jsx     ← 진입점
├── index.html
├── vite.config.js
└── package.json
```
