'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ tags, onChange, placeholder = 'Escribe y presiona Enter', maxTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      e.preventDefault();
      removeTag(tags.length - 1);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    if (tags.includes(trimmed)) {
      setInputValue('');
      return;
    }

    if (maxTags && tags.length >= maxTags) {
      return;
    }

    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 min-h-[42px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/20 px-2 py-1 text-sm text-white border border-[var(--accent)]/30"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 rounded-full hover:bg-[var(--accent)]/30 transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              aria-label={`Eliminar tag ${tag}`}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={inputValue === '' ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-white placeholder:text-[var(--text-secondary)] outline-none"
          disabled={maxTags ? tags.length >= maxTags : false}
        />
      </div>
      {maxTags && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {tags.length} / {maxTags} tags
        </p>
      )}
    </div>
  );
}
