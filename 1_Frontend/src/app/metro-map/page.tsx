'use client';

// 2026 지방선거 광역단체장 출마자 여론조사/AI평가 지도
// /metro-map

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PARTY_COLORS: Record<string, { fill: string; text: string; border: string }> = {
  '더불어민주당': { fill: '#1B4FBF', text: '#FFFFFF', border: '#0D3A9E' },
  '국민의힘':     { fill: '#C9151E', text: '#FFFFFF', border: '#A01018' },
  '조국혁신당':   { fill: '#003F87', text: '#FFFFFF', border: '#002A5C' },
  '개혁신당':     { fill: '#FF7210', text: '#FFFFFF', border: '#CC5A00' },
  '정의당':       { fill: '#F5C518', text: '#1F2937', border: '#D4A800' },
  '진보당':       { fill: '#E83030', text: '#FFFFFF', border: '#B52020' },
  '국민의당':     { fill: '#00C7AE', text: '#FFFFFF', border: '#009E8C' },
  '새로운미래':   { fill: '#7C3AED', text: '#FFFFFF', border: '#5B21B6' },
  '무소속':       { fill: '#6B7280', text: '#FFFFFF', border: '#4B5563' },
};
const DEFAULT_COLOR = { fill: '#D1D5DB', text: '#374151', border: '#9CA3AF' };
const UNSCORED_COLOR = { fill: '#E5E7EB', text: '#9CA3AF', border: '#D1D5DB' };

function partyColor(party?: string) {
  if (!party) return DEFAULT_COLOR;
  return PARTY_COLORS[party] || DEFAULT_COLOR;
}

const REGION_FULL: Record<string, string> = {
  '서울': '서울특별시', '인천': '인천광역시', '경기': '경기도',
  '강원': '강원특별자치도', '충북': '충청북도', '세종': '세종특별자치시',
  '충남': '충청남도', '대전': '대전광역시', '경북': '경상북도',
  '전북': '전북특별자치도', '대구': '대구광역시', '경남': '경상남도',
  '광주': '광주광역시', '전남': '전라남도', '울산': '울산광역시',
  '부산': '부산광역시', '제주': '제주특별자치도',
};
const REGION_SHORT: Record<string, string> = Object.fromEntries(
  Object.entries(REGION_FULL).map(([k, v]) => [v, k])
);

const METRO_ORDER = [
  '서울', '인천', '경기', '강원',
  '충남', '대전', '세종', '충북', '경북',
  '전북', '대구', '경남', '울산', '부산',
  '광주', '전남', '제주',
];

// ─── SVG 경로 (southkorea-maps popong, CC BY 4.0) ────────────────────────────

