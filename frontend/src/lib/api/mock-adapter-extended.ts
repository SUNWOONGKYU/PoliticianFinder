/**
 * Mock Data Adapter - Extended version with filtering support
 */

import { mockAdapterApi as baseMockApi } from './mock-adapter';
import type { PoliticianRanking } from './home';

// Type definitions
interface SearchFilterParams {
  searchName?: string;
  searchParty?: string;
  searchRegion?: string;
  parties?: string[];
  regions?: string[];
  positions?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get politicians with filtering, sorting, and pagination
 */
export function getPoliticiansWithFiltering(
  filters: SearchFilterParams,
  page: number = 1,
  itemsPerPage: number = 12
): { data: PoliticianRanking[]; total: number } {
  const politicians = baseMockApi.getAIRanking({ limit: 100 }) || [];
  let result = [...politicians];

  // Apply search filters
  if (filters.searchName) {
    result = result.filter((p) =>
      p.name.toLowerCase().includes(filters.searchName!.toLowerCase())
    );
  }

  if (filters.searchParty) {
    result = result.filter((p) =>
      p.party.toLowerCase().includes(filters.searchParty!.toLowerCase())
    );
  }

  if (filters.searchRegion) {
    result = result.filter((p) =>
      p.region.toLowerCase().includes(filters.searchRegion!.toLowerCase())
    );
  }

  // Apply array filters
  if (filters.parties && filters.parties.length > 0) {
    result = result.filter((p) => filters.parties!.includes(p.party));
  }

  if (filters.regions && filters.regions.length > 0) {
    result = result.filter((p) => filters.regions!.includes(p.region));
  }

  if (filters.positions && filters.positions.length > 0) {
    result = result.filter((p) => filters.positions!.includes(p.position));
  }

  // Apply sorting
  if (filters.sortBy) {
    if (filters.sortBy === 'name') {
      result.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.name.localeCompare(a.name, 'ko-KR')
          : a.name.localeCompare(b.name, 'ko-KR')
      );
    } else if (filters.sortBy === 'rating') {
      result.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? (b.member_rating || 0) - (a.member_rating || 0)
          : (a.member_rating || 0) - (b.member_rating || 0)
      );
    } else if (filters.sortBy === 'popularity') {
      result.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? (b.member_rating_count || 0) - (a.member_rating_count || 0)
          : (a.member_rating_count || 0) - (b.member_rating_count || 0)
      );
    } else if (filters.sortBy === 'recent') {
      // For demo purposes, assume higher ID = more recent
      result.sort((a, b) =>
        filters.sortOrder === 'desc' ? b.id - a.id : a.id - b.id
      );
    }
  }

  // Apply pagination
  const total = result.length;
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage;
  const data = result.slice(from, to);

  return { data, total };
}

/**
 * Get single politician by ID
 */
export function getPoliticianById(id: number): PoliticianRanking | undefined {
  const politicians = baseMockApi.getAIRanking({ limit: 100 }) || [];
  return politicians.find((p) => p.id === id);
}

// Re-export base mock adapter
export { mockAdapterApi } from './mock-adapter';
