# Pagination Component

A fully-featured, accessible pagination component for navigating through paginated data in the PoliticianFinder application.

## Features

- ✅ **Accessible** - Full ARIA support and keyboard navigation
- ✅ **Responsive** - Adapts to mobile and desktop screens
- ✅ **Flexible** - Multiple variants (full, compact, simple)
- ✅ **Type-safe** - Written in TypeScript with comprehensive types
- ✅ **Customizable** - Many configuration options
- ✅ **Edge cases** - Handles single page, first/last page states
- ✅ **Performance** - Efficient re-rendering with React best practices

## Installation

The component is already included in the project. Import it from:

```tsx
import { Pagination, PaginationCompact, PaginationSimple } from '@/components/Pagination'
```

## Basic Usage

### Full Pagination

```tsx
import { useState } from 'react'
import { Pagination } from '@/components/Pagination'

function PoliticiansPage() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div>
      {/* Your content here */}

      <Pagination
        currentPage={currentPage}
        totalPages={10}
        onPageChange={setCurrentPage}
        totalItems={150}
        itemsPerPage={15}
      />
    </div>
  )
}
```

### Compact Pagination (Mobile-friendly)

```tsx
import { PaginationCompact } from '@/components/Pagination'

function MobileList() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <PaginationCompact
      currentPage={currentPage}
      totalPages={20}
      onPageChange={setCurrentPage}
    />
  )
}
```

### Simple Pagination (Minimal UI)

```tsx
import { PaginationSimple } from '@/components/Pagination'

function MinimalList() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <PaginationSimple
      currentPage={currentPage}
      totalPages={15}
      onPageChange={setCurrentPage}
    />
  )
}
```

## API Reference

### Pagination Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | - | Current active page (1-indexed) **Required** |
| `totalPages` | `number` | - | Total number of pages **Required** |
| `onPageChange` | `(page: number) => void` | - | Callback when page changes **Required** |
| `totalItems` | `number` | `undefined` | Total number of items (for display) |
| `itemsPerPage` | `number` | `undefined` | Items per page (for display) |
| `maxVisible` | `number` | `5` | Maximum number of page buttons to show |
| `showFirstLast` | `boolean` | `true` | Show first/last page buttons |
| `showInfo` | `boolean` | `true` | Show item count information |
| `className` | `string` | `undefined` | Additional CSS classes |

### PaginationCompact Props

| Prop | Type | Description |
|------|------|-------------|
| `currentPage` | `number` | Current active page **Required** |
| `totalPages` | `number` | Total number of pages **Required** |
| `onPageChange` | `(page: number) => void` | Callback **Required** |
| `className` | `string` | Additional CSS classes |

### PaginationSimple Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | - | Current active page **Required** |
| `totalPages` | `number` | - | Total number of pages **Required** |
| `onPageChange` | `(page: number) => void` | - | Callback **Required** |
| `showPageInfo` | `boolean` | `true` | Show page number info |
| `className` | `string` | `undefined` | Additional CSS classes |

## Integration with API

### Example with React Query

```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pagination } from '@/components/Pagination'
import { getPoliticians } from '@/lib/api'

function PoliticiansList() {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['politicians', page, limit],
    queryFn: () => getPoliticians({ page, limit }),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      {/* Render politicians list */}
      <div className="grid gap-4">
        {data?.data.map((politician) => (
          <PoliticianCard key={politician.id} politician={politician} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={data?.pagination.totalPages ?? 1}
        onPageChange={setPage}
        totalItems={data?.pagination.total}
        itemsPerPage={limit}
      />
    </div>
  )
}
```

### Example with URL Search Params (Next.js)

```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Pagination } from '@/components/Pagination'

function PoliticiansPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get('page')) || 1
  const totalPages = 10 // Get from your API

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  )
}
```

## Accessibility Features

### ARIA Labels

The component includes proper ARIA labels for screen readers:

