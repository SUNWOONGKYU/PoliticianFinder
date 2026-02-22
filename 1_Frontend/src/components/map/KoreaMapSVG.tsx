'use client';

// 실제 행정구역 SVG 경로 사용
// 출처: southkorea/southkorea-maps (CC BY 4.0) — popong 데이터
// viewBox: 0 0 130 204

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 당 색상 정의
const PARTY_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  '더불어민주당': { fill: '#1B4FBF', stroke: '#0D3A9E', text: '#FFFFFF' },
  '국민의힘':     { fill: '#C9151E', stroke: '#A01018', text: '#FFFFFF' },
  '조국혁신당':   { fill: '#003F87', stroke: '#002A5C', text: '#FFFFFF' },
  '개혁신당':     { fill: '#FF7210', stroke: '#CC5A00', text: '#FFFFFF' },
  '정의당':       { fill: '#F5C518', stroke: '#D4A800', text: '#1F2937' },
  '진보당':       { fill: '#E83030', stroke: '#B52020', text: '#FFFFFF' },
  '국민의당':     { fill: '#00C7AE', stroke: '#009E8C', text: '#FFFFFF' },
  '무소속':       { fill: '#6B7280', stroke: '#4B5563', text: '#FFFFFF' },
};
const DEFAULT_COLOR = { fill: '#fed7aa', stroke: '#fdba74', text: '#9a3412' };

function getPartyColor(party?: string) {
  if (!party) return DEFAULT_COLOR;
  return PARTY_COLORS[party] || DEFAULT_COLOR;
}

// 지역 단축명 → 풀네임
const REGION_FULL_NAMES: Record<string, string> = {
  '서울': '서울특별시', '인천': '인천광역시', '경기': '경기도',
  '강원': '강원특별자치도', '충북': '충청북도', '세종': '세종특별자치시',
  '충남': '충청남도', '대전': '대전광역시', '경북': '경상북도',
  '전북': '전북특별자치도', '대구': '대구광역시', '경남': '경상남도',
  '광주': '광주광역시', '전남': '전라남도', '울산': '울산광역시',
  '부산': '부산광역시', '제주': '제주특별자치도',
};

// 실제 행정구역 SVG 경로 데이터 (southkorea-maps popong, viewBox 0 0 130 204)
const REGION_PATHS: Array<{ id: string; name: string; d: string; labelX: number; labelY: number }> = [
  {
    id: '서울', name: '서울특별시',
    labelX: 41, labelY: 43,
    d: 'M36.5,45.3c0,0,4.6,0.6,5.5,1.3c0.9,0.7,3.3,0.3,3.7-1c0.4-1.3,2-0.5,2.8-1.3s0.8-1.9,0.4-2.9c-0.3-1-0.8-0.7-0.8-2.1c-0.1-1.3-1.3-3.1-2.6-4c-1.3-0.8-3,0-3.5,0.7c-0.6,0.7-5.6,5.2-5.6,5.2S37.3,42.6,36.5,45.3z',
  },
  {
    id: '인천', name: '인천광역시',
    labelX: 18, labelY: 50,
    d: 'M31.1,51.1c0.3-3.5-1.3-5.5-3.8-5.7c-2.5-0.2-2.2,5.2-6.6,0c-4.4-5.2-0.8-4.9-1.5-6.2c-0.7-1.3-3.7-0.7-4.6-1.3c-0.8-0.7-2-1.5-0.7-3c1.4-1.5,1.7-2.5,3-3.9c1.4-1.3,2.4,0.6,4-0.7c0.6-0.5,1-3,2.7-2.2s2.6,2.4,3.2,3.2c0,0,0.7,1.4,3,0.9l0,0c0,0-4,3.2-1.8,4.8c0,0,0.8-0.3,0.8,3.1c0,0-0.3,0.8,1.9,0.2c2.3-0.6,4.4-0.6,5.1,0.5c0.7,1.1,2.5,3.9-2.2,7.6L31.2,51L31.1,51.1z',
  },
  {
    id: '경기', name: '경기도',
    labelX: 44, labelY: 60,
    d: 'M67.7,57.8l0-0.3c0,0,0.4-5.1,0.8-6.6c0.4-1.5,0.1-3.9-0.3-4.8c-0.3-0.8,0.1-1.5,0.1-1.5c2.8-6.1-1.8-4.4-3.4-4.8c-0.9-0.2-3.4-0.8-3.7-2c-0.3-1.3-1.1-3.8-1.1-5.8s1-2.7,1-3.7c0-1,1.4-4.4-7.1-8.9c-8.5-4.4-6.1-7.4-6.1-7.4s-8.6,2.1-9.2,2.5s-3,2-3.9,2.2c-0.7,0.2-2.8,1,0,2.2s5.2,2.1,1.2,4.8c-4,2.7-4.5,0.9-2.9,2.7c1.6,1.8,1.2,3.5-3,5.5c0,0-4.1,3.3-1.9,4.9c0,0,0.8-0.3,0.8,3.1c0,0-0.3,0.8,1.9,0.2c2.3-0.6,4.4-0.6,5.1,0.5c0.7,1.1,2.5,3.9-2.2,7.6l-2.6,2.8c0,0,0.1,2.8-1.3,3.3c-1.5,0.5-2.1,1.9-0.9,3.6c1.2,1.7,4.5,5.4,4.6,5.8c0.1,0.5,2.3,5.4,9.4,3.1c0,0,2.7-1.6,7,0s5.1,1.3,5.1,1.3s2.2-4.2,3.1-4.7c0.9-0.5,3.3-0.9,4.5-1.6c1.2-0.7,4.2-3.3,4.2-3.3l0.6-0.5L67.7,57.8z',
  },
  {
    id: '강원', name: '강원특별자치도',
    labelX: 95, labelY: 42,
    d: 'M119.7,56.3c0,0-2.8,4.9-5.1,4.8c-2.3-0.1-5.2-1.2-5.7-1.2c-0.5,0-1.4,0.3-1.8,1.2c-0.4,0.9-2.3,0.7-3.5,0c-1.5-0.9-1.8,0.2-3.7,0.3c-4.1,0.3-5.6,1.2-5.6,1.2c-0.7-3.7-3.5-3.4-3.5-3.4c-5.8-1.4-4.5-0.6-6.4-3.7c-1.9-3.1-3.7-1.4-3.7-1.4s-3.2,3.9-4,0.8c-0.8-3.1-1.9-0.5-1.9-0.5c-1.5,4.9-7.1,3.2-7.1,3.2l0-0.3c0,0,0.4-5.1,0.8-6.6c0.4-1.5,0.1-3.9-0.3-4.8c-0.3-0.8,0.1-1.5,0.1-1.5c2.8-6.1-1.8-4.4-3.4-4.8c-0.9-0.2-3.4-0.8-3.7-2c-0.3-1.3-1.1-3.8-1.1-5.8s1-2.7,1-3.7c0-1,1.4-4.4-7.1-8.9c-8.5-4.4-6.1-7.4-6.1-7.4c2.4-1.3,3.8-2.8,4.7-1.6c0.8,1.2,2.7,2.4,4.7,0.5c2-1.9,5.1-1.8,5.2-0.8c0.2,1,0.8,2.2,3.5,2c2.7-0.2,11.3,0.4,11.3-2.7c0-3.1,4.7-3.2,5.6-2.4c0.8,0.8,1.3,4.5,2-0.4c0.7-5,2.7-8.2,5.1-2.4c2.4,5.7,1.7,6.2,2.9,7.4c1.2,1.2,1.9,3.2,1.9,5.2c0,2,4.6,6.1,6.2,8.6c1.7,2.5,6.4,7.1,7.8,8.8c1,1.2,2.2,7.4,4.2,10.3c2,2.9,4.3,3.4,5.9,9.1c0.7,2.6,0.8,2.9,0.8,2.9',
  },
  {
    id: '충북', name: '충청북도',
    labelX: 72, labelY: 82,
    d: 'M92.3,64.4c-1.1,1.9-0.7,4.1-0.7,4.1s1.4,5.6-4.8,3.1c-6.2-2.4-5.2,0-7.1,0.6c-1.9,0.6-3.6,3.5-5.4,5c-1.8,1.5-5.2,2.4-3.8,4.1c1.4,1.8,2.5,3.4,2,5.3c-0.4,1.9-3.1,3.5-2.4,5.1c0.8,1.6,2.8,2,5,2c2.2-0.1,2.6,1.8,0.9,4.4c-1.7,2.6-1.9,5.7-2.5,6.2l-1.7,1.6c-2.9-1.5-7-1.6-7-1.6l-0.2-1.1c-1.4-4-1.7-6.4-2.1-7.2c-1-2-3-1.2-3-1.2l0.6-1.3c0.1-0.3,0.4-2.5,0.6-3.4c0.2-0.9,0.2-2.7-0.1-3.4c-0.3-0.7-0.8-0.6-1.5-0.8c-0.7-0.2-3.3-2.3-3.3-2.3s-1.6-2.9-2.6-4.2c-3.2-4,0.7-4.9,0.7-4.9s7.2-1.4,1-6.6c0,0,2.2-4.2,3.1-4.7c0.9-0.5,3.3-0.9,4.5-1.6c1.2-0.7,4.2-3.3,4.2-3.3l0.6-0.5l0.3-0.3c0,0,5.6,1.7,7.1-3.2c0,0,1.1-2.6,1.9,0.5c0.8,3.1,4-0.8,4-0.8s1.7-1.7,3.7,1.3c1.9,3.1,0.6,2.3,6.4,3.7c0,0,2.8-0.2,3.5,3.4C94.3,62.7,93,63.3,92.3,64.4z',
  },
  {
    id: '충남', name: '충청남도',
    labelX: 33, labelY: 88,
    d: 'M54,74.8c7.2-2.1,1.1-6.4,1.1-6.4l-0.2-0.1c0,0-0.8,0.1-5-1.4c-4.2-1.5-7,0-7,0c-7.4,2.4-9.1-2.7-9.5-2.5c-0.4,0.2-1.9-0.1-1.9-0.1c-0.3-0.1-1-0.3-4.4-1.7c-3.4-1.3-4.6-0.3-5.2,0c-0.7,0.3-7.2,5.8-7.9,6.4c-1.2,1.2-0.7,3.7-1,6.1c-0.3,2.4-0.3,5.7,2.2,4c2.5-1.7,4.6,1,3.2,4c-1.3,3,0.8,6.9,4.6,7.3c3.7,0.3,3.9,4.9,2.7,5.7c-1.2,0.8-2.7,1.3,1.2,4.9l3.5,3.7c0,0,5.4,2,6.8-1.5c1.4-3.5,2.8-5.4,4.3-5.1s2.7,2.6,2.6,4.3c-0.1,1.7,2.6,1.9,4,0.8c1.4-1.1,4-3.9,5.5-2.1c1.4,1.7,1.7,4.3,3.4,4.8c1.7,0.5,9.1,1.4,7.7-2.5c-1.4-4-1.8-6.4-2.1-7.2c-0.8-1.8-2.4-1.4-3-1.1l-0.3,0.4c-0.9,1.3-0.8,1.1-1.1,1.4s-1.5,1.1-2.7,0.4c-1.3-0.7-3.6-0.1-4.1-5.7c-0.1-1.3,0.4-3.3,0.4-3.3s0-0.1-1.5-0.4c-1.3-0.2-1.6-1.6-2-4.6c-0.4-2.9,0.5-2.8-0.5-2.9c-1-0.1-0.4-1.1-0.1-2.2c0.3-1-0.6-1.9-0.9-3.3c-0.3-1.4,1.6-2.4,2.3-1.1c0.6,1.3,2.2,2,3.2,1.8C52.7,75.5,53.5,74.9,54,74.8z',
  },
  {
    id: '대전', name: '대전광역시',
    labelX: 57, labelY: 94,
    d: 'M59.6,95l-0.3,0.4c-0.9,1.3-0.8,1.1-1.1,1.4c-0.3,0.3-1.5,1.1-2.7,0.4c-1.3-0.7-3.7,0-4.1-5.7c-0.4-5.8,3.9-5,4.4-6.2c0,0,0.3-0.9,0.2-1.4s2.6,2.1,3.2,2.3c0.7,0.2,1.1,0.1,1.5,0.8c0.3,0.7,0.3,2.5,0.1,3.4c-0.2,0.9-0.5,3.1-0.6,3.4L59.6,95z',
  },
  {
    id: '경북', name: '경상북도',
    labelX: 99, labelY: 95,
    d: 'M95.4,121.7c0.9,1.1,6.4,1.9,9,1.5c2.6-0.3,2.9-1.8,4.7-2.3c1.9-0.5,3.1-3.2,5.1-3.6c1.9-0.4,3.2,0.4,4.6,1.3c1.3,0.8,7.2,0,7.2-1.2c0-0.2-0.2-0.6-0.2-0.6c-1-1.9-0.2-1.3,0.8-3.2c1-1.9,0.7-3,1.9-5.4c1.2-2.4-0.4-3.4,0-5.7c0.3-2.4-2-2.2-2.2-1c-0.2,1.2-2.9,2.7-3.4,1.7c-0.5-1,0-2.4-0.3-3.7c-0.3-1.3-0.8-3-1.2-7.6c-0.3-4.6,1-2.2,2-4c1-1.9-1-5.9-0.7-8.6c0.3-2.7,1.5-7.6,0-8.9c-1.2-1.1-0.4-2.1-0.2-2.7c0.1-0.6,1.2-5.8,0-6.9c-1.3-1.1-2.7-4.2-2.7-4.2s-2.8,4.9-5.1,4.8c-2.3-0.1-5.2-1.2-5.7-1.2c-0.5,0-1.4,0.3-1.8,1.2c-0.4,0.9-2.4,0.8-3.5,0c-1.2-0.8-1.8-0.1-3.5,0.3c-1.7,0.3-6.1,0.3-7.8,3c-1.1,1.8-0.7,4.1-0.7,4.1s1.4,5.6-4.8,3.1c-6.2-2.4-5.2,0-7.1,0.6c-1.9,0.6-3.6,3.5-5.4,5c-1.8,1.5-5.2,2.4-3.8,4.1c1.4,1.8,2.5,3.4,2,5.3c-0.4,1.9-3.1,3.5-2.4,5.1c0.8,1.6,2.8,2,5,2c2.2-0.1,2.6,1.8,0.9,4.4s-1.9,5.7-2.5,6.2c-1,0.9-1.9,1.8-1.9,1.8s0.8,2.8,0.8,4.4c0,0,8.4,3,9.2,3.5c0.8,0.5,2.3,2.4,1.5,4.1c0,0-0.4,2.2,4,1.9c0,0,3.6-4.7,1.1-7.8c0,0-2.3-2.2,1-3.5c3.3-1.4,2-3.4,4.7-3.5c2.7-0.2,4.9-1.5,5.7-0.8c0.8,0.8,4.6,4.2,3.1,5.7c-1.5,1.5-4.7,6.8-5.8,7.4c-1.1,0.6-2.7,0.5-2.6,1.5c0,0.2,0.5,2.1,0.5,2.1L95.4,121.7z',
  },
  {
    id: '전북', name: '전북특별자치도',
    labelX: 44, labelY: 118,
    d: 'M27,105.6c-3.1,0.3,1.3,4.2,1.3,4.2c3.8,5-1.4,8.7-1.5,8.8c-0.1,0.1-3.2,2-2.8,4.1c0.5,2.3-0.5,2-0.9,2.5c-1.5,2.2-0.3,3.2-0.3,3.2s2.6,3.7,4.1,4.9c0,0,1.4,0.7,2.6,0.7c0,0,4.2-2.6,5.6-5.2c1.4-2.6,6.1,0.7,7.4,1.5c1.3,0.8,3.4,5.1,5.5,4.4c2.1-0.8,3.7-0.8,5.1-0.3c1.4,0.6,4.5-1.2,5.3-1.9c2.2-1.8,4.1,1.5,4,1c-0.1-0.5,1.5-3.3,1.5-3.3c1-2.3-0.4-2.7-0.8-3.7c-0.4-1-1.1-4.1-0.2-4.8c0.9-0.7,1.3-2.3,1.3-2.3c0.6-7.4,8.4-8.6,8.4-8.6c0-0.8-0.5-3.2-0.8-4.4c-0.3-1.2-6.8-1.9-6.8-1.9c0.6,2.5-6.2,2.1-7.9,1.6c-1.7-0.5-1.9-3.1-3.4-4.8c-1.4-1.7-4.1,1-5.5,2.1c-1.3,1.1-4,0.9-4-0.8c0.1-1.7-1.1-4.1-2.6-4.3c-1.5-0.3-2.9,1.7-4.3,5.1c-1.4,3.5-6.8,1.5-6.8,1.5L27,105.6z',
  },
  {
    id: '대구', name: '대구광역시',
    labelX: 92, labelY: 116,
    d: 'M95,121.2c0,0-0.5-1.8-0.5-2.1c-0.1-1,1.5-0.9,2.6-1.5c1.1-0.6,4.3-5.9,5.8-7.4c1.5-1.5-2.4-5-3.1-5.7c-0.8-0.8-3,0.6-5.7,0.8c-2.7,0.2-1.4,2.2-4.7,3.5c-3.3,1.3-1,3.5-1,3.5c2.6,2.7-0.8,7.7-0.8,7.7S92.8,119.6,95,121.2z',
  },
  {
    id: '경남', name: '경상남도',
    labelX: 83, labelY: 142,
    d: 'M106.3,136.8c-2.1,0.9-1.9,2.7-1.9,2.7c-1.5,4.1-3.7,2.6-4.8,1.8c-1.1-0.8-2.7-1.8-2.9-0.6c-0.2,1.2-3.3,2.7-3.3,2.7c-3.9,1.7-1.1,3.7-1.1,3.7c3.4,3.7,3.6,1.6,6-1.3c2.4-2.8,4.9,1.6,4.9,1.6c-0.6,0.6-0.7,3.5-0.7,3.5c-0.2,5.2-3.4,9.3-5.9,9.2c-2.5-0.1-7.2-0.1-7.8-3.7c-0.7-3.6-2.5-1.9-3.2-1.3c-0.8,0.6-3.9,1.2-4.8,1c-0.9-0.1-1.9,0.6-2.1,2.5c0,0,0.7,1.9-1.7,0.8c-2.4-1.1-4.1-1-5.8-0.6c0,0-0.4-0.8-0.4-4.2l0,0.1c0.4-4.6-0.8-3.3-1.3-4.5c-0.4-1.2-0.5-3.9-0.8-4.4c-0.3-0.5-3.8-2.3-4.5-5.1c-0.5-1.9-1.4-4.3-1.5-6.4l-0.1-0.3l0-0.5c-0.1-0.5,1.5-3.3,1.5-3.3c1-2.3-0.4-2.7-0.8-3.7c-0.4-1-1.1-4.1-0.2-4.8c0.9-0.7,1.3-2.3,1.3-2.3c0.6-7.4,8.4-8.6,8.4-8.6s8.4,3,9.2,3.5c0.8,0.5,2.3,2.4,1.5,4.1c0,0-0.4,2.2,4,1.9l0.3-0.1c0,0,5.3-0.4,7.4,1.2l0.4,0.4c0.9,1.1,6.4,1.9,9,1.5c2.6-0.3,2.9-1.8,4.7-2.3l1-0.5c0,0,0.4,2-0.9,3.2c-1.3,1.3,0.1,2,1.7,2.7c1.6,0.7,5.1,1.3,5.7,2.9C116.7,129.3,113.8,133.4,106.3,136.8z',
  },
  {
    id: '광주', name: '광주광역시',
    labelX: 33, labelY: 142,
    d: 'M31.5,136.6c0.2-0.5,0.7,0.2,2-0.1c1.3-0.3,2.9-1.1,4.9-0.7c2,0.4,4.6,2.8,4,6.8c-0.7,4-5.9,3.4-7.3,2.4c-1.1-0.8-0.1-1.3-2.8-2.2c-2.7-0.9-2-2.6-1.1-4C31.2,138.8,31.2,137.4,31.5,136.6z',
  },
  {
    id: '전남', name: '전라남도',
    labelX: 30, labelY: 165,
    d: 'M70.6,154.5c0.4-4.6-0.8-3.3-1.3-4.5c-0.4-1.2-0.5-3.9-0.8-4.4c-0.3-0.5-3.8-2.3-4.5-5.1c-0.5-1.9-1.4-4.3-1.5-6.4l-0.1-0.3c-0.2-1.5-2.8-2.7-3.9-1.5c-0.7,0.7-3.9,2.5-5.3,1.9c-1.4-0.6-3-0.5-5.1,0.3c-2.1,0.8-4.2-3.5-5.5-4.4c-1.3-0.8-6-4.1-7.4-1.5c-1.4,2.6-5.6,5.2-5.6,5.2c-1.1,0-2.6-0.7-2.6-0.7c-1.5-1.2-4.1-4.9-4.1-4.9s-0.5-1.1-1.3,0.2c-1,1.6,0.2,1.5,0,2.5c-0.2,1-3.5,2-2,5.2c1.5,3.2-1,3.7-3,4.2c-2,0.5-3.5-0.3-7.1,0c-3.5,0.3-2,2.9,0.7,4.4c2.7,1.5,2.1,3.5-0.7,4.2c-1.7,0.4-2.4,0.1-2.2,1.5c0.6,4.7-1.5,3.5-2.4,4.4c-0.9,0.8-1.3,1.7-0.7,3.2c0.7,1.5,1.5,1.2,1.5,3c0,1.9-2.5,2.5,1.7,3.9c4.2,1.4,1.3,2.8,0.5,3.2c-2.4,1.2-4.4,5.6-5.7,9.1c-1.3,3.5,1.8,1.7,1.9,2.5c0.4,1.8,1.9,4.6,6.8,0c9.1,0.8,2.5-5.6,3.7-5.6c1.2,0,5.1-1.2,6.1-1.3c1-0.2,4.4,1.5,4.4,1.5l5.4,2c0,0,5.4,0,8.9,0.2c3.5,0.2,4.6,0.3,6.1-0.5c1.5-0.8,0.8-3.4,1.3-4.2c0.5-0.8,3.4-0.5,5.1-0.5c1.7,0,0.2-3.4,3.7-2c3.5,1.3,4.7,0.2,4.9-2.4c0.2-2.5-4.2-6.7,2.7-4.6c6.9,2.2,6.8-1.6,7.6-3l0.2-1C70.9,158.6,70.5,157.7,70.6,154.5',
  },
  {
    id: '울산', name: '울산광역시',
    labelX: 119, labelY: 126,
    d: 'M122.2,129c-0.3-0.7-0.1-1.1,2-2.8c2-1.8,1.7-8.8,1.7-8.8c0,1.2-5.7,2-7.1,1.2c-1.5-0.9-2.3-1.7-4.7-1.2c-1,0.2-3.9,3.1-3.9,3.1s0.4,2-0.9,3.2c-1.3,1.3,0.1,2,1.7,2.7c1.6,0.7,5.1,1.3,5.7,2.9c0,0,0.1,4.4,3,4l0.8,0C120.5,133.3,122.8,130.4,122.2,129z',
  },
  {
    id: '부산', name: '부산광역시',
    labelX: 111, labelY: 140,
    d: 'M118.5,138.1c-1.6,4.1-3.7,3.6-4,3.1c-0.4-0.5-3-0.7-3,0.6c0,1.3-1.6,2.2-1.6,2.2c-5.4,1.5-6.7,3.3-6.7,3.3s-2.5-4.4-4.9-1.6c-2.4,2.9-2.6,5-6,1.3c0,0-2.8-2,1.1-3.7c0,0,3.1-1.4,3.3-2.7c0.2-1.2,1.8-0.2,2.9,0.6c1.1,0.8,3.4,2.4,4.8-1.8c0,0-0.1-1.8,1.9-2.7c7.5-3.4,10.3-7.7,10.4-7.5c0.2,0.5-0.1,4.8,3.8,4C121.1,133.2,118.5,138.1,118.5,138.1z',
  },
  {
    id: '제주', name: '제주특별자치도',
    labelX: 25, labelY: 195,
    d: 'M21.5,188.9c0,0-2.2,3.3-6.1,3.9c-3.9,0.6-2.5,5.8-0.3,7.2c2.2,1.4,3,3.7,6.1,1.6c1.6-1.1,4.8,0.1,8.8-0.3c1.6-0.1,11.5-4.8,10.8-8.9c-0.8-4.1-2.7-6.6-7-5.3c-4.3,1.3-7.5,1.1-8.7,1.1C23.8,188.4,22.8,188.1,21.5,188.9z',
  },
];

