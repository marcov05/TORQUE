import { useCallback, useEffect, useState } from 'react';
import type { ListParams } from '../services/api';
import type { Page } from '../types/api';
import { getApiError } from '../services/http';

type Loader<T> = (params: ListParams) => Promise<Page<T>>;
const EMPTY_FILTERS: Omit<ListParams, 'page' | 'limit' | 'search'> = {};

export function usePaginatedData<T>(loader: Loader<T>, filters: Omit<ListParams, 'page' | 'limit' | 'search'> = EMPTY_FILTERS) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<Page<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setSearch(searchInput.trim()); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    void loader({ page, limit: 10, ...(search ? { search } : {}), ...filters })
      .then((data) => { if (active) setResult(data); })
      .catch((reason: unknown) => { if (active) setError(getApiError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loader, page, search, filters, reloadCount]);

  const refresh = useCallback(() => setReloadCount((count) => count + 1), []);
  const changeFilters = useCallback(() => setPage(1), []);
  return { page, setPage, searchInput, setSearchInput, result, loading, error, refresh, changeFilters };
}