const REGION_PATHS = [
  { id: '서울', labelX: 41, labelY: 43, d: 'M36.5,45.3c0,0,4.6,0.6,5.5,1.3c0.9,0.7,3.3,0.3,3.7-1c0.4-1.3,2-0.5,2.8-1.3s0.8-1.9,0.4-2.9c-0.3-1-0.8-0.7-0.8-2.1c-0.1-1.3-1.3-3.1-2.6-4c-1.3-0.8-3,0-3.5,0.7c-0.6,0.7-5.6,5.2-5.6,5.2S37.3,42.6,36.5,45.3z' },
  { id: '인천', labelX: 18, labelY: 50, d: 'M31.1,51.1c0.3-3.5-1.3-5.5-3.8-5.7c-2.5-0.2-2.2,5.2-6.6,0c-4.4-5.2-0.8-4.9-1.5-6.2c-0.7-1.3-3.7-0.7-4.6-1.3c-0.8-0.7-2-1.5-0.7-3c1.4-1.5,1.7-2.5,3-3.9c1.4-1.3,2.4,0.6,4-0.7c0.6-0.5,1-3,2.7-2.2s2.6,2.4,3.2,3.2c0,0,0.7,1.4,3,0.9l0,0c0,0-4,3.2-1.8,4.8c0,0,0.8-0.3,0.8,3.1c0,0-0.3,0.8,1.9,0.2c2.3-0.6,4.4-0.6,5.1,0.5c0.7,1.1,2.5,3.9-2.2,7.6L31.2,51L31.1,51.1z' },
  { id: '경기', labelX: 44, labelY: 60, d: 'M67.7,57.8l0-0.3c0,0,0.4-5.1,0.8-6.6c0.4-1.5,0.1-3.9-0.3-4.8c-0.3-0.8,0.1-1.5,0.1-1.5c2.8-6.1-1.8-4.4-3.4-4.8c-0.9-0.2-3.4-0.8-3.7-2c-0.3-1.3-1.1-3.8-1.1-5.8s1-2.7,1-3.7c0-1,1.4-4.4-7.1-8.9c-8.5-4.4-6.1-7.4-6.1-7.4s-8.6,2.1-9.2,2.5s-3,2-3.9,2.2c-0.7,0.2-2.8,1,0,2.2s5.2,2.1,1.2,4.8c-4,2.7-4.5,0.9-2.9,2.7c1.6,1.8,1.2,3.5-3,5.5c0,0-4.1,3.3-1.9,4.9c0,0,0.8-0.3,0.8,3.1c0,0-0.3,0.8,1.9,0.2c2.3-0.6,4.4-0.6,5.1,0.5c0.7,1.1,2.5,3.9-2.2,7.6l-2.6,2.8c0,0,0.1,2.8-1.3,3.3c-1.5,0.5-2.1,1.9-0.9,3.6c1.2,1.7,4.5,5.4,4.6,5.8c0.1,0.5,2.3,5.4,9.4,3.1c0,0,2.7-1.6,7,0s5.1,1.3,5.1,1.3s2.2-4.2,3.1-4.7c0.9-0.5,3.3-0.9,4.5-1.6c1.2-0.7,4.2-3.3,4.2-3.3l0.6-0.5L67.7,57.8z' },
  { id: '강원', labelX: 95, labelY: 42, d: 'M119.7,56.3c0,0-2.8,4.9-5.1,4.8c-2.3-0.1-5.2-1.2-5.7-1.2c-0.5,0-1.4,0.3-1.8,1.2c-0.4,0.9-2.3,0.7-3.5,0c-1.5-0.9-1.8,0.2-3.7,0.3c-4.1,0.3-5.6,1.2-5.6,1.2c-0.7-3.7-3.5-3.4-3.5-3.4c-5.8-1.4-4.5-0.6-6.4-3.7c-1.9-3.1-3.7-1.4-3.7-1.4s-3.2,3.9-4,0.8c-0.8-3.1-1.9-0.5-1.9-0.5c-1.5,4.9-7.1,3.2-7.1,3.2l0-0.3c0,0,0.4-5.1,0.8-6.6c0.4-1.5,0.1-3.9-0.3-4.8c-0.3-0.8,0.1-1.5,0.1-1.5c2.8-6.1-1.8-4.4-3.4-4.8c-0.9-0.2-3.4-0.8-3.7-2c-0.3-1.3-1.1-3.8-1.1-5.8s1-2.7,1-3.7c0-1,1.4-4.4-7.1-8.9c-8.5-4.4-6.1-7.4-6.1-7.4c2.4-1.3,3.8-2.8,4.7-1.6c0.8,1.2,2.7,2.4,4.7,0.5c2-1.9,5.1-1.8,5.2-0.8c0.2,1,0.8,2.2,3.5,2c2.7-0.2,11.3,0.4,11.3-2.7c0-3.1,4.7-3.2,5.6-2.4c0.8,0.8,1.3,4.5,2-0.4c0.7-5,2.7-8.2,5.1-2.4c2.4,5.7,1.7,6.2,2.9,7.4c1.2,1.2,1.9,3.2,1.9,5.2c0,2,4.6,6.1,6.2,8.6c1.7,2.5,6.4,7.1,7.8,8.8c1,1.2,2.2,7.4,4.2,10.3c2,2.9,4.3,3.4,5.9,9.1c0.7,2.6,0.8,2.9,0.8,2.9' },
  { id: '충북', labelX: 72, labelY: 82, d: 'M92.3,64.4c-1.1,1.9-0.7,4.1-0.7,4.1s1.4,5.6-4.8,3.1c-6.2-2.4-5.2,0-7.1,0.6c-1.9,0.6-3.6,3.5-5.4,5c-1.8,1.5-5.2,2.4-3.8,4.1c1.4,1.8,2.5,3.4,2,5.3c-0.4,1.9-3.1,3.5-2.4,5.1c0.8,1.6,2.8,2,5,2c2.2-0.1,2.6,1.8,0.9,4.4c-1.7,2.6-1.9,5.7-2.5,6.2l-1.7,1.6c-2.9-1.5-7-1.6-7-1.6l-0.2-1.1c-1.4-4-1.7-6.4-2.1-7.2c-1-2-3-1.2-3-1.2l0.6-1.3c0.1-0.3,0.4-2.5,0.6-3.4c0.2-0.9,0.2-2.7-0.1-3.4c-0.3-0.7-0.8-0.6-1.5-0.8c-0.7-0.2-3.3-2.3-3.3-2.3s-1.6-2.9-2.6-4.2c-3.2-4,0.7-4.9,0.7-4.9s7.2-1.4,1-6.6c0,0,2.2-4.2,3.1-4.7c0.9-0.5,3.3-0.9,4.5-1.6c1.2-0.7,4.2-3.3,4.2-3.3l0.6-0.5l0.3-0.3c0,0,5.6,1.7,7.1-3.2c0,0,1.1-2.6,1.9,0.5c0.8,3.1,4-0.8,4-0.8s1.7-1.7,3.7,1.3c1.9,3.1,0.6,2.3,6.4,3.7c0,0,2.8-0.2,3.5,3.4C94.3,62.7,93,63.3,92.3,64.4z' },
  { id: '충남', labelX: 33, labelY: 88, d: 'M54,74.8c7.2-2.1,1.1-6.4,1.1-6.4l-0.2-0.1c0,0-0.8,0.1-5-1.4c-4.2-1.5-7,0-7,0c-7.4,2.4-9.1-2.7-9.5-2.5c-0.4,0.2-1.9-0.1-1.9-0.1c-0.3-0.1-1-0.3-4.4-1.7c-3.4-1.3-4.6-0.3-5.2,0c-0.7,0.3-7.2,5.8-7.9,6.4c-1.2,1.2-0.7,3.7-1,6.1c-0.3,2.4-0.3,5.7,2.2,4c2.5-1.7,4.6,1,3.2,4c-1.3,3,0.8,6.9,4.6,7.3c3.7,0.3,3.9,4.9,2.7,5.7c-1.2,0.8-2.7,1.3,1.2,4.9l3.5,3.7c0,0,5.4,2,6.8-1.5c1.4-3.5,2.8-5.4,4.3-5.1s2.7,2.6,2.6,4.3c-0.1,1.7,2.6,1.9,4,0.8c1.4-1.1,4-3.9,5.5-2.1c1.4,1.7,1.7,4.3,3.4,4.8c1.7,0.5,9.1,1.4,7.7-2.5c-1.4-4-1.8-6.4-2.1-7.2c-0.8-1.8-2.4-1.4-3-1.1l-0.3,0.4c-0.9,1.3-0.8,1.1-1.1,1.4s-1.5,1.1-2.7,0.4c-1.3-0.7-3.6-0.1-4.1-5.7c-0.1-1.3,0.4-3.3,0.4-3.3s0-0.1-1.5-0.4c-1.3-0.2-1.6-1.6-2-4.6c-0.4-2.9,0.5-2.8-0.5-2.9c-1-0.1-0.4-1.1-0.1-2.2c0.3-1-0.6-1.9-0.9-3.3c-0.3-1.4,1.6-2.4,2.3-1.1c0.6,1.3,2.2,2,3.2,1.8C52.7,75.5,53.5,74.9,54,74.8z' },
  { id: '대전', labelX: 57, labelY: 94, d: 'M59.6,95l-0.3,0.4c-0.9,1.3-0.8,1.1-1.1,1.4c-0.3,0.3-1.5,1.1-2.7,0.4c-1.3-0.7-3.7,0-4.1-5.7c-0.4-5.8,3.9-5,4.4-6.2c0,0,0.3-0.9,0.2-1.4s2.6,2.1,3.2,2.3c0.7,0.2,1.1,0.1,1.5,0.8c0.3,0.7,0.3,2.5,0.1,3.4c-0.2,0.9-0.5,3.1-0.6,3.4L59.6,95z' },
  { id: '경북', labelX: 99, labelY: 95, d: 'M95.4,121.7c0.9,1.1,6.4,1.9,9,1.5c2.6-0.3,2.9-1.8,4.7-2.3c1.9-0.5,3.1-3.2,5.1-3.6c1.9-0.4,3.2,0.4,4.6,1.3c1.3,0.8,7.2,0,7.2-1.2c0-0.2-0.2-0.6-0.2-0.6c-1-1.9-0.2-1.3,0.8-3.2c1-1.9,0.7-3,1.9-5.4c1.2-2.4-0.4-3.4,0-5.7c0.3-2.4-2-2.2-2.2-1c-0.2,1.2-2.9,2.7-3.4,1.7c-0.5-1,0-2.4-0.3-3.7c-0.3-1.3-0.8-3-1.2-7.6c-0.3-4.6,1-2.2,2-4c1-1.9-1-5.9-0.7-8.6c0.3-2.7,1.5-7.6,0-8.9c-1.2-1.1-0.4-2.1-0.2-2.7c0.1-0.6,1.2-5.8,0-6.9c-1.3-1.1-2.7-4.2-2.7-4.2s-2.8,4.9-5.1,4.8c-2.3-0.1-5.2-1.2-5.7-1.2c-0.5,0-1.4,0.3-1.8,1.2c-0.4,0.9-2.4,0.8-3.5,0c-1.2-0.8-1.8-0.1-3.5,0.3c-1.7,0.3-6.1,0.3-7.8,3c-1.1,1.8-0.7,4.1-0.7,4.1s1.4,5.6-4.8,3.1c-6.2-2.4-5.2,0-7.1,0.6c-1.9,0.6-3.6,3.5-5.4,5c-1.8,1.5-5.2,2.4-3.8,4.1c1.4,1.8,2.5,3.4,2,5.3c-0.4,1.9-3.1,3.5-2.4,5.1c0.8,1.6,2.8,2,5,2c2.2-0.1,2.6,1.8,0.9,4.4s-1.9,5.7-2.5,6.2c-1,0.9-1.9,1.8-1.9,1.8s0.8,2.8,0.8,4.4c0,0,8.4,3,9.2,3.5c0.8,0.5,2.3,2.4,1.5,4.1c0,0-0.4,2.2,4,1.9c0,0,3.6-4.7,1.1-7.8c0,0-2.3-2.2,1-3.5c3.3-1.4,2-3.4,4.7-3.5c2.7-0.2,4.9-1.5,5.7-0.8c0.8,0.8,4.6,4.2,3.1,5.7c-1.5,1.5-4.7,6.8-5.8,7.4c-1.1,0.6-2.7,0.5-2.6,1.5c0,0.2,0.5,2.1,0.5,2.1L95.4,121.7z' },
  { id: '전북', labelX: 44, labelY: 118, d: 'M27,105.6c-3.1,0.3,1.3,4.2,1.3,4.2c3.8,5-1.4,8.7-1.5,8.8c-0.1,0.1-3.2,2-2.8,4.1c0.5,2.3-0.5,2-0.9,2.5c-1.5,2.2-0.3,3.2-0.3,3.2s2.6,3.7,4.1,4.9c0,0,1.4,0.7,2.6,0.7c0,0,4.2-2.6,5.6-5.2c1.4-2.6,6.1,0.7,7.4,1.5c1.3,0.8,3.4,5.1,5.5,4.4c2.1-0.8,3.7-0.8,5.1-0.3c1.4,0.6,4.5-1.2,5.3-1.9c2.2-1.8,4.1,1.5,4,1c-0.1-0.5,1.5-3.3,1.5-3.3c1-2.3-0.4-2.7-0.8-3.7c-0.4-1-1.1-4.1-0.2-4.8c0.9-0.7,1.3-2.3,1.3-2.3c0.6-7.4,8.4-8.6,8.4-8.6c0-0.8-0.5-3.2-0.8-4.4c-0.3-1.2-6.8-1.9-6.8-1.9c0.6,2.5-6.2,2.1-7.9,1.6c-1.7-0.5-1.9-3.1-3.4-4.8c-1.4-1.7-4.1,1-5.5,2.1c-1.3,1.1-4,0.9-4-0.8c0.1-1.7-1.1-4.1-2.6-4.3c-1.5-0.3-2.9,1.7-4.3,5.1c-1.4,3.5-6.8,1.5-6.8,1.5L27,105.6z' },
  { id: '대구', labelX: 92, labelY: 116, d: 'M95,121.2c0,0-0.5-1.8-0.5-2.1c-0.1-1,1.5-0.9,2.6-1.5c1.1-0.6,4.3-5.9,5.8-7.4c1.5-1.5-2.4-5-3.1-5.7c-0.8-0.8-3,0.6-5.7,0.8c-2.7,0.2-1.4,2.2-4.7,3.5c-3.3,1.3-1,3.5-1,3.5c2.6,2.7-0.8,7.7-0.8,7.7S92.8,119.6,95,121.2z' },
  { id: '경남', labelX: 83, labelY: 142, d: 'M106.3,136.8c-2.1,0.9-1.9,2.7-1.9,2.7c-1.5,4.1-3.7,2.6-4.8,1.8c-1.1-0.8-2.7-1.8-2.9-0.6c-0.2,1.2-3.3,2.7-3.3,2.7c-3.9,1.7-1.1,3.7-1.1,3.7c3.4,3.7,3.6,1.6,6-1.3c2.4-2.8,4.9,1.6,4.9,1.6c-0.6,0.6-0.7,3.5-0.7,3.5c-0.2,5.2-3.4,9.3-5.9,9.2c-2.5-0.1-7.2-0.1-7.8-3.7c-0.7-3.6-2.5-1.9-3.2-1.3c-0.8,0.6-3.9,1.2-4.8,1c-0.9-0.1-1.9,0.6-2.1,2.5c0,0,0.7,1.9-1.7,0.8c-2.4-1.1-4.1-1-5.8-0.6c0,0-0.4-0.8-0.4-4.2l0,0.1c0.4-4.6-0.8-3.3-1.3-4.5c-0.4-1.2-0.5-3.9-0.8-4.4c-0.3-0.5-3.8-2.3-4.5-5.1c-0.5-1.9-1.4-4.3-1.5-6.4l-0.1-0.3l0-0.5c-0.1-0.5,1.5-3.3,1.5-3.3c1-2.3-0.4-2.7-0.8-3.7c-0.4-1-1.1-4.1-0.2-4.8c0.9-0.7,1.3-2.3,1.3-2.3c0.6-7.4,8.4-8.6,8.4-8.6s8.4,3,9.2,3.5c0.8,0.5,2.3,2.4,1.5,4.1c0,0-0.4,2.2,4,1.9l0.3-0.1c0,0,5.3-0.4,7.4,1.2l0.4,0.4c0.9,1.1,6.4,1.9,9,1.5c2.6-0.3,2.9-1.8,4.7-2.3l1-0.5c0,0,0.4,2-0.9,3.2c-1.3,1.3,0.1,2,1.7,2.7c1.6,0.7,5.1,1.3,5.7,2.9C116.7,129.3,113.8,133.4,106.3,136.8z' },
  { id: '광주', labelX: 33, labelY: 142, d: 'M31.5,136.6c0.2-0.5,0.7,0.2,2-0.1c1.3-0.3,2.9-1.1,4.9-0.7c2,0.4,4.6,2.8,4,6.8c-0.7,4-5.9,3.4-7.3,2.4c-1.1-0.8-0.1-1.3-2.8-2.2c-2.7-0.9-2-2.6-1.1-4C31.2,138.8,31.2,137.4,31.5,136.6z' },
  { id: '전남', labelX: 30, labelY: 165, d: 'M70.6,154.5c0.4-4.6-0.8-3.3-1.3-4.5c-0.4-1.2-0.5-3.9-0.8-4.4c-0.3-0.5-3.8-2.3-4.5-5.1c-0.5-1.9-1.4-4.3-1.5-6.4l-0.1-0.3c-0.2-1.5-2.8-2.7-3.9-1.5c-0.7,0.7-3.9,2.5-5.3,1.9c-1.4-0.6-3-0.5-5.1,0.3c-2.1,0.8-4.2-3.5-5.5-4.4c-1.3-0.8-6-4.1-7.4-1.5c-1.4,2.6-5.6,5.2-5.6,5.2c-1.1,0-2.6-0.7-2.6-0.7c-1.5-1.2-4.1-4.9-4.1-4.9s-0.5-1.1-1.3,0.2c-1,1.6,0.2,1.5,0,2.5c-0.2,1-3.5,2-2,5.2c1.5,3.2-1,3.7-3,4.2c-2,0.5-3.5-0.3-7.1,0c-3.5,0.3-2,2.9,0.7,4.4c2.7,1.5,2.1,3.5-0.7,4.2c-1.7,0.4-2.4,0.1-2.2,1.5c0.6,4.7-1.5,3.5-2.4,4.4c-0.9,0.8-1.3,1.7-0.7,3.2c0.7,1.5,1.5,1.2,1.5,3c0,1.9-2.5,2.5,1.7,3.9c4.2,1.4,1.3,2.8,0.5,3.2c-2.4,1.2-4.4,5.6-5.7,9.1c-1.3,3.5,1.8,1.7,1.9,2.5c0.4,1.8,1.9,4.6,6.8,0c9.1,0.8,2.5-5.6,3.7-5.6c1.2,0,5.1-1.2,6.1-1.3c1-0.2,4.4,1.5,4.4,1.5l5.4,2c0,0,5.4,0,8.9,0.2c3.5,0.2,4.6,0.3,6.1-0.5c1.5-0.8,0.8-3.4,1.3-4.2c0.5-0.8,3.4-0.5,5.1-0.5c1.7,0,0.2-3.4,3.7-2c3.5,1.3,4.7,0.2,4.9-2.4c0.2-2.5-4.2-6.7,2.7-4.6c6.9,2.2,6.8-1.6,7.6-3l0.2-1C70.9,158.6,70.5,157.7,70.6,154.5' },
  { id: '울산', labelX: 119, labelY: 126, d: 'M122.2,129c-0.3-0.7-0.1-1.1,2-2.8c2-1.8,1.7-8.8,1.7-8.8c0,1.2-5.7,2-7.1,1.2c-1.5-0.9-2.3-1.7-4.7-1.2c-1,0.2-3.9,3.1-3.9,3.1s0.4,2-0.9,3.2c-1.3,1.3,0.1,2,1.7,2.7c1.6,0.7,5.1,1.3,5.7,2.9c0,0,0.1,4.4,3,4l0.8,0C120.5,133.3,122.8,130.4,122.2,129z' },
  { id: '부산', labelX: 111, labelY: 140, d: 'M118.5,138.1c-1.6,4.1-3.7,3.6-4,3.1c-0.4-0.5-3-0.7-3,0.6c0,1.3-1.6,2.2-1.6,2.2c-5.4,1.5-6.7,3.3-6.7,3.3s-2.5-4.4-4.9-1.6c-2.4,2.9-2.6,5-6,1.3c0,0-2.8-2,1.1-3.7c0,0,3.1-1.4,3.3-2.7c0.2-1.2,1.8-0.2,2.9,0.6c1.1,0.8,3.4,2.4,4.8-1.8c0,0-0.1-1.8,1.9-2.7c7.5-3.4,10.3-7.7,10.4-7.5c0.2,0.5-0.1,4.8,3.8,4C121.1,133.2,118.5,138.1,118.5,138.1z' },
  { id: '제주', labelX: 25, labelY: 195, d: 'M21.5,188.9c0,0-2.2,3.3-6.1,3.9c-3.9,0.6-2.5,5.8-0.3,7.2c2.2,1.4,3,3.7,6.1,1.6c1.6-1.1,4.8,0.1,8.8-0.3c1.6-0.1,11.5-4.8,10.8-8.9c-0.8-4.1-2.7-6.6-7-5.3c-4.3,1.3-7.5,1.1-8.7,1.1C23.8,188.4,22.8,188.1,21.5,188.9z' },
];

