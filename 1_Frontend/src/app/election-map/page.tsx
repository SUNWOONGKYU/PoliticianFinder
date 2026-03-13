'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const PARTY_COLORS: Record<string, { fill: string; text: string; border: string }> = {
  '더불어민주당': { fill: '#1565C0', text: '#FFFFFF', border: '#0D3A9E' },
  '국민의힘':     { fill: '#C62828', text: '#FFFFFF', border: '#A01018' },
  '조국혁신당':   { fill: '#1a237e', text: '#FFFFFF', border: '#0d1657' },
  '개혁신당':     { fill: '#E65100', text: '#FFFFFF', border: '#BF360C' },
  '무소속':       { fill: '#546e7a', text: '#FFFFFF', border: '#37474f' },
};
const DEFAULT_COLOR = { fill: '#90a4ae', text: '#FFFFFF', border: '#78909c' };
const UNSCORED_COLOR = { fill: '#cfd8dc', text: '#546e7a', border: '#b0bec5' };

function partyColor(party?: string) {
  if (!party) return DEFAULT_COLOR;
  return PARTY_COLORS[party] || DEFAULT_COLOR;
}

// Full name → short name
const REGION_SHORT: Record<string, string> = {
  '서울특별시': '서울',
  '인천광역시': '인천',
  '경기도': '경기',
  '강원특별자치도': '강원',
  '충청북도': '충북',
  '충청남도': '충남',
  '대전광역시': '대전',
  '세종특별자치시': '세종',
  '경상북도': '경북',
  '전라북도': '전북',
  '전북특별자치도': '전북',
  '대구광역시': '대구',
  '경상남도': '경남',
  '광주광역시': '광주',
  '전라남도': '전남',
  '울산광역시': '울산',
  '부산광역시': '부산',
  '제주특별자치도': '제주',
};

// Short name → Full name
const REGION_FULL: Record<string, string> = {
  '서울': '서울특별시',
  '인천': '인천광역시',
  '경기': '경기도',
  '강원': '강원특별자치도',
  '충북': '충청북도',
  '충남': '충청남도',
  '대전': '대전광역시',
  '세종': '세종특별자치시',
  '경북': '경상북도',
  '전북': '전라북도',
  '대구': '대구광역시',
  '경남': '경상남도',
  '광주': '광주광역시',
  '전남': '전라남도',
  '울산': '울산광역시',
  '부산': '부산광역시',
  '제주': '제주특별자치도',
};

// Left column (8 regions)
const LEFT_REGIONS = ['서울', '인천', '경기', '강원', '충남', '대전', '세종', '충북'];
// Right column (9 regions)
const RIGHT_REGIONS = ['경북', '대구', '경남', '울산', '부산', '광주', '전북', '전남', '제주'];

// ─── SVG 경로 ─────────────────────────────────────────────────────────────────

