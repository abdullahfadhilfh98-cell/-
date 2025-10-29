import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Supplier } from '../../types';

interface SearchableSupplierInputProps {
  suppliers: Supplier[];
  value: string;
  onChange: (supplierId: string) => void;
  placeholder?: string;
  required?: boolean;
}

const SearchableSupplierInput: React.FC<SearchableSupplierInputProps> = ({ suppliers, value, onChange, placeholder = "ابحث عن مورد...", required }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedSupplier = useMemo(() => suppliers.find(s => s.id === value), [suppliers, value]);

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(lowercasedTerm)
    );
  }, [suppliers, searchTerm]);

  useEffect(() => {
    if (selectedSupplier) {
      setSearchTerm(selectedSupplier.name);
    } else {
      setSearchTerm('');
    }
  }, [selectedSupplier, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        if (selectedSupplier) {
            setSearchTerm(selectedSupplier.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef, dropdownRef, selectedSupplier]);
  
  useEffect(() => {
    const calculatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'absolute',
          top: `${rect.bottom + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
        });
      }
    };

    if (isOpen) {
      calculatePosition();
      document.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      document.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen]);

  const handleSelect = (supplier: Supplier) => {
    onChange(supplier.id);
    setSearchTerm(supplier.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
    if (e.target.value === '') {
        onChange('');
    }
  };

  const dropdownContent = isOpen ? (
    <div ref={dropdownRef} style={dropdownStyle} className="absolute z-[100] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {filteredSuppliers.length > 0 ? (
        filteredSuppliers.map(s => (
            <div
            key={s.id}
            onClick={() => handleSelect(s)}
            className="cursor-pointer hover:bg-teal-50 p-2 border-b"
            >
            {s.name}
            </div>
        ))
        ) : (
        <div className="p-2 text-gray-500">لا توجد نتائج</div>
        )}
    </div>
  ) : null;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        required={required && !value}
        autoComplete="off"
      />
      {dropdownContent && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default SearchableSupplierInput;