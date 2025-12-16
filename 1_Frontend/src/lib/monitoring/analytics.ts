// Task: Production Checklist E3
// Google Analytics Helper
// Updated: 2025-12-15

import ReactGA from "react-ga4";

// Google Analytics 초기화 여부
let isInitialized = false;

// Google Analytics 초기화
export const initGA = () => {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) {
    if (process.env.NODE_ENV === "development") {
      console.log("[GA] GA_ID not configured, skipping initialization");
    }
    return;
  }

  if (isInitialized) {
    return;
  }

  if (typeof window !== "undefined") {
    ReactGA.initialize(gaId, {
      gaOptions: {
        anonymizeIp: true,
        siteSpeedSampleRate: 100,
      },
    });
    isInitialized = true;

    if (process.env.NODE_ENV === "development") {
      console.log("[GA] Initialized with ID:", gaId);
    }
  }
};

// 페이지뷰 추적
export const logPageView = (path: string) => {
  if (!isInitialized || typeof window === "undefined") return;

  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: document.title,
  });
};

// 커스텀 이벤트 추적
export const logEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!isInitialized || typeof window === "undefined") return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// 사전 정의된 이벤트
export const analytics = {
  // 페이지뷰
  pageView: (path: string) => {
    logPageView(path);
  },

  // 검색 이벤트
  search: (searchTerm: string) => {
    logEvent("Search", "politician_search", searchTerm);
  },

  // 게시글 작성
  postCreate: (postType: string) => {
    logEvent("Post", "post_create", postType);
  },

  // 정치인 즐겨찾기
  politicianFavorite: (politicianId: string, isFavorite: boolean) => {
    logEvent(
      "Politician",
      isFavorite ? "add_favorite" : "remove_favorite",
      politicianId
    );
  },

  // 정치인 상세 조회
  politicianView: (politicianId: string, politicianName: string) => {
    logEvent("Politician", "view_detail", `${politicianName} (${politicianId})`);
  },

  // 정치인 평점 등록
  politicianRate: (politicianId: string, rating: number) => {
    logEvent("Politician", "rate", politicianId, rating);
  },

  // 사용자 로그인
  login: (method: "email" | "google") => {
    logEvent("Auth", "login", method);
  },

  // 사용자 회원가입
  signup: (method: "email" | "google") => {
    logEvent("Auth", "signup", method);
  },

  // 댓글 이벤트
  comment: (action: "create" | "delete" | "edit") => {
    logEvent("Comment", action);
  },

  // 투표 이벤트
  vote: (voteType: "agree" | "disagree") => {
    logEvent("Vote", "post_vote", voteType);
  },

  // 공유 이벤트
  share: (platform: string) => {
    logEvent("Share", "share_content", platform);
  },

  // AI 평가 리포트 조회
  aiReportView: (politicianId: string) => {
    logEvent("AIReport", "view", politicianId);
  },

  // AI 평가 리포트 구매
  aiReportPurchase: (politicianId: string, price: number) => {
    logEvent("AIReport", "purchase", politicianId, price);
  },

  // 에러 발생
  error: (errorType: string, errorMessage: string) => {
    logEvent("Error", errorType, errorMessage);
  },
};