const REGION_PATHS = [
  { id: '서울',  labelX: 41,  labelY: 43,  d: 'M36.5,45.3c0,0,4.6,0.6,5.5,1.3c0.9,0.7,3.3,0.3,3.7-1c0.4-1.3,2-0.5,2.8-1.3s0.8-1.9,0.4-2.9c-0.3-1-0.8-0.7-0.8-2.1c-0.1-1.3-1.3-3.1-2.6-4c-1.3-0.8-3,0-3.5,0.7c-0.6,0.7-5.6,5.2-5.6,5.2S37.3,42.6,36.5,45.3z' },
  { id: '인천',  labelX: 18,  labelY: 50,  d: 'M31.1,51.1c0.3-3.5-1.3-5.5-3.8-5.7c-2.5-0.2-2.2,5.2-6.6,0c-4.4-5.2-0.8-4.9-1.5-6.2c-0.7-1.3-3.7-0.7-4.6-1.3c-0.8-0.7-2-1.5-0.7-3c1.4-1.5,1.7-2.5,3-3.9c1.4-1.3,2.4,0.6,4-0.7c0.6-0.5,1-3,2.7-2.2s2.6,2.4,3.2,3.2c0,0,0.7,1.4,3,0.9l0,0c0,0-4,3.2-1.8,4.8c0,0,0.8-0.3,0.8,3.1c0,0-0.3,0.8,1.9,0.2c2.3-0.6,4.4-0.6,5.1,0.5c0.7,1.1,2.5,3.9-2.2,7.6L31.2,51L31.1,51.1z' },
  { id: '경기',  labelX: 44,  labelY: 60,  d: 'M67.7,57.8l0-0.3c0,0,0.4-5.1,0.8-6.6c0.4-1.5,0.1-3.9-0.3-4.8c-0.3-0.8,0.1-1.5,0.1-1.5c2.8-6.1-1.8-4.4-3.4-4.8c-0.9-0.2-3.4-0.8-3.7-2c-0.3-1.3-1.1-3.8-1.1-5.8s1-2.7,1-3.7c0-1,1.4-4.4-7.1-8.9c-8.5-4.4-6.1-7.4-6.1-7.4s-8.6,2.1-9.2,2.5s-3,2-3.9,2.2c-0.7,0.2-2.8,1,0,2.2s5.2,2.1,1.2,4.8c-4,2.7-4.5,0.9-2.9,2.7c1.6,1.8,1.2,3.5-3,5.5c0,0-4.1,3.3-1.9,4.9c0,0,0.8-0.3,0.8,3.1c0,0-0.3,0.8,1.9,0.2c2.3-0.6,4.4-0.6,5.1,0.5c0.7,1.1,2.5,3.9-2.2,7.6l-2.6,2.8c0,0,0.1,2.8-1.3,3.3c-1.5,0.5-2.1,1.9-0.9,3.6c1.2,1.7,4.5,5.4,4.6,5.8c0.1,0.5,2.3,5.4,9.4,3.1c0,0,2.7-1.6,7,0s5.1,1.3,5.1,1.3s2.2-4.2,3.1-4.7c0.9-0.5,3.3-0.9,4.5-1.6c1.2-0.7,4.2-3.3,4.2-3.3l0.6-0.5L67.7,57.8z' },
  { id: '강원',  labelX: 95,  labelY: 42,  d: 'M119.7,56.3c0,0-2.8,4.9-5.1,4.8c-2.3-0.1-5.2-1.2-5.7-1.2c-0.5,0-1.4,0.3-1.8,1.2c-0.4,0.9-2.3,0.7-3.5,0c-1.5-0.9-1.8,0.2-3.7,0.3c-4.1,0.3-5.6,1.2-5.6,1.2c-0.7-3.7-3.5-3.4-3.5-3.4c-5.8-1.4-4.5-0.6-6.4-3.7c-1.9-3.1-3.7-1.4-3.7-1.4s-3.2,3.9-4,0.8c-0.8-3.1-1.9-0.5-1.9-0.5c-1.5,4.9-7.1,3.2-7.1,3.2l0-0.3c0,0,0.4-5.1,0.8-6.6c0.4-1.5,0.1-3.9-0.3-4.8c-0.3-0.8,0.1-1.5,0.1-1.5c2.8-6.1-1.8-4.4-3.4-4.8c-0.9-0.2-3.4-0.8-3.7-2c-0.3-1.3-1.1-3.8-1.1-5.8s1-2.7,1-3.7c0-1,1.4-4.4-7.1-8.9c-8.5-4.4-6.1-7.4-6.1-7.4c2.4-1.3,3.8-2.8,4.7-1.6c0.8,1.2,2.7,2.4,4.7,0.5c2-1.9,5.1-1.8,5.2-0.8c0.2,1,0.8,2.2,3.5,2c2.7-0.2,11.3,0.4,11.3-2.7c0-3.1,4.7-3.2,5.6-2.4c0.8,0.8,1.3,4.5,2-0.4c0.7-5,2.7-8.2,5.1-2.4c2.4,5.7,1.7,6.2,2.9,7.4c1.2,1.2,1.9,3.2,1.9,5.2c0,2,4.6,6.1,6.2,8.6c1.7,2.5,6.4,7.1,7.8,8.8c1,1.2,2.2,7.4,4.2,10.3c2,2.9,4.3,3.4,5.9,9.1c0.7,2.6,0.8,2.9,0.8,2.9' },
  { id: '충북',  labelX: 72,  labelY: 82,  d: 'M92.3,64.4c-1.1,1.9-0.7,4.1-0.7,4.1s1.4,5.6-4.8,3.1c-6.2-2.4-5.2,0-7.1,0.6c-1.9,0.6-3.6,3.5-5.4,5c-1.8,1.5-5.2,2.4-3.8,4.1c1.4,1.8,2.5,3.4,2,5.3c-0.4,1.9-3.1,3.5-2.4,5.1c0.8,1.6,2.8,2,5,2c2.2-0.1,2.6,1.8,0.9,4.4c-1.7,2.6-1.9,5.7-2.5,6.2l-1.7,1.6c-2.9-1.5-7-1.6-7-1.6l-0.2-1.1c-1.4-4-1.7-6.4-2.1-7.2c-1-2-3-1.2-3-1.2l0.6-1.3c0.1-0.3,0.4-2.5,0.6-3.4c0.2-0.9,0.2-2.7-0.1-3.4c-0.3-0.7-0.8-0.6-1.5-0.8c-0.7-0.2-3.3-2.3-3.3-2.3s-1.6-2.9-2.6-4.2c-3.2-4,0.7-4.9,0.7-4.9s7.2-1.4,1-6.6c0,0,2.2-4.2,3.1-4.7c0.9-0.5,3.3-0.9,4.5-1.6c1.2-0.7,4.2-3.3,4.2-3.3l0.6-0.5l0.3-0.3c0,0,5.6,1.7,7.1-3.2c0,0,1.1-2.6,1.9,0.5c0.8,3.1,4-0.8,4-0.8s1.7-1.7,3.7,1.3c1.9,3.1,0.6,2.3,6.4,3.7c0,0,2.8-0.2,3.5,3.4C94.3,62.7,93,63.3,92.3,64.4z' },
  { id: '충남',  labelX: 33,  labelY: 88,  d: 'M54,74.8c7.2-2.1,1.1-6.4,1.1-6.4l-0.2-0.1c0,0-0.8,0.1-5-1.4c-4.2-1.5-7,0-7,0c-7.4,2.4-9.1-2.7-9.5-2.5c-0.4,0.2-1.9-0.1-1.9-0.1c-0.3-0.1-1-0.3-4.4-1.7c-3.4-1.3-4.6-0.3-5.2,0c-0.7,0.3-7.2,5.8-7.9,6.4c-1.2,1.2-0.7,3.7-1,6.1c-0.3,2.4-0.3,5.7,2.2,4c2.5-1.7,4.6,1,3.2,4c-1.3,3,0.8,6.9,4.6,7.3c3.7,0.3,3.9,4.9,2.7,5.7c-1.2,0.8-2.7,1.3,1.2,4.9l3.5,3.7c0,0,5.4,2,6.8-1.5c1.4-3.5,2.8-5.4,4.3-5.1s2.7,2.6,2.6,4.3c-0.1,1.7,2.6,1.9,4,0.8c1.4-1.1,4-3.9,5.5-2.1c1.4,1.7,1.7,4.3,3.4,4.8c1.7,0.5,9.1,1.4,7.7-2.5c-1.4-4-1.8-6.4-2.1-7.2c-0.8-1.8-2.4-1.4-3-1.1l-0.3,0.4c-0.9,1.3-0.8,1.1-1.1,1.4s-1.5,1.1-2.7,0.4c-1.3-0.7-3.6-0.1-4.1-5.7c-0.1-1.3,0.4-3.3,0.4-3.3s0-0.1-1.5-0.4c-1.3-0.2-1.6-1.6-2-4.6c-0.4-2.9,0.5-2.8-0.5-2.9c-1-0.1-0.4-1.1-0.1-2.2c0.3-1-0.6-1.9-0.9-3.3c-0.3-1.4,1.6-2.4,2.3-1.1c0.6,1.3,2.2,2,3.2,1.8C52.7,75.5,53.5,74.9,54,74.8z' },
  { id: '대전',  labelX: 57,  labelY: 94,  d: 'M59.6,95l-0.3,0.4c-0.9,1.3-0.8,1.1-1.1,1.4c-0.3,0.3-1.5,1.1-2.7,0.4c-1.3-0.7-3.7,0-4.1-5.7c-0.4-5.8,3.9-5,4.4-6.2c0,0,0.3-0.9,0.2-1.4s2.6,2.1,3.2,2.3c0.7,0.2,1.1,0.1,1.5,0.8c0.3,0.7,0.3,2.5,0.1,3.4c-0.2,0.9-0.5,3.1-0.6,3.4L59.6,95z' },
  { id: '경북',  labelX: 99,  labelY: 95,  d: 'M95.4,121.7c0.9,1.1,6.4,1.9,9,1.5c2.6-0.3,2.9-1.8,4.7-2.3c1.9-0.5,3.1-3.2,5.1-3.6c1.9-0.4,3.2,0.4,4.6,1.3c1.3,0.8,7.2,0,7.2-1.2c0-0.2-0.2-0.6-0.2-0.6c-1-1.9-0.2-1.3,0.8-3.2c1-1.9,0.7-3,1.9-5.4c1.2-2.4-0.4-3.4,0-5.7c0.3-2.4-2-2.2-2.2-1c-0.2,1.2-2.9,2.7-3.4,1.7c-0.5-1,0-2.4-0.3-3.7c-0.3-1.3-0.8-3-1.2-7.6c-0.3-4.6,1-2.2,2-4c1-1.9-1-5.9-0.7-8.6c0.3-2.7,1.5-7.6,0-8.9c-1.2-1.1-0.4-2.1-0.2-2.7c0.1-0.6,1.2-5.8,0-6.9c-1.3-1.1-2.7-4.2-2.7-4.2s-2.8,4.9-5.1,4.8c-2.3-0.1-5.2-1.2-5.7-1.2c-0.5,0-1.4,0.3-1.8,1.2c-0.4,0.9-2.4,0.8-3.5,0c-1.2-0.8-1.8-0.1-3.5,0.3c-1.7,0.3-6.1,0.3-7.8,3c-1.1,1.8-0.7,4.1-0.7,4.1s1.4,5.6-4.8,3.1c-6.2-2.4-5.2,0-7.1,0.6c-1.9,0.6-3.6,3.5-5.4,5c-1.8,1.5-5.2,2.4-3.8,4.1c1.4,1.8,2.5,3.4,2,5.3c-0.4,1.9-3.1,3.5-2.4,5.1c0.8,1.6,2.8,2,5,2c2.2-0.1,2.6,1.8,0.9,4.4s-1.9,5.7-2.5,6.2c-1,0.9-1.9,1.8-1.9,1.8s0.8,2.8,0.8,4.4c0,0,8.4,3,9.2,3.5c0.8,0.5,2.3,2.4,1.5,4.1c0,0-0.4,2.2,4,1.9c0,0,3.6-4.7,1.1-7.8c0,0-2.3-2.2,1-3.5c3.3-1.4,2-3.4,4.7-3.5c2.7-0.2,4.9-1.5,5.7-0.8c0.8,0.8,4.6,4.2,3.1,5.7c-1.5,1.5-4.7,6.8-5.8,7.4c-1.1,0.6-2.7,0.5-2.6,1.5c0,0.2,0.5,2.1,0.5,2.1L95.4,121.7z' },
  { id: '전북',  labelX: 44,  labelY: 118, d: 'M27,105.6c-3.1,0.3,1.3,4.2,1.3,4.2c3.8,5-1.4,8.7-1.5,8.8c-0.1,0.1-3.2,2-2.8,4.1c0.5,2.3-0.5,2-0.9,2.5c-1.5,2.2-0.3,3.2-0.3,3.2s2.6,3.7,4.1,4.9c0,0,1.4,0.7,2.6,0.7c0,0,4.2-2.6,5.6-5.2c1.4-2.6,6.1,0.7,7.4,1.5c1.3,0.8,3.4,5.1,5.5,4.4c2.1-0.8,3.7-0.8,5.1-0.3c1.4,0.6,4.5-1.2,5.3-1.9c2.2-1.8,4.1,1.5,4,1c-0.1-0.5,1.5-3.3,1.5-3.3c1-2.3-0.4-2.7-0.8-3.7c-0.4-1-1.1-4.1-0.2-4.8c0.9-0.7,1.3-2.3,1.3-2.3c0.6-7.4,8.4-8.6,8.4-8.6c0-0.8-0.5-3.2-0.8-4.4c-0.3-1.2-6.8-1.9-6.8-1.9c0.6,2.5-6.2,2.1-7.9,1.6c-1.7-0.5-1.9-3.1-3.4-4.8c-1.4-1.7-4.1,1-5.5,2.1c-1.3,1.1-4,0.9-4-0.8c0.1-1.7-1.1-4.1-2.6-4.3c-1.5-0.3-2.9,1.7-4.3,5.1c-1.4,3.5-6.8,1.5-6.8,1.5L27,105.6z' },
  { id: '대구',  labelX: 92,  labelY: 116, d: 'M95,121.2c0,0-0.5-1.8-0.5-2.1c-0.1-1,1.5-0.9,2.6-1.5c1.1-0.6,4.3-5.9,5.8-7.4c1.5-1.5-2.4-5-3.1-5.7c-0.8-0.8-3,0.6-5.7,0.8c-2.7,0.2-1.4,2.2-4.7,3.5c-3.3,1.3-1,3.5-1,3.5c2.6,2.7-0.8,7.7-0.8,7.7S92.8,119.6,95,121.2z' },
  { id: '경남',  labelX: 83,  labelY: 142, d: 'M106.3,136.8c-2.1,0.9-1.9,2.7-1.9,2.7c-1.5,4.1-3.7,2.6-4.8,1.8c-1.1-0.8-2.7-1.8-2.9-0.6c-0.2,1.2-3.3,2.7-3.3,2.7c-3.9,1.7-1.1,3.7-1.1,3.7c3.4,3.7,3.6,1.6,6-1.3c2.4-2.8,4.9,1.6,4.9,1.6c-0.6,0.6-0.7,3.5-0.7,3.5c-0.2,5.2-3.4,9.3-5.9,9.2c-2.5-0.1-7.2-0.1-7.8-3.7c-0.7-3.6-2.5-1.9-3.2-1.3c-0.8,0.6-3.9,1.2-4.8,1c-0.9-0.1-1.9,0.6-2.1,2.5c0,0,0.7,1.9-1.7,0.8c-2.4-1.1-4.1-1-5.8-0.6c0,0-0.4-0.8-0.4-4.2l0,0.1c0.4-4.6-0.8-3.3-1.3-4.5c-0.4-1.2-0.5-3.9-0.8-4.4c-0.3-0.5-3.8-2.3-4.5-5.1c-0.5-1.9-1.4-4.3-1.5-6.4l-0.1-0.3l0-0.5c-0.1-0.5,1.5-3.3,1.5-3.3c1-2.3-0.4-2.7-0.8-3.7c-0.4-1-1.1-4.1-0.2-4.8c0.9-0.7,1.3-2.3,1.3-2.3c0.6-7.4,8.4-8.6,8.4-8.6s8.4,3,9.2,3.5c0.8,0.5,2.3,2.4,1.5,4.1c0,0-0.4,2.2,4,1.9l0.3-0.1c0,0,5.3-0.4,7.4,1.2l0.4,0.4c0.9,1.1,6.4,1.9,9,1.5c2.6-0.3,2.9-1.8,4.7-2.3l1-0.5c0,0,0.4,2-0.9,3.2c-1.3,1.3,0.1,2,1.7,2.7c1.6,0.7,5.1,1.3,5.7,2.9C116.7,129.3,113.8,133.4,106.3,136.8z' },
  { id: '광주',  labelX: 33,  labelY: 142, d: 'M31.5,136.6c0.2-0.5,0.7,0.2,2-0.1c1.3-0.3,2.9-1.1,4.9-0.7c2,0.4,4.6,2.8,4,6.8c-0.7,4-5.9,3.4-7.3,2.4c-1.1-0.8-0.1-1.3-2.8-2.2c-2.7-0.9-2-2.6-1.1-4C31.2,138.8,31.2,137.4,31.5,136.6z' },
  { id: '전남',  labelX: 30,  labelY: 165, d: 'M70.6,154.5c0.4-4.6-0.8-3.3-1.3-4.5c-0.4-1.2-0.5-3.9-0.8-4.4c-0.3-0.5-3.8-2.3-4.5-5.1c-0.5-1.9-1.4-4.3-1.5-6.4l-0.1-0.3c-0.2-1.5-2.8-2.7-3.9-1.5c-0.7,0.7-3.9,2.5-5.3,1.9c-1.4-0.6-3-0.5-5.1,0.3c-2.1,0.8-4.2-3.5-5.5-4.4c-1.3-0.8-6-4.1-7.4-1.5c-1.4,2.6-5.6,5.2-5.6,5.2c-1.1,0-2.6-0.7-2.6-0.7c-1.5-1.2-4.1-4.9-4.1-4.9s-0.5-1.1-1.3,0.2c-1,1.6,0.2,1.5,0,2.5c-0.2,1-3.5,2-2,5.2c1.5,3.2-1,3.7-3,4.2c-2,0.5-3.5-0.3-7.1,0c-3.5,0.3-2,2.9,0.7,4.4c2.7,1.5,2.1,3.5-0.7,4.2c-1.7,0.4-2.4,0.1-2.2,1.5c0.6,4.7-1.5,3.5-2.4,4.4c-0.9,0.8-1.3,1.7-0.7,3.2c0.7,1.5,1.5,1.2,1.5,3c0,1.9-2.5,2.5,1.7,3.9c4.2,1.4,1.3,2.8,0.5,3.2c-2.4,1.2-4.4,5.6-5.7,9.1c-1.3,3.5,1.8,1.7,1.9,2.5c0.4,1.8,1.9,4.6,6.8,0c9.1,0.8,2.5-5.6,3.7-5.6c1.2,0,5.1-1.2,6.1-1.3c1-0.2,4.4,1.5,4.4,1.5l5.4,2c0,0,5.4,0,8.9,0.2c3.5,0.2,4.6,0.3,6.1-0.5c1.5-0.8,0.8-3.4,1.3-4.2c0.5-0.8,3.4-0.5,5.1-0.5c1.7,0,0.2-3.4,3.7-2c3.5,1.3,4.7,0.2,4.9-2.4c0.2-2.5-4.2-6.7,2.7-4.6c6.9,2.2,6.8-1.6,7.6-3l0.2-1C70.9,158.6,70.5,157.7,70.6,154.5' },
  { id: '울산',  labelX: 119, labelY: 126, d: 'M122.2,129c-0.3-0.7-0.1-1.1,2-2.8c2-1.8,1.7-8.8,1.7-8.8c0,1.2-5.7,2-7.1,1.2c-1.5-0.9-2.3-1.7-4.7-1.2c-1,0.2-3.9,3.1-3.9,3.1s0.4,2-0.9,3.2c-1.3,1.3,0.1,2,1.7,2.7c1.6,0.7,5.1,1.3,5.7,2.9c0,0,0.1,4.4,3,4l0.8,0C120.5,133.3,122.8,130.4,122.2,129z' },
  { id: '부산',  labelX: 111, labelY: 140, d: 'M118.5,138.1c-1.6,4.1-3.7,3.6-4,3.1c-0.4-0.5-3-0.7-3,0.6c0,1.3-1.6,2.2-1.6,2.2c-5.4,1.5-6.7,3.3-6.7,3.3s-2.5-4.4-4.9-1.6c-2.4,2.9-2.6,5-6,1.3c0,0-2.8-2,1.1-3.7c0,0,3.1-1.4,3.3-2.7c0.2-1.2,1.8-0.2,2.9,0.6c1.1,0.8,3.4,2.4,4.8-1.8c0,0-0.1-1.8,1.9-2.7c7.5-3.4,10.3-7.7,10.4-7.5c0.2,0.5-0.1,4.8,3.8,4C121.1,133.2,118.5,138.1,118.5,138.1z' },
  { id: '제주',  labelX: 25,  labelY: 195, d: 'M21.5,188.9c0,0-2.2,3.3-6.1,3.9c-3.9,0.6-2.5,5.8-0.3,7.2c2.2,1.4,3,3.7,6.1,1.6c1.6-1.1,4.8,0.1,8.8-0.3c1.6-0.1,11.5-4.8,10.8-8.9c-0.8-4.1-2.7-6.6-7-5.3c-4.3,1.3-7.5,1.1-8.7,1.1C23.8,188.4,22.8,188.1,21.5,188.9z' },
];

