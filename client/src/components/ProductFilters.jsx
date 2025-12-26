import { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';

/**
 * ProductFilters Component
 * Provides filtering and sorting options for products
 * Mobile-responsive with drawer on small screens
 */
const ProductFilters = ({
    categories = [],
    onFilterChange,
    currentFilters = {},
    currentSort = '',
    onSortChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(currentFilters.category || '');
    const [priceRange, setPriceRange] = useState({
        min: currentFilters.minPrice || '',
        max: currentFilters.maxPrice || '',
    });

    const sortOptions = [
        { value: '', label: 'Default Sort' },
        { value: 'price_asc', label: 'Price: Low to High' },
        { value: 'price_desc', label: 'Price: High to Low' },
        { value: 'popular', label: 'Most Popular' },
        { value: 'newest', label: 'New Arrivals' },
    ];

    const handleApplyFilters = () => {
        const filters = {
            category: selectedCategory,
            minPrice: priceRange.min,
            maxPrice: priceRange.max,
        };
        onFilterChange(filters);
        setIsOpen(false);
    };

    const handleClearFilters = () => {
        setSelectedCategory('');
        setPriceRange({ min: '', max: '' });
        onFilterChange({});
        onSortChange('');
    };

    const hasActiveFilters = selectedCategory || priceRange.min || priceRange.max || currentSort;

    return (
        <div className="filters-container mb-4">
            {/* Control Bar - Desktop and Mobile (when closed) */}
            <div className="d-flex align-items-center justify-content-between p-2 p-md-3 bg-white shadow-sm rounded-3 border">
                <div className="d-flex align-items-center gap-2 overflow-auto hide-scrollbar" style={{ flex: 1, marginRight: '1rem' }}>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="filter-trigger-btn d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                        style={{
                            border: '1px solid #eee',
                            backgroundColor: hasActiveFilters ? '#FFF5F5' : '#fff',
                            color: '#D32F2F',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                            boxShadow: hasActiveFilters ? '0 2px 4px rgba(211,47,47,0.1)' : 'none'
                        }}
                    >
                        <FiFilter />
                        <span className="fw-bold">Filters</span>
                        {hasActiveFilters && <span className="active-dot"></span>}
                    </button>

                    {/* Category quick-select chips */}
                    <div className="d-none d-md-flex align-items-center gap-2 ml-3">
                        <span className="text-muted small me-1">Quick:</span>
                        {categories.slice(0, 5).map(cat => (
                            <button
                                key={cat._id}
                                onClick={() => {
                                    setSelectedCategory(cat.slug);
                                    onFilterChange({ ...currentFilters, category: cat.slug });
                                }}
                                className={`chip ${selectedCategory === cat.slug ? 'active' : ''}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sort-wrapper d-none d-md-block" style={{ width: '200px' }}>
                    <select
                        className="form-select border-0 bg-light rounded-pill px-3"
                        value={currentSort}
                        onChange={(e) => onSortChange(e.target.value)}
                        style={{ fontSize: '0.9rem' }}
                    >
                        {sortOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Filter Drawer / Modal */}
            {isOpen && (
                <div className="filter-drawer-overlay d-flex justify-content-end" onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
                    <div className="filter-drawer-content bg-white h-100 shadow-lg px-4 py-4 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="mb-0 fw-bold" style={{ color: '#1a1a1a' }}>Refine Products</h4>
                                <p className="text-muted small mb-0">Customize your view</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="btn-close-custom">
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="filter-sections flex-grow-1 overflow-auto pe-2">
                            {/* Sort - Mobile only inside drawer */}
                            <div className="filter-group d-md-none mb-4">
                                <label className="filter-label">Sort By</label>
                                <div className="d-grid gap-2">
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onSortChange(opt.value)}
                                            className={`sort-option-btn ${currentSort === opt.value ? 'active' : ''}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div className="filter-group mb-4">
                                <label className="filter-label">Category</label>
                                <select
                                    className="form-select custom-input"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="filter-group mb-4">
                                <label className="filter-label">Price Range (₹)</label>
                                <div className="d-flex align-items-center gap-2">
                                    <input
                                        type="number"
                                        className="form-control custom-input"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                    />
                                    <span className="text-muted">-</span>
                                    <input
                                        type="number"
                                        className="form-control custom-input"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="filter-actions d-flex gap-2 pt-4 border-top">
                            <button onClick={handleClearFilters} className="btn-outline-custom flex-grow-1">Clear All</button>
                            <button onClick={handleApplyFilters} className="btn-primary-custom flex-grow-1">Show Results</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .filter-trigger-btn:hover {
                    background-color: #f8f8f8;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .active-dot {
                    width: 8px;
                    height: 8px;
                    background-color: #D32F2F;
                    border-radius: 50%;
                    display: inline-block;
                }
                .chip {
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid #eee;
                    background: transparent;
                    color: #666;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                    cursor: pointer;
                    white-space: nowrap;
                }
                .chip:hover, .chip.active {
                    background-color: #1a1a1a;
                    color: #fff;
                    border-color: #1a1a1a;
                }
                .filter-drawer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    z-index: 2000;
                    animation: fadeIn 0.3s ease;
                }
                .filter-drawer-content {
                    width: 100%;
                    max-width: 400px;
                    animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .filter-label {
                    display: block;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #888;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                }
                .custom-input {
                    border: 1px solid #eee;
                    border-radius: 10px;
                    padding: 0.75rem;
                    background-color: #fcfcfc;
                    transition: all 0.2s;
                }
                .custom-input:focus {
                    border-color: #D32F2F;
                    box-shadow: 0 0 0 3px rgba(211,47,47,0.1);
                    background-color: #fff;
                }
                .sort-option-btn {
                    padding: 10px;
                    border: 1px solid #eee;
                    border-radius: 10px;
                    background: #fff;
                    text-align: left;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .sort-option-btn.active {
                    background-color: #D32F2F;
                    color: #fff;
                    border-color: #D32F2F;
                }
                .btn-primary-custom {
                    background: linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%);
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    padding: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-outline-custom {
                    background: #fff;
                    color: #333;
                    border: 1px solid #ddd;
                    border-radius: 12px;
                    padding: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-close-custom {
                    background: #f5f5f5;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-close-custom:hover {
                    background: #eee;
                    transform: scale(1.1);
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ProductFilters;
