import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../Pagination'

describe('Pagination Component', () => {
  const mockOnPageChange = jest.fn()

  beforeEach(() => {
    mockOnPageChange.mockClear()
  })

  it('should render pagination correctly', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('- 10')).toBeInTheDocument()
    expect(screen.getByText('/ 50 결과')).toBeInTheDocument()
  })

  it('should not render when totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalItems={10}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should disable first and previous buttons on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getByLabelText('이전 페이지')
    expect(prevButton).toBeDisabled()
  })

  it('should disable next and last buttons on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByLabelText('다음 페이지')
    expect(nextButton).toBeDisabled()
  })

  it('should call onPageChange when clicking page number', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const page3Button = screen.getByText('3')
    fireEvent.click(page3Button)

    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('should call onPageChange when clicking next button', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByLabelText('다음 페이지')
    fireEvent.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('should call onPageChange when clicking previous button', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getByLabelText('이전 페이지')
    fireEvent.click(prevButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('should show ellipsis for many pages', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={20}
        totalItems={200}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
        maxPageButtons={5}
      />
    )

    const ellipsisElements = screen.getAllByText('...')
    expect(ellipsisElements.length).toBeGreaterThan(0)
  })

  it('should display correct item range', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('- 20')).toBeInTheDocument()
  })

  it('should handle last page with partial items correctly', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        totalItems={25}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('21')).toBeInTheDocument()
    expect(screen.getByText('- 25')).toBeInTheDocument()
  })

  it('should not call onPageChange when clicking current page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const currentPageButton = screen.getByText('3')
    fireEvent.click(currentPageButton)

    expect(mockOnPageChange).not.toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
        className="custom-pagination"
      />
    )

    expect(container.firstChild).toHaveClass('custom-pagination')
  })

  it('should hide page numbers when showPageNumbers is false', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
        showPageNumbers={false}
      />
    )

    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })

  it('should navigate to first page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const firstButton = screen.getByLabelText('첫 페이지')
    fireEvent.click(firstButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(1)
  })

  it('should navigate to last page', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const lastButton = screen.getByLabelText('마지막 페이지')
    fireEvent.click(lastButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(5)
  })
})
