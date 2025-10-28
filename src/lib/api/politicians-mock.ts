/**
 * Mock Adapter for Politicians API
 * Provides mock data for development
 */

import type { Politician } from '@/types/database';
import type { SearchFilterParams } from '@/types/filter';

// Mock politicians data based on seed data
export const MOCK_POLITICIANS_DATA: Politician[] = [
  {
    id: 1,
    name: 'Lee Junseok',
    name_en: 'Lee Junseok',
    birth_year: 1987,
    party: 'PEOPLE_POWER',
    position: 'National Assembly',
    district: 'Seoul Gangnam',
    profile_image_url: 'https://via.placeholder.com/150?text=Lee+Junseok',
    bio: 'Politician and political analyst',
    education: 'Seoul National University Law',
    career: 'National Assembly Member, Party Leader',
    website_url: null,
    wikipedia_url: null,
    assembly_url: null,
    total_ratings: 3,
    avg_rating: 4.04,
    total_bookmarks: 1,
    category_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    name: 'Han Dong-hoon',
    name_en: 'Han Dong-hoon',
    birth_year: 1973,
    party: 'PEOPLE_POWER',
    position: 'National Assembly',
    district: 'Seoul Gangseo',
    profile_image_url: 'https://via.placeholder.com/150?text=Han+Dong-hoon',
    bio: 'Former Minister of Justice',
    education: 'Seoul National University Law',
    career: 'Prosecutor, Justice Minister, National Assembly Member',
    website_url: null,
    wikipedia_url: null,
    assembly_url: null,
    total_ratings: 3,
    avg_rating: 3.82,
    total_bookmarks: 1,
    category_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    name: 'Oh Se-hoon',
    name_en: 'Oh Se-hoon',
    birth_year: 1964,
    party: 'PEOPLE_POWER',
    position: 'Mayor',
    district: 'Seoul',
    profile_image_url: 'https://via.placeholder.com/150?text=Oh+Se-hoon',
    bio: 'Current Mayor of Seoul',
    education: 'Korea University Law',
    career: '33rd, 35th Seoul Mayor',
    website_url: null,
    wikipedia_url: null,
    assembly_url: null,
    total_ratings: 3,
    avg_rating: 3.6,
    total_bookmarks: 1,
    category_id: 2,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 4,
    name: 'Lee Jae-myung',
    name_en: 'Lee Jae-myung',
    birth_year: 1964,
    party: 'DEMOCRATIC',
    position: 'Governor',
    district: 'Gyeonggi',
    profile_image_url: 'https://via.placeholder.com/150?text=Lee+Jae-myung',
    bio: 'Governor of Gyeonggi Province',
    education: 'Sungkyunkwan University Law',
    career: '9th Gyeonggi Governor',
    website_url: null,
    wikipedia_url: null,
    assembly_url: null,
    total_ratings: 2,
    avg_rating: 3.5,
    total_bookmarks: 1,
    category_id: 2,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 5,
    name: 'Shim Sang-jeung',
    name_en: 'Shim Sang-jeung',
    birth_year: 1960,
    party: 'JUSTICE',
    position: 'National Assembly',
    district: 'Seoul Jongno',
    profile_image_url: 'https://via.placeholder.com/150?text=Shim+Sang-jeung',
    bio: 'Social activist and politician',
    education: 'Seoul National University Social Welfare',
    career: '20th, 21st National Assembly Member',
    website_url: null,
    wikipedia_url: null,
    assembly_url: null,
    total_ratings: 2,
    avg_rating: 3.9,
    total_bookmarks: 0,
    category_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 6,
    name: 'Park Young-sun',
    name_en: 'Park Young-sun',
    birth_year: 1966,
    party: 'DEMOCRATIC',
    position: 'National Assembly',
    district: 'Seoul Guro',
    profile_image_url: 'https://via.placeholder.com/150?text=Park+Young-sun',
    bio: 'Former Minister of Gender Equality',
    education: 'Ewha Womans University Law',
    career: 'Minister of Gender Equality, National Assembly Member',
    website_url: null,
    wikipedia_url: null,
    assembly_url: null,
    total_ratings: 2,
    avg_rating: 3.7,
    total_bookmarks: 0,
    category_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

/**
 * Filter and paginate politicians
 */
export function filterPoliticians(
  politicians: Politician[],
  filters: SearchFilterParams,
  page: number,
  itemsPerPage: number
): { data: Politician[]; count: number } {
  let filtered = [...politicians];

  // Apply text search
  if (filters.searchName) {
    const searchLower = filters.searchName.toLowerCase();
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(searchLower) ||
      (p.name_en && p.name_en.toLowerCase().includes(searchLower))
    );
  }

  if (filters.searchParty) {
    const searchLower = filters.searchParty.toLowerCase();
    filtered = filtered.filter((p) => p.party.toLowerCase().includes(searchLower));
  }

  if (filters.searchRegion) {
    const searchLower = filters.searchRegion.toLowerCase();
    filtered = filtered.filter((p) => p.district?.toLowerCase().includes(searchLower));
  }

  // Apply array filters
  if (filters.parties && filters.parties.length > 0) {
    filtered = filtered.filter((p) => filters.parties!.includes(p.party));
  }

  if (filters.regions && filters.regions.length > 0) {
    filtered = filtered.filter((p) =>
      filters.regions!.some((region) => p.district?.includes(region))
    );
  }

  if (filters.positions && filters.positions.length > 0) {
    filtered = filtered.filter((p) => filters.positions!.includes(p.position || ''));
  }

  // Apply minimum election count filter
  if (filters.minElectionCount) {
    filtered = filtered.filter((p) => p.total_ratings >= filters.minElectionCount! * 100);
  }

  // Apply sorting
  const sortColumn = filters.sortBy || 'name';
  const ascending = filters.sortOrder !== 'desc';

  filtered.sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortColumn) {
      case 'rating':
        aValue = a.avg_rating || 0;
        bValue = b.avg_rating || 0;
        break;
      case 'popularity':
        aValue = a.total_ratings || 0;
        bValue = b.total_ratings || 0;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    if (typeof aValue === 'string') {
      return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return ascending ? aValue - bValue : bValue - aValue;
  });

  // Apply pagination
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage;
  const data = filtered.slice(from, to);

  return { data, count: filtered.length };
}

/**
 * Mock adapter API for politicians
 */
export const politiciansMA = {
  fetchPoliticians: async (filters: SearchFilterParams, page: number, itemsPerPage: number) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return filterPoliticians(MOCK_POLITICIANS_DATA, filters, page, itemsPerPage);
  },

  getPoliticianById: async (id: number) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return MOCK_POLITICIANS_DATA.find((p) => p.id === id) || null;
  },

  searchPoliticians: async (query: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const queryLower = query.toLowerCase();
    return MOCK_POLITICIANS_DATA.filter(
      (p) =>
        p.name.toLowerCase().includes(queryLower) ||
        (p.name_en && p.name_en.toLowerCase().includes(queryLower)) ||
        p.party.toLowerCase().includes(queryLower) ||
        (p.district && p.district.toLowerCase().includes(queryLower))
    );
  },
};