- `role="navigation"` on the main nav element
- `aria-label="Pagination Navigation"` for context
- `aria-label` on each button describing its action
- `aria-current="page"` on the active page button
- `aria-disabled` for disabled buttons

### Keyboard Navigation

- **Tab** - Navigate between buttons
- **Enter** or **Space** - Activate button
- Focus indicators are visible for keyboard users

### Screen Reader Support

- Announces current page and total pages
- Describes each navigation action
- Indicates disabled state of buttons

## Responsive Design

The pagination adapts to different screen sizes:

- **Mobile** - Hides first/last buttons, shows compact info
- **Desktop** - Shows all navigation options
- **Flexible** - Uses responsive Tailwind classes

## Edge Cases Handled

- ✅ Single page (component doesn't render)
- ✅ First page (prev/first buttons disabled)
- ✅ Last page (next/last buttons disabled)
- ✅ Large page counts (shows window of pages)
- ✅ Direct page input validation
- ✅ Boundary checks

## Styling

The component uses:
- **Tailwind CSS** for utility classes
- **shadcn/ui Button** component for consistent styling
- **lucide-react** icons (ChevronLeft, ChevronRight, etc.)
- **class-variance-authority** for variant management

### Customization

You can customize the appearance by:

1. **Passing className prop**:
```tsx
<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={setPage}
  className="my-custom-class bg-gray-100"
/>
```

2. **Modifying the Button component** variants in `@/components/ui/button.tsx`

3. **Using Tailwind's theme** configuration

## Integration with Pagination Utils

The component works seamlessly with the pagination utilities from `@/lib/pagination`:

```tsx
import { getPageNumbers, getPaginationMeta } from '@/lib/pagination'
import { Pagination } from '@/components/Pagination'

// The component uses getPageNumbers internally
// You can use other utils for your API calls

function MyComponent() {
  const meta = getPaginationMeta(currentPage, limit, total)

  return (
    <Pagination
      currentPage={meta.page}
      totalPages={meta.totalPages}
      onPageChange={handleChange}
    />
  )
}
```

## Performance Considerations

- ✅ Memoized calculations
- ✅ Efficient re-renders (only when props change)
- ✅ Lightweight dependencies
- ✅ No unnecessary DOM operations

## Testing

Example test cases to verify:

```tsx
// Test first page state
<Pagination currentPage={1} totalPages={10} onPageChange={fn} />
// Expect: prev/first buttons disabled

// Test last page state
<Pagination currentPage={10} totalPages={10} onPageChange={fn} />
// Expect: next/last buttons disabled

// Test middle page
<Pagination currentPage={5} totalPages={10} onPageChange={fn} />
// Expect: all buttons enabled

// Test single page
<Pagination currentPage={1} totalPages={1} onPageChange={fn} />
// Expect: component doesn't render

// Test page change callback
const handleChange = jest.fn()
<Pagination currentPage={5} totalPages={10} onPageChange={handleChange} />
// Click next button
// Expect: handleChange called with 6
```

## Examples

See `Pagination.stories.tsx` for comprehensive examples including:

- Full-featured pagination
- Without first/last buttons
- Without info display
- Compact variant
- Simple variant
- Large dataset handling
- Custom max visible pages

## Related Components

- `Button` - Used for navigation buttons
- Pagination utilities in `@/lib/pagination.ts`

## Troubleshooting

### Pagination not appearing

- Check if `totalPages > 1`
- Component auto-hides when there's only one page

### Page numbers not updating

- Ensure `currentPage` prop is being updated
- Check that `onPageChange` callback is working

### Styling issues

- Verify Tailwind CSS is properly configured
- Check that `@/components/ui/button` is available
- Ensure lucide-react icons are installed

## Future Enhancements

Potential improvements for future versions:

- [ ] Direct page number input
- [ ] Configurable page size selector
- [ ] Animated transitions between pages
- [ ] Infinite scroll integration option
- [ ] Virtual scrolling support
- [ ] Custom icon support

## License

Part of the PoliticianFinder project.