const SEJONG_MARKER = { id: '세종', cx: 50, cy: 83, r: 3.5, labelX: 55, labelY: 83 };

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface Candidate {
  id: string;
  name: string;
  party: string;
  region: string;
  finalScore: number;
  hasScore: boolean;
  pollRank: number | null;
  pollSupport: string | null;
}

interface RegionEntry {
  region: string;
  total: number;
  candidates: Candidate[];
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

export default function MetroMapPage() {
  const [viewMode, setViewMode] = useState<'ai' | 'poll'>('ai');
  const [regions, setRegions] = useState<RegionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const fetchData = useCallback(async (mode: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/politicians/metro-map?view_mode=${mode}`);
      const json = await res.json();
      if (json.success) setRegions(json.regions || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(viewMode); }, [viewMode, fetchData]);

  // 지역 단축명 → RegionEntry 매핑
  const regionMap = new Map<string, RegionEntry>();
  for (const r of regions) {
    const short = REGION_SHORT[r.region] || r.region;
    regionMap.set(short, r);
    regionMap.set(r.region, r);
  }

  const getRegionColor = (regionId: string) => {
    const entry = regionMap.get(regionId);
    if (!entry || entry.candidates.length === 0) return DEFAULT_COLOR;
    const top = entry.candidates[0];
    if (viewMode === 'ai' && !top.hasScore) return UNSCORED_COLOR;
    if (viewMode === 'poll' && top.pollRank == null) return UNSCORED_COLOR;
    return partyColor(top.party);
  };

  const selectedEntry = selectedRegion ? (regionMap.get(selectedRegion) || null) : null;

  const RANK_MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* ── 헤더 ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm flex-shrink-0">
              ← 홈
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate">
                🗳️ 2026 지방선거 광역단체장 지도
              </h1>
              <p className="text-[10px] text-gray-500 hidden sm:block">여론조사 / AI 평가 기준 출마자 랭킹</p>
            </div>
          </div>

          {/* 모드 토글 */}
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0">
            <button
              onClick={() => setViewMode('poll')}
              className={`px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'poll'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50'
              }`}
            >
              🗳 여론조사
            </button>
            <button
              onClick={() => setViewMode('ai')}
              className={`px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'ai'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50'
              }`}
            >
              🤖 AI 평가
            </button>
          </div>
        </div>
      </div>

      {/* ── 모드 설명 배너 ──────────────────────────────────────────────────── */}
      <div className={`py-2 px-4 text-center text-xs ${
        viewMode === 'ai'
          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
      }`}>
        {viewMode === 'ai'
          ? '🤖 AI 평가 점수 기준 (Claude · ChatGPT · Gemini · Grok 4개 AI 종합) · 상위 5위까지 표시'
          : '🗳 여론조사 지지율 기준 (중앙선거여론조사심의위원회 등록 조사) · 상위 5위까지 표시'}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

            {/* ── 지도 패널 ──────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 lg:sticky lg:top-20">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 text-center">
                {viewMode === 'ai' ? '🤖 AI 평가 1위 지도' : '🗳 여론조사 1위 지도'}
              </h2>

              {/* SVG 지도 */}
              <div className="relative">
                <svg
                  viewBox="0 0 130 204"
                  className="w-full max-w-[240px] mx-auto"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
                  aria-label="전국 광역단체장 지도"
                >
                  <rect x="0" y="0" width="130" height="204" fill="#EFF6FF" rx="4" />

                  {REGION_PATHS.map((region) => {
                    const color = getRegionColor(region.id);
                    const isSelected = selectedRegion === region.id;
                    const isHovered = hoveredRegion === region.id;
                    return (
                      <path
                        key={region.id}
                        d={region.d}
                        fill={isSelected ? color.border : color.fill}
                        stroke={isSelected ? '#FBBF24' : (isHovered ? '#374151' : '#FFFFFF')}
                        strokeWidth={isSelected ? 1.5 : (isHovered ? 0.8 : 0.5)}
                        className="cursor-pointer transition-all duration-150"
                        onClick={() => setSelectedRegion(region.id === selectedRegion ? null : region.id)}
                        onMouseEnter={() => setHoveredRegion(region.id)}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                    );
                  })}

                  {/* 세종 마커 */}
                  {(() => {
                    const color = getRegionColor('세종');
                    const isSelected = selectedRegion === '세종';
                    const isHovered = hoveredRegion === '세종';
                    return (
                      <circle
                        cx={SEJONG_MARKER.cx}
                        cy={SEJONG_MARKER.cy}
                        r={SEJONG_MARKER.r}
                        fill={isSelected ? color.border : color.fill}
                        stroke={isSelected ? '#FBBF24' : (isHovered ? '#374151' : '#FFFFFF')}
                        strokeWidth={isSelected ? 1.5 : 0.8}
                        className="cursor-pointer transition-all"
                        onClick={() => setSelectedRegion('세종' === selectedRegion ? null : '세종')}
                        onMouseEnter={() => setHoveredRegion('세종')}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                    );
                  })()}

                  {/* 지역명 라벨 */}
                  {REGION_PATHS.map((region) => {
                    const color = getRegionColor(region.id);
                    const isSmall = ['서울', '대전', '대구', '광주', '울산', '부산', '세종'].includes(region.id);
                    return (
                      <text
                        key={`label-${region.id}`}
                        x={region.labelX}
                        y={region.labelY}
                        textAnchor="middle"
                        fontSize={isSmall ? 3 : 4.5}
                        fill={color.text === '#FFFFFF' ? '#FFFFFF' : '#374151'}
                        style={{ pointerEvents: 'none', fontWeight: 600 }}
                      >
                        {region.id}
                      </text>
                    );
                  })}
                  <text x={SEJONG_MARKER.labelX + 1} y={SEJONG_MARKER.labelY - 5} textAnchor="start" fontSize={3} fill="#374151" style={{ pointerEvents: 'none', fontWeight: 600 }}>세종</text>
                </svg>
              </div>

              {/* 범례 */}
              <div className="mt-3 space-y-1.5">
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">당색 범례</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {[
                    { label: '더불어민주당', color: '#1B4FBF' },
                    { label: '국민의힘', color: '#C9151E' },
                    { label: '조국혁신당', color: '#003F87' },
                    { label: '개혁신당', color: '#FF7210' },
                    { label: '기타/무소속', color: '#6B7280' },
                    { label: '미평가', color: '#E5E7EB', border: '#D1D5DB', dark: '#9CA3AF' },
                  ].map(({ label, color, border }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color, border: border ? `1px solid ${border}` : undefined }} />
                      <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-1.5">* 지도 클릭 → 지역 상세 랭킹</p>
              </div>
            </div>

            {/* ── 랭킹 패널 ──────────────────────────────────────────────────── */}
            <div>
              {/* 선택된 지역 상세 */}
              {selectedEntry && (
                <div className="mb-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border-2 border-amber-400">
                  <div className="bg-amber-400 px-4 py-2 flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">
                      📍 {REGION_FULL[selectedRegion!] || selectedRegion} 광역단체장 출마자
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-700">총 {selectedEntry.total}명 등록</span>
                      <button
                        onClick={() => setSelectedRegion(null)}
                        className="text-gray-700 hover:text-gray-900 text-lg leading-none"
                      >×</button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {selectedEntry.candidates.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-400 text-sm">등록된 출마자가 없습니다</div>
                    ) : (
                      selectedEntry.candidates.map((c, i) => {
                        const col = partyColor(c.party);
                        const noData = viewMode === 'ai' ? !c.hasScore : c.pollRank == null;
                        return (
                          <Link
                            key={c.id}
                            href={`/politicians/${c.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <div className="text-lg font-bold w-6 text-center flex-shrink-0">
                              {RANK_MEDALS[i] || `${i + 1}`}
                            </div>
                            <div
                              className="w-1.5 h-10 rounded-full flex-shrink-0"
                              style={{ backgroundColor: col.fill }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</div>
                              <div className="text-xs truncate" style={{ color: col.fill }}>{c.party}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {viewMode === 'ai' ? (
                                noData ? (
                                  <div className="text-[10px] text-gray-400">평가 예정</div>
                                ) : (
                                  <>
                                    <div className="text-base font-bold text-gray-900 dark:text-white">{c.finalScore}<span className="text-xs font-normal text-gray-400">점</span></div>
                                    <div className="text-[10px] text-gray-400">AI 종합</div>
                                  </>
                                )
                              ) : (
                                noData ? (
                                  <div className="text-[10px] text-gray-400">조사 없음</div>
                                ) : (
                                  <>
                                    <div className="text-base font-bold text-gray-900 dark:text-white">{c.pollRank}위</div>
                                    {c.pollSupport && <div className="text-[10px] text-gray-400">{c.pollSupport}</div>}
                                  </>
                                )
                              )}
                            </div>
                          </Link>
                        );
                      })
                    )}
                    {selectedEntry.total > selectedEntry.candidates.length && (
                      <div className="px-4 py-2.5 text-center">
                        <Link
                          href={`/politicians?region=${encodeURIComponent(REGION_FULL[selectedRegion!] || selectedRegion!)}&category=광역단체장`}
                          className="text-xs text-primary-500 hover:underline"
                        >
                          + {selectedEntry.total - selectedEntry.candidates.length}명 더 보기 →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 전체 지역 카드 그리드 */}
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                {viewMode === 'ai' ? '🤖 AI 평가 기준' : '🗳 여론조사 기준'} 지역별 상위 5위
                <span className="ml-2 text-xs font-normal text-gray-400">(지도 클릭 또는 카드 클릭 → 상세)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {METRO_ORDER.map((regionId) => {
                  const fullName = REGION_FULL[regionId] || regionId;
                  const entry = regionMap.get(regionId);
                  const isSelected = selectedRegion === regionId;
                  const candidates = entry?.candidates || [];

                  return (
                    <div
                      key={regionId}
                      onClick={() => setSelectedRegion(regionId === selectedRegion ? null : regionId)}
                      className={`bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                        isSelected ? 'ring-2 ring-amber-400' : ''
                      }`}
                    >
                      {/* 카드 헤더 */}
                      <div className="px-3 py-2 flex items-center justify-between" style={{
                        backgroundColor: candidates.length > 0 && (viewMode === 'ai' ? candidates[0].hasScore : candidates[0].pollRank != null)
                          ? partyColor(candidates[0].party).fill
                          : '#374151'
                      }}>
                        <span className="text-xs font-bold text-white truncate">{fullName}</span>
                        <span className="text-[10px] text-white/70 flex-shrink-0 ml-1">
                          {entry ? `${entry.total}명` : '0명'}
                        </span>
                      </div>

                      {/* 후보 목록 (최대 5위) */}
                      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {candidates.length === 0 ? (
                          <div className="px-3 py-3 text-[10px] text-gray-400 text-center">등록 없음</div>
                        ) : (
                          candidates.map((c, i) => {
                            const col = partyColor(c.party);
                            const noData = viewMode === 'ai' ? !c.hasScore : c.pollRank == null;
                            return (
                              <div key={c.id} className="flex items-center gap-2 px-3 py-1.5">
                                <span className="text-[10px] font-bold text-gray-400 w-4 flex-shrink-0">
                                  {i + 1}
                                </span>
                                <div
                                  className="w-1 h-5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: col.fill }}
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{c.name}</span>
                                  <span className="text-[9px] text-gray-400 ml-1 truncate">{c.party.replace('더불어', '').replace('국민의힘', '국힘').replace('조국혁신당', '조혁당')}</span>
                                </div>
                                <div className="text-[10px] text-right flex-shrink-0">
                                  {noData ? (
                                    <span className="text-gray-300">{viewMode === 'ai' ? '-' : '없음'}</span>
                                  ) : viewMode === 'ai' ? (
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{c.finalScore}</span>
                                  ) : (
                                    <span className="font-bold text-gray-700 dark:text-gray-200">
                                      {c.pollSupport || `${c.pollRank}위`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 하단 안내 */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-semibold">📌 데이터 안내</p>
                {viewMode === 'ai' ? (
                  <>
                    <p>• AI 평가는 Claude · ChatGPT · Gemini · Grok 4개 AI가 10개 카테고리를 종합 평가한 점수입니다.</p>
                    <p>• 평가가 완료된 정치인만 점수가 표시되며, 나머지는 '평가 예정'으로 표시됩니다.</p>
                    <p>• 점수 범위: 200~1,000점 (D등급~L등급)</p>
                  </>
                ) : (
                  <>
                    <p>• 여론조사는 중앙선거여론조사심의위원회(nesdc.go.kr) 등록 조사를 기반으로 합니다.</p>
                    <p>• 조사가 실시된 지역/후보만 표시되며, 나머지는 '조사 없음'으로 표시됩니다.</p>
                    <p>• 최신 여론조사 결과는 <a href="https://www.nesdc.go.kr" target="_blank" rel="noopener noreferrer" className="underline">nesdc.go.kr</a>에서 확인하세요.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
