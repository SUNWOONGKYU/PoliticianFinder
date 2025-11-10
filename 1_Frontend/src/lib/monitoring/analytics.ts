// Task: P6O3
// Google Analytics Helper
// Generated: 2025-11-10
// Agent: devops-engineer

// NOTE: Install react-ga4 with: npm install react-ga4
// Uncomment the following line after installing the package
// import ReactGA from 'react-ga4';

// Temporary type-safe stub until react-ga4 is installed
const ReactGA = {
  initialize: (gaId: string, options?: any) => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
      console.log('[GA] Would initialize with ID:', gaId);
    }
  },
  send: (params: any) => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
      console.log('[GA] Would send:', params);
    }
  },
  event: (params: any) => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
      console.log('[GA] Would track event:', params);
    }
  },
} as any;

// Initialize Google Analytics
export const initGA = () => {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (gaId && typeof window !== 'undefined') {
    ReactGA.initialize(gaId, {
      gaOptions: {
        anonymizeIp: true,
      },
    });
  }
};

// Track page views
export const logPageView = (path: string) => {
  if (typeof window !== 'undefined') {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

// Track custom events
export const logEvent = (category: string, action: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined') {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};

// Predefined events
export const analytics = {
  // Page view
  pageView: (path: string) => {
    logPageView(path);
  },

  // Search event
  search: (searchTerm: string) => {
    logEvent('Search', 'politician_search', searchTerm);
  },

  // Post creation
  postCreate: (postType: string) => {
    logEvent('Post', 'post_create', postType);
  },

  // Politician favorite
  politicianFavorite: (politicianId: string, isFavorite: boolean) => {
    logEvent(
      'Politician',
      isFavorite ? 'add_favorite' : 'remove_favorite',
      politicianId
    );
  },

  // User login
  login: (method: 'email' | 'google') => {
    logEvent('Auth', 'login', method);
  },

  // User signup
  signup: (method: 'email' | 'google') => {
    logEvent('Auth', 'signup', method);
  },

  // Comment event
  comment: (action: 'create' | 'delete' | 'edit') => {
    logEvent('Comment', action);
  },

  // Voting event
  vote: (voteType: 'agree' | 'disagree') => {
    logEvent('Vote', 'post_vote', voteType);
  },

  // Share event
  share: (platform: string) => {
    logEvent('Share', 'share_content', platform);
  },
};