const SEJONG_MARKER = { id: '세종', cx: 50, cy: 83, r: 3.5, labelX: 55, labelY: 83 };

// ─── 타입 ──────────────────────────────────────────────────────────────────────

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

const RANK_MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

// ─── 지역 카드 컴포넌트 ────────────────────────────────────────────────────────

function RegionCard({
  regionId,
  entry,
  isSelected,
  onClick,
  viewMode,
}: {
  regionId: string;
  entry: RegionEntry | undefined;
  isSelected: boolean;
  onClick: () => void;
  viewMode: 'ai' | 'poll';
}) {
  const candidates = entry?.candidates || [];
  const top = candidates[0];
  const topColor = (viewMode === 'poll' || top?.hasScore) ? partyColor(top?.party) : DEFAULT_COLOR;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        boxShadow: isSelected
          ? `0 0 0 3px #FBBF24, 0 4px 16px rgba(0,0,0,0.15)`
          : '0 2px 8px rgba(0,0,0,0.08)',
        border: isSelected ? '1.5px solid #FBBF24' : '1.5px solid #e5e7eb',
        background: '#fff',
      }}
    >
      {/* Card header — party color strip */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{
          background: top?.hasScore ? topColor.fill : '#64748b',
        }}
      >
        <span className="text-xs font-bold text-white tracking-wide">{regionId}</span>
        {top?.hasScore ? (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
          >
            {top.party.replace('더불어민주당', '민주').replace('국민의힘', '국힘').replace('조국혁신당', '조혁').replace('개혁신당', '개혁')}
          </span>
        ) : (
          <span className="text-[10px] text-white/60">미평가</span>
        )}
      </div>

      {/* Candidate name + score */}
      <div className="px-3 py-2.5">
        {top ? (
          <>
            <div className="font-bold text-gray-900 text-sm leading-tight">
              {top.name}
            </div>
            {viewMode === 'poll' ? (
              <div className="mt-0.5 flex items-baseline gap-1">
                {top.pollSupport ? (
                  <>
                    <span className="text-lg font-extrabold" style={{ color: topColor.fill }}>
                      {top.pollSupport}
                    </span>
                    <span className="text-[10px] text-gray-400">지지율</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">지지율 미공개</span>
                )}
              </div>
            ) : top.hasScore ? (
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-lg font-extrabold" style={{ color: topColor.fill }}>
                  {top.finalScore}
                </span>
                <span className="text-[10px] text-gray-400">점 · AI 종합</span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 mt-0.5">평가 예정</div>
            )}
          </>
        ) : (
          <div className="text-xs text-gray-400">등록 없음</div>
        )}
      </div>

      {/* Candidate count badge */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          총 {entry?.total ?? 0}명 출마
        </span>
        <span className="text-[10px] text-gray-400">
          {isSelected ? '▲ 닫기' : '▼ 상세'}
        </span>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function ElectionMapPage() {
  const [regions, setRegions] = useState<RegionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'ai' | 'poll'>('poll');

  const fetchData = useCallback(async (mode: 'ai' | 'poll') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/politicians/metro-map?view_mode=${mode}`);
      const json = await res.json();
      if (json.success) setRegions(json.regions || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(viewMode); }, [fetchData, viewMode]);

  // Build lookup maps
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
    if (viewMode === 'poll') return partyColor(top.party);
    if (!top.hasScore) return UNSCORED_COLOR;
    return partyColor(top.party);
  };

  const selectedEntry = selectedRegion ? (regionMap.get(selectedRegion) ?? null) : null;

  const handleRegionClick = (regionId: string) => {
    setSelectedRegion(prev => prev === regionId ? null : regionId);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)',
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      {/* ── Standalone header ─────────────────────────────────────────────────── */}
      <header
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
              2026 지방선거 광역단체장 지도
            </h1>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', fontWeight: 400 }}>
              {viewMode === 'poll' ? '여론조사 1위 기준' : 'AI 평가 기준 · Claude · ChatGPT · Gemini · Grok 종합'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* 뷰 모드 토글 */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, gap: 2 }}>
              <button
                onClick={() => setViewMode('poll')}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: viewMode === 'poll' ? '#1e293b' : 'transparent',
                  color: viewMode === 'poll' ? '#fff' : '#64748b',
                }}
              >
                📊 여론조사
              </button>
              <button
                onClick={() => setViewMode('ai')}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: viewMode === 'ai' ? '#6366f1' : 'transparent',
                  color: viewMode === 'ai' ? '#fff' : '#64748b',
                }}
              >
                🤖 AI 평가
              </button>
            </div>
            <a
              href="/metro-map"
              style={{
                fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 600,
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid #6366f1', transition: 'all 0.2s',
              }}
            >
              전체 보기
            </a>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
          <div style={{
            width: 40, height: 40,
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>

          {/* ── Three-column layout ───────────────────────────────────────────── */}
          <div
            className="election-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr minmax(220px, 340px) 1fr',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {/* ── LEFT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                수도권 · 충청권
              </div>
              {LEFT_REGIONS.map(regionId => (
                <RegionCard
                  key={regionId}
                  regionId={regionId}
                  entry={regionMap.get(regionId)}
                  isSelected={selectedRegion === regionId}
                  onClick={() => handleRegionClick(regionId)}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* ── CENTER COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SVG Map */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: '16px 12px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 }}>
                  클릭하여 지역 상세 보기
                </div>
                <svg
                  viewBox="0 0 150 210"
                  style={{ width: '100%', filter: 'drop-shadow(0 3px 12px rgba(0,0,0,0.12))' }}
                  aria-label="전국 광역단체장 지도"
                >
                  <rect x="0" y="0" width="150" height="210" fill="#EEF2FF" rx="6" />

                  {REGION_PATHS.map((region) => {
                    const color = getRegionColor(region.id);
                    const isSelected = selectedRegion === region.id;
                    const isHovered = hoveredRegion === region.id;
                    return (
                      <path
                        key={region.id}
                        d={region.d}
                        fill={isSelected ? color.border : (isHovered ? color.border : color.fill)}
                        stroke={isSelected ? '#FBBF24' : (isHovered ? '#fff' : 'rgba(255,255,255,0.7)')}
                        strokeWidth={isSelected ? 1.5 : (isHovered ? 1 : 0.6)}
                        style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => handleRegionClick(region.id)}
                        onMouseEnter={() => setHoveredRegion(region.id)}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                    );
                  })}

                  {/* 세종 circle */}
                  {(() => {
                    const color = getRegionColor('세종');
                    const isSelected = selectedRegion === '세종';
                    const isHovered = hoveredRegion === '세종';
                    return (
                      <circle
                        cx={SEJONG_MARKER.cx}
                        cy={SEJONG_MARKER.cy}
                        r={SEJONG_MARKER.r}
                        fill={isSelected ? color.border : (isHovered ? color.border : color.fill)}
                        stroke={isSelected ? '#FBBF24' : 'rgba(255,255,255,0.7)'}
                        strokeWidth={isSelected ? 1.5 : 0.8}
                        style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => handleRegionClick('세종')}
                        onMouseEnter={() => setHoveredRegion('세종')}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                    );
                  })()}

                  {/* Region labels */}
                  {REGION_PATHS.map((region) => {
                    const color = getRegionColor(region.id);
                    const isSmall = ['서울', '대전', '대구', '광주', '울산', '부산'].includes(region.id);
                    const textFill = color.text === '#FFFFFF' ? 'rgba(255,255,255,0.95)' : '#374151';
                    return (
                      <text
                        key={`lbl-${region.id}`}
                        x={region.labelX}
                        y={region.labelY}
                        textAnchor="middle"
                        fontSize={isSmall ? 3.2 : 4.8}
                        fill={textFill}
                        fontWeight="700"
                        style={{ pointerEvents: 'none' }}
                      >
                        {region.id}
                      </text>
                    );
                  })}
                  {/* 세종 label */}
                  <text
                    x={SEJONG_MARKER.labelX + 1}
                    y={SEJONG_MARKER.labelY - 5.5}
                    textAnchor="start"
                    fontSize={3.2}
                    fill={partyColor(regionMap.get('세종')?.candidates[0]?.party).text === '#FFFFFF' ? 'rgba(255,255,255,0.9)' : '#374151'}
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    세종
                  </text>
                </svg>

                {/* Party legend */}
                <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: 0.5 }}>당색 범례</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
                    {[
                      { label: '더불어민주당', color: '#1565C0' },
                      { label: '국민의힘', color: '#C62828' },
                      { label: '조국혁신당', color: '#1a237e' },
                      { label: '개혁신당', color: '#E65100' },
                      { label: '무소속/기타', color: '#546e7a' },
                      { label: '미평가', color: '#cfd8dc', border: '#b0bec5' },
                    ].map(({ label, color, border }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, border: border ? `1px solid ${border}` : undefined, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: '#6b7280', lineHeight: 1.3 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected region detail panel */}
              {selectedEntry && selectedRegion && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(251,191,36,0.2)',
                    border: '2px solid #FBBF24',
                  }}
                >
                  {/* Panel header */}
                  <div style={{ background: '#FBBF24', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: 13 }}>
                      {REGION_FULL[selectedRegion] || selectedRegion}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#92400e' }}>{selectedEntry.total}명 출마</span>
                      <button
                        onClick={() => setSelectedRegion(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#92400e', lineHeight: 1, padding: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Candidate list */}
                  <div>
                    {selectedEntry.candidates.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                        등록된 출마자가 없습니다
                      </div>
                    ) : (
                      selectedEntry.candidates.map((c, i) => {
                        const col = partyColor(c.party);
                        return (
                          <a
                            key={c.id}
                            href={`/politicians/${c.id}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 14px',
                              borderBottom: i < selectedEntry.candidates.length - 1 ? '1px solid #f8fafc' : 'none',
                              textDecoration: 'none',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ fontSize: i < 3 ? 18 : 12, fontWeight: 700, width: 22, textAlign: 'center', flexShrink: 0, color: '#64748b' }}>
                              {RANK_MEDALS[i] || `${i + 1}`}
                            </div>
                            <div style={{ width: 3, height: 38, borderRadius: 2, backgroundColor: col.fill, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{c.name}</div>
                              <div style={{ fontSize: 10, color: col.fill, marginTop: 1, fontWeight: 600 }}>{c.party}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {viewMode === 'poll' ? (
                                c.pollSupport ? (
                                  <>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{c.pollSupport}</div>
                                    <div style={{ fontSize: 9, color: '#94a3b8' }}>지지율</div>
                                  </>
                                ) : (
                                  <div style={{ fontSize: 10, color: '#cbd5e1' }}>미공개</div>
                                )
                              ) : c.hasScore ? (
                                <>
                                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                                    {c.finalScore}
                                    <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>점</span>
                                  </div>
                                  <div style={{ fontSize: 9, color: '#94a3b8' }}>AI 종합</div>
                                </>
                              ) : (
                                <div style={{ fontSize: 10, color: '#cbd5e1' }}>평가 예정</div>
                              )}
                            </div>
                          </a>
                        );
                      })
                    )}
                    {selectedEntry.total > selectedEntry.candidates.length && (
                      <div style={{ padding: '8px 14px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                        <a
                          href={`/politicians?region=${encodeURIComponent(REGION_FULL[selectedRegion] || selectedRegion)}&category=광역단체장`}
                          style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                        >
                          + {selectedEntry.total - selectedEntry.candidates.length}명 더 보기 →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty state hint */}
              {!selectedEntry && (
                <div style={{ textAlign: 'center', padding: '16px 12px', borderRadius: 12, background: 'rgba(99,102,241,0.05)', border: '1px dashed rgba(99,102,241,0.2)' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>👆</div>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>지도 또는 카드를 클릭하면<br />1~5위 상세 랭킹을 볼 수 있습니다</p>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                영남권 · 호남권 · 제주
              </div>
              {RIGHT_REGIONS.map(regionId => (
                <RegionCard
                  key={regionId}
                  regionId={regionId}
                  entry={regionMap.get(regionId)}
                  isSelected={selectedRegion === regionId}
                  onClick={() => handleRegionClick(regionId)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>

          {/* ── Footer note ───────────────────────────────────────────────────── */}
          <div style={{ marginTop: 28, padding: '14px 20px', borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', fontSize: 11, color: '#6366f1', lineHeight: 1.7 }}>
            <strong>데이터 안내</strong> · AI 평가는 Claude · ChatGPT · Gemini · Grok 4개 AI가 10개 카테고리(전문성, 리더십, 비전, 청렴도, 윤리, 책임감, 투명성, 소통, 대응성, 공익)를 종합 평가한 점수입니다. 평가 점수 범위: 200~1,000점.
          </div>
        </div>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .election-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .election-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