// 세종은 SVG 경로 없음 → 작은 원으로 표시
const SEJONG_MARKER = { id: '세종', name: '세종특별자치시', cx: 50, cy: 83, r: 3.5 };

interface Politician {
  id: string;
  name: string;
  party: string;
  totalScore: number;
  pollRank?: number | null;
  pollSupport?: string | null;
}

interface RegionData {
  region: string;
  district: string | null;
  first: Politician | null;
  second: Politician | null;
}

interface KoreaMapSVGProps {
  regionsData: RegionData[];
  positionType: string;
  viewMode?: 'ai' | 'poll';
}

export default function KoreaMapSVG({ regionsData, positionType, viewMode = 'ai' }: KoreaMapSVGProps) {
  const router = useRouter();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // 기초단체장: 광역별로 district 목록 보관 + 최고점 district로 지도 색상 결정
  const dataMap = new Map<string, RegionData>();
  const provinceDistrictsMap = new Map<string, RegionData[]>();

  if (positionType === '기초단체장') {
    // 광역별로 district 그룹화
    for (const r of regionsData) {
      let shortKey = r.region;
      for (const [short, full] of Object.entries(REGION_FULL_NAMES)) {
        if (r.region === full) { shortKey = short; break; }
      }
      const list = provinceDistrictsMap.get(shortKey) || [];
      list.push(r);
      provinceDistrictsMap.set(shortKey, list);
    }
    // 각 광역에서 최고점 district로 지도 색상 결정
    for (const [shortKey, list] of provinceDistrictsMap) {
      const sorted = [...list].sort((a, b) => (b.first?.totalScore || 0) - (a.first?.totalScore || 0));
      provinceDistrictsMap.set(shortKey, sorted);
      dataMap.set(shortKey, sorted[0]);
      if (REGION_FULL_NAMES[shortKey]) dataMap.set(REGION_FULL_NAMES[shortKey], sorted[0]);
    }
  } else {
    for (const r of regionsData) {
      dataMap.set(r.region, r);
      for (const [short, full] of Object.entries(REGION_FULL_NAMES)) {
        if (r.region === full) dataMap.set(short, r);
        if (r.region === short) dataMap.set(full, r);
      }
    }
  }

  const handleClick = (regionId: string) => {
    const fullName = REGION_FULL_NAMES[regionId] || regionId;
    router.push(`/politicians?region=${encodeURIComponent(fullName)}&category=${encodeURIComponent(positionType)}`);
  };

  const hoveredData = hoveredRegion ? (dataMap.get(hoveredRegion) || dataMap.get(REGION_FULL_NAMES[hoveredRegion] || '')) : null;
  const hoveredDistricts = positionType === '기초단체장' && hoveredRegion
    ? (provinceDistrictsMap.get(hoveredRegion) || []).filter(d => d.first)
    : [];

  return (
    <div className="relative w-full select-none">
      {/* 호버 툴팁 */}
      {hoveredRegion && (
        <div className="absolute top-2 right-2 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-3 min-w-[180px] max-w-[220px] border border-gray-200 dark:border-gray-600 pointer-events-none">
          <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 border-b pb-1.5">
            {REGION_FULL_NAMES[hoveredRegion] || hoveredRegion}
            {positionType === '기초단체장' && (
              <span className="text-[9px] font-normal text-gray-400 ml-1">기초단체장</span>
            )}
          </div>
          {positionType === '기초단체장' ? (
            hoveredDistricts.length > 0 ? (
              <div className="space-y-1.5">
                {hoveredDistricts.slice(0, 4).map((d) => (
                  <div key={`${d.region}_${d.district}`} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getPartyColor(d.first?.party).fill }}
                    />
                    <div className="min-w-0 flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] text-gray-500">{d.district}</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{d.first?.name}</span>
                      <span className="text-[9px] text-gray-400">
                        {viewMode === 'poll'
                          ? (d.first?.pollSupport || (d.first?.pollRank ? `${d.first.pollRank}위` : ''))
                          : (d.first && d.first.totalScore > 0 ? `${d.first.totalScore}점` : '')}
                      </span>
                    </div>
                  </div>
                ))}
                {hoveredDistricts.length > 4 && (
                  <div className="text-[9px] text-gray-400">+ {hoveredDistricts.length - 4}개 더</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400">등록된 기초단체장 없음</div>
            )
          ) : (
            hoveredData?.first ? (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: getPartyColor(hoveredData.first.party).fill,
                      color: getPartyColor(hoveredData.first.party).text,
                    }}
                  >1</div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
                      {hoveredData.first.name}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: getPartyColor(hoveredData.first.party).fill }}>
                      {hoveredData.first.party}
                      {viewMode === 'poll'
                        ? (hoveredData.first.pollSupport ? ` · ${hoveredData.first.pollSupport}` : hoveredData.first.pollRank ? ` · ${hoveredData.first.pollRank}위` : '')
                        : (hoveredData.first.totalScore > 0 ? ` · ${hoveredData.first.totalScore}점` : '')}
                    </div>
                  </div>
                </div>
                {hoveredData.second && (
                  <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 opacity-80"
                      style={{
                        backgroundColor: getPartyColor(hoveredData.second.party).fill,
                        color: getPartyColor(hoveredData.second.party).text,
                      }}
                    >2</div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight truncate">
                        {hoveredData.second.name}
                      </div>
                      <div className="text-[10px] truncate" style={{ color: getPartyColor(hoveredData.second.party).fill }}>
                        {hoveredData.second.party}
                        {viewMode === 'poll'
                          ? (hoveredData.second.pollSupport ? ` · ${hoveredData.second.pollSupport}` : hoveredData.second.pollRank ? ` · ${hoveredData.second.pollRank}위` : '')
                          : (hoveredData.second.totalScore > 0 ? ` · ${hoveredData.second.totalScore}점` : '')}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-400">등록된 정치인 없음</div>
            )
          )}
          <div className="mt-2 text-[9px] text-gray-400">클릭 → 지역 랭킹 이동</div>
        </div>
      )}

      {/* 실제 한국 행정구역 SVG 지도 */}
      <svg
        viewBox="0 0 130 204"
        className="w-full max-w-sm mx-auto"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }}
        aria-label="전국 지역별 랭킹 지도"
      >
        {/* 배경 바다 색상 */}
        <rect x="0" y="0" width="130" height="204" fill="#fff7ed" rx="4" />

        {/* 행정구역 경로 */}
        {REGION_PATHS.map((region) => {
          const data = dataMap.get(region.id);
          const first = data?.first;
          const second = data?.second;
          const c1 = getPartyColor(first?.party);
          const c2 = getPartyColor(second?.party);
          const isHovered = hoveredRegion === region.id;

          return (
            <g
              key={region.id}
              onClick={() => handleClick(region.id)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* 지역 경로: 1위 당색으로 채우기, 2위 색으로 테두리 */}
              <path
                d={region.d}
                fill={first ? c1.fill : '#fed7aa'}
                fillOpacity={isHovered ? 1 : 0.82}
                stroke={second ? c2.fill : (first ? c1.stroke : '#fdba74')}
                strokeWidth={isHovered ? 1.2 : 0.7}
                strokeLinejoin="round"
              />
              {/* hover 시 흰색 강조 테두리 */}
              {isHovered && (
                <path
                  d={region.d}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                  opacity="0.6"
                />
              )}
              {/* 지역명 텍스트 */}
              <text
                x={region.labelX}
                y={region.labelY}
                textAnchor="middle"
                fontSize={region.id === '세종' ? 3.5 : (
                  ['서울', '인천', '대전', '광주', '대구', '울산', '부산'].includes(region.id) ? 4 : 5
                )}
                fontWeight="700"
                fill={first ? c1.text : '#64748B'}
                paintOrder="stroke"
                stroke={first ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)'}
                strokeWidth="1.5"
                style={{ pointerEvents: 'none' }}
              >
                {region.id}
              </text>
              {/* 1위 이름 (지역명 아래) */}
              {first && (
                <text
                  x={region.labelX}
                  y={region.labelY + 4.5}
                  textAnchor="middle"
                  fontSize={3}
                  fill="white"
                  fillOpacity={0.9}
                  paintOrder="stroke"
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="1"
                  style={{ pointerEvents: 'none' }}
                >
                  {first.name.length > 3 ? first.name.slice(0, 3) : first.name}
                </text>
              )}
            </g>
          );
        })}

        {/* 세종: 경로 없음 → 작은 원 마커 */}
        {(() => {
          const data = dataMap.get(SEJONG_MARKER.id);
          const first = data?.first;
          const c1 = getPartyColor(first?.party);
          const isHovered = hoveredRegion === SEJONG_MARKER.id;
          return (
            <g
              onClick={() => handleClick(SEJONG_MARKER.id)}
              onMouseEnter={() => setHoveredRegion(SEJONG_MARKER.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={SEJONG_MARKER.cx}
                cy={SEJONG_MARKER.cy}
                r={SEJONG_MARKER.r + (isHovered ? 1 : 0)}
                fill={first ? c1.fill : '#fb923c'}
                stroke="white"
                strokeWidth="0.8"
                fillOpacity={isHovered ? 1 : 0.85}
              />
              <text
                x={SEJONG_MARKER.cx}
                y={SEJONG_MARKER.cy + 1.2}
                textAnchor="middle"
                fontSize="2.8"
                fontWeight="700"
                fill="white"
                style={{ pointerEvents: 'none' }}
              >
                세종
              </text>
            </g>
          );
        })()}

        {/* 제주도 구분선 */}
        <line x1="4" y1="182" x2="126" y2="182" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2,2" />
        <text x="65" y="180.5" textAnchor="middle" fontSize="3.5" fill="#94A3B8">제주도</text>
      </svg>
    </div>
  );
}
