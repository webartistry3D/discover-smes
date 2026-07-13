import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

export type ViewMode = 'list' | 'grid';

interface RecordListViewProps<T> {
  items: T[];
  isLoading?: boolean;
  pageSize?: number;
  keyExtractor: (item: T) => string;
  renderItem: (item: T, viewMode: ViewMode) => React.ReactNode;
  listHeader?: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

export function RecordListView<T>({
  items,
  isLoading,
  pageSize = 10,
  keyExtractor,
  renderItem,
  listHeader,
  emptyState,
  className,
}: RecordListViewProps<T>) {
  const { isDarkMode } = useUIStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={clsx('h-20 rounded-xl animate-pulse', isDarkMode ? 'bg-gray-700' : 'bg-gray-200/60')}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const maxVisible = 10;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list'
                ? 'bg-festac-green text-white'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            aria-label="List view"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-festac-green text-white'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
        <div className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
          Page {page} of {totalPages}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left border-collapse">
            {listHeader && (
              <thead className={clsx('text-xs uppercase', isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}>
                {listHeader}
              </thead>
            )}
            <tbody className={clsx('text-sm', isDarkMode ? 'divide-gray-700' : 'divide-gray-200')}>
              {paginatedItems.map((item) => (
                <tr key={keyExtractor(item)} className={clsx('border-b last:border-b-0', isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50')}>
                  {renderItem(item, viewMode)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map((item) => (
            <div key={keyExtractor(item)} className="contents">
              {renderItem(item, viewMode)}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={clsx(
              'p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={clsx(
                'min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                page === pageNumber
                  ? 'bg-festac-green text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={clsx(
              'p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
