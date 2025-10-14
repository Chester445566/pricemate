import React, { useState, useRef, useEffect, useMemo } from 'react';

interface SearchOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  id?: string;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, label, id, placeholder }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    return options.find(opt => opt.value === value)?.label || '';
  }, [value, options]);

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  const filteredOptions = useMemo(() => {
    if (!query || query === selectedLabel) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, options, selectedLabel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(selectedLabel); // Reset query if nothing was selected
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedLabel]);

  const handleSelect = (option: SearchOption) => {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
  };
  
  const commonClasses = "w-full h-12 px-3 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900";

  return (
    <div className="w-full relative" ref={containerRef}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={commonClasses}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
      />
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                className="px-4 py-2 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-slate-500">لا توجد نتائج</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;