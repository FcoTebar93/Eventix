'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState, useEffect } from 'react';

export interface EventSearchFilters {
  search: string;
  category: string;
  city: string;
  tags: string;
}

const DEFAULT_FILTERS: EventSearchFilters = {
  search: '',
  category: '',
  city: '',
  tags: '',
};

interface EventSearchProps {
  filters: EventSearchFilters;
  onFiltersChange: (f: EventSearchFilters) => void;
  onSearch: (applied: EventSearchFilters) => void;
  onClear?: () => void;
}

const CATEGORIES = ['Música', 'Deportes', 'Teatro', 'Conferencia'];

export function EventSearch({ filters, onFiltersChange, onSearch, onClear }: EventSearchProps) {
  const t = useTranslations('home.search');
  const [local, setLocal] = useState<EventSearchFilters>(filters);
  useEffect(() => setLocal(filters), [filters]);

  const update = useCallback(
    (field: keyof EventSearchFilters, value: string) => {
      const next = { ...local, [field]: value };
      setLocal(next);
      onFiltersChange(next);
    },
    [local, onFiltersChange]
  );

  const handleSearch = useCallback(() => onSearch(local), [local, onSearch]);

  const handleClear = useCallback(() => {
    setLocal(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
    onClear?.();
  }, [onFiltersChange, onClear]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
            {t('name')}
          </label>
          <input
            type="text"
            value={local.search}
            onChange={(e) => update('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('namePlaceholder')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
            {t('category')}
          </label>
          <select
            value={local.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">{t('allCategories')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
            {t('city')}
          </label>
          <input
            type="text"
            value={local.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder={t('cityPlaceholder')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1 lg:flex-col">
          <button
            type="button"
            onClick={handleSearch}
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            {t('search')}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            {t('clear')}
          </button>
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
          {t('tags')}
        </label>
        <input
          type="text"
          value={local.tags}
          onChange={(e) => update('tags', e.target.value)}
          placeholder={t('tagsPlaceholder')}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
    </div>
  );
}