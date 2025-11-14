// 대한민국 행정구역 데이터
// 광역시도 및 시군구 목록

export interface RegionGroup {
  label: string; // 광역 이름 (예: "서울", "부산")
  fullName: string; // 전체 이름 (예: "서울특별시", "부산광역시")
  districts: string[]; // 기초 지역 목록 (예: ["강남구", "강동구"])
}

export const REGIONS: RegionGroup[] = [
  {
    label: "서울",
    fullName: "서울특별시",
    districts: [
      "강남구", "강동구", "강북구", "강서구", "관악구", "광진구",
      "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구",
      "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구",
      "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
    ]
  },
  {
    label: "부산",
    fullName: "부산광역시",
    districts: [
      "강서구", "금정구", "기장군", "남구", "동구", "동래구",
      "부산진구", "북구", "사상구", "사하구", "서구", "수영구",
      "연제구", "영도구", "중구", "해운대구"
    ]
  },
  {
    label: "대구",
    fullName: "대구광역시",
    districts: [
      "남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"
    ]
  },
  {
    label: "인천",
    fullName: "인천광역시",
    districts: [
      "강화군", "계양구", "남동구", "동구", "미추홀구", "부평구",
      "서구", "연수구", "옹진군", "중구"
    ]
  },
  {
    label: "광주",
    fullName: "광주광역시",
    districts: [
      "광산구", "남구", "동구", "북구", "서구"
    ]
  },
  {
    label: "대전",
    fullName: "대전광역시",
    districts: [
      "대덕구", "동구", "서구", "유성구", "중구"
    ]
  },
  {
    label: "울산",
    fullName: "울산광역시",
    districts: [
      "남구", "동구", "북구", "울주군", "중구"
    ]
  },
  {
    label: "세종",
    fullName: "세종특별자치시",
    districts: [
      "세종시"
    ]
  },
  {
    label: "경기",
    fullName: "경기도",
    districts: [
      "가평군", "고양시", "과천시", "광명시", "광주시", "구리시",
      "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시",
      "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시",
      "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시",
      "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"
    ]
  },
  {
    label: "강원",
    fullName: "강원특별자치도",
    districts: [
      "강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군",
      "양양군", "영월군", "원주시", "인제군", "정선군", "철원군",
      "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"
    ]
  },
  {
    label: "충북",
    fullName: "충청북도",
    districts: [
      "괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군",
      "제천시", "증평군", "진천군", "청주시", "충주시"
    ]
  },
  {
    label: "충남",
    fullName: "충청남도",
    districts: [
      "계룡시", "공주시", "금산군", "논산시", "당진시", "보령시",
      "부여군", "서산시", "서천군", "아산시", "예산군", "천안시",
      "청양군", "태안군", "홍성군"
    ]
  },
  {
    label: "전북",
    fullName: "전북특별자치도",
    districts: [
      "고창군", "군산시", "김제시", "남원시", "무주군", "부안군",
      "순창군", "완주군", "익산시", "임실군", "장수군", "전주시",
      "정읍시", "진안군"
    ]
  },
  {
    label: "전남",
    fullName: "전라남도",
    districts: [
      "강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시",
      "담양군", "목포시", "무안군", "보성군", "순천시", "신안군",
      "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군",
      "진도군", "함평군", "해남군", "화순군"
    ]
  },
  {
    label: "경북",
    fullName: "경상북도",
    districts: [
      "경산시", "경주시", "고령군", "구미시", "군위군", "김천시",
      "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군",
      "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군",
      "의성군", "청도군", "청송군", "칠곡군", "포항시"
    ]
  },
  {
    label: "경남",
    fullName: "경상남도",
    districts: [
      "거제시", "거창군", "고성군", "김해시", "남해군", "밀양시",
      "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군",
      "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"
    ]
  },
  {
    label: "제주",
    fullName: "제주특별자치도",
    districts: [
      "서귀포시", "제주시"
    ]
  }
];

// 지역 필터용 옵션 생성 헬퍼 함수
export function getRegionFilterOptions() {
  const options: Array<{ value: string; label: string; group?: string }> = [
    { value: "", label: "전체" }
  ];

  REGIONS.forEach(region => {
    // 광역 전체 옵션
    options.push({
      value: region.fullName,
      label: `${region.fullName} (전체)`,
      group: region.label
    });

    // 각 기초 지역 옵션
    region.districts.forEach(district => {
      options.push({
        value: `${region.label} ${district}`,
        label: district,
        group: region.label
      });
    });
  });

  return options;
}

// 광역 지역 목록만 가져오기
export function getMetropolitanAreas() {
  return REGIONS.map(region => ({
    label: region.label,
    fullName: region.fullName
  }));
}

// 특정 광역 지역의 기초 지역 목록 가져오기
export function getDistrictsByMetropolitan(metropolitanLabel: string) {
  const region = REGIONS.find(r => r.label === metropolitanLabel);
  return region ? region.districts : [];
}
