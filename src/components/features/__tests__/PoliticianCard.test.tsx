import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PoliticianCard } from '../PoliticianCard'
import type { Politician } from '@/types/database'

const mockPolitician: Politician = {
  id: 1,
  name: '김철수',
  party: '민주당',
  district: '서울 강남구',
  position: '국회의원',
  profile_image_url: 'https://example.com/image.jpg',
  avg_rating: 4.5,
  total_ratings: 150,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

describe('PoliticianCard', () => {
  it('should render politician information correctly', () => {
    render(<PoliticianCard politician={mockPolitician} />)

    expect(screen.getByText('김철수')).toBeInTheDocument()
    expect(screen.getByText('국회의원')).toBeInTheDocument()
    expect(screen.getByText('민주당')).toBeInTheDocument()
    expect(screen.getByText('서울 강남구')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('150개 평가')).toBeInTheDocument()
  })

  it('should render fallback for missing profile image', () => {
    const politicianWithoutImage = { ...mockPolitician, profile_image_url: null }
    render(<PoliticianCard politician={politicianWithoutImage} />)

    // Should display first character of name as fallback
    expect(screen.getByText('김')).toBeInTheDocument()
  })

  it('should render "평가 없음" when no ratings', () => {
    const politicianWithoutRatings = {
      ...mockPolitician,
      avg_rating: 0,
      total_ratings: 0,
    }
    render(<PoliticianCard politician={politicianWithoutRatings} />)

    expect(screen.getByText('0.0')).toBeInTheDocument()
    expect(screen.getByText('평가 없음')).toBeInTheDocument()
  })

  it('should handle click event', () => {
    const handleClick = jest.fn()
    render(<PoliticianCard politician={mockPolitician} onClick={handleClick} />)

    const card = screen.getByText('김철수').closest('.cursor-pointer')
    fireEvent.click(card!)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render correct number of stars based on rating', () => {
    const { container } = render(<PoliticianCard politician={mockPolitician} />)

    // Should render 5 star icons total (4.5 rating = 4 full + 1 half + 0 empty)
    const stars = container.querySelectorAll('svg')
    const starIcons = Array.from(stars).filter(
      (svg) => svg.getAttribute('class')?.includes('w-4 h-4')
    )

    expect(starIcons.length).toBeGreaterThanOrEqual(5)
  })

  it('should apply custom className', () => {
    const { container } = render(
      <PoliticianCard politician={mockPolitician} className="custom-class" />
    )

    expect(container.firstChild?.firstChild).toHaveClass('custom-class')
  })

  it('should display district only if provided', () => {
    const politicianWithoutDistrict = { ...mockPolitician, district: null }
    render(<PoliticianCard politician={politicianWithoutDistrict} />)

    expect(screen.queryByText('서울 강남구')).not.toBeInTheDocument()
  })

  it('should format large numbers correctly', () => {
    const politicianWithManyRatings = {
      ...mockPolitician,
      total_ratings: 123456,
    }
    render(<PoliticianCard politician={politicianWithManyRatings} />)

    expect(screen.getByText('123,456개 평가')).toBeInTheDocument()
  })

  it('should display rating with one decimal place', () => {
    const politicianWith3Point7Rating = {
      ...mockPolitician,
      avg_rating: 3.789,
    }
    render(<PoliticianCard politician={politicianWith3Point7Rating} />)

    expect(screen.getByText('3.8')).toBeInTheDocument()
  })

  it('should not be clickable when onClick is not provided', () => {
    const { container } = render(<PoliticianCard politician={mockPolitician} />)

    expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument()
  })
})
