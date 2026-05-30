interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="pagination" className="dm-pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Назад
      </button>
      <div className="dm-pagination__pages">
        {pages.map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`}>...</span>
          ) : (
            <button
              key={page}
              className={currentPage === page ? 'is-active' : ''}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}
      </div>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Далі
      </button>
    </nav>
  );
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  if (rangeStart > 2) pages.push('...');
  for (let i = rangeStart; i <= rangeEnd; i += 1) pages.push(i);
  if (rangeEnd < total - 1) pages.push('...');
  pages.push(total);

  return pages;
}
