import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Product } from '../../types';

interface SearchableProductInputProps {
  products: Product[];
  value: string | undefined;
  onChange: (productId: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
}

const SearchableProductInput: React.FC<SearchableProductInputProps> = ({ products, value, onChange, placeholder = "ابحث أو اختر مادة...", autoFocus, required }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedProduct = useMemo(() => products.find(p => p.id === value), [products, value]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowercasedTerm = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(lowercasedTerm) ||
      p.id.toLowerCase().includes(lowercasedTerm)
    );
  }, [products, searchTerm]);

  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(selectedProduct.name);
    } else {
      setSearchTerm('');
    }
  }, [selectedProduct, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        if (selectedProduct) {
            setSearchTerm(selectedProduct.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef, dropdownRef, selectedProduct]);
  
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

  const handleSelect = (product: Product) => {
    onChange(product.id);
    setSearchTerm(product.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (!isOpen) {
      setIsOpen(true);
    }
    if (newSearchTerm === '') {
        onChange('');
    }
  };

  const dropdownContent = isOpen ? (
     <div ref={dropdownRef} style={dropdownStyle} className="absolute z-[100] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {filteredProducts.length > 0 ? (
        filteredProducts.map(p => (
            <div
            key={p.id}
            onClick={() => handleSelect(p)}
            className="cursor-pointer hover:bg-teal-50 p-2 border-b"
            >
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-gray-500">
                الكود: {p.id.slice(-6)} | المتاح: {p.stock}
            </p>
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
        className="w-full border-gray-200 rounded p-1.5"
        autoFocus={autoFocus}
        required={required && !value}
        autoComplete="off"
      />
      {dropdownContent && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default SearchableProductInput;