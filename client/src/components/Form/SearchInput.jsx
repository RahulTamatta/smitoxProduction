import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/search";
import "./SearchInput.css";

const DEBOUNCE_MS = 250;

const SearchInput = () => {
  const [values, setValues] = useSearch();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const suggestionRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target) &&
        inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Fetch autocomplete suggestions with debouncing
   */
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);

    try {
      const response = await axios.get('/api/search/autocomplete', {
        params: { q: query.trim(), limit: 8 },
        signal: abortRef.current.signal
      });

      setSuggestions(response.data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Autocomplete error:', err);
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle input change with debouncing
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);

    // Clear existing debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce the autocomplete request
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, DEBOUNCE_MS);
  };

  /**
   * Execute full search
   */
  const executeSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) return;

    try {
      const { data } = await axios.get('/api/search', {
        params: { q: searchTerm.trim(), limit: 50 }
      });

      setValues({
        ...values,
        keyword: searchTerm.trim(),
        results: data.results || []
      });

      setShowSuggestions(false);
      navigate("/search");
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to original search if ES is unavailable
      try {
        const { data } = await axios.get(`/api/v1/product/search/${searchTerm}`);
        setValues({ ...values, keyword: searchTerm, results: data });
        navigate("/search");
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
      }
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch(inputValue);
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.name);
    setShowSuggestions(false);

    // Navigate directly to product page
    if (suggestion.slug) {
      navigate(`/product/${suggestion.slug}`);
    } else {
      executeSearch(suggestion.name);
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  /**
   * Clear search input
   */
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            ref={inputRef}
            type="search"
            placeholder="Search for products, brands and more"
            aria-label="Search"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="search-input"
            autoComplete="off"
          />
          {inputValue && (
            <button
              type="button"
              className="search-clear"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
          <button type="submit" className="search-button" aria-label="Search">
            <FaSearch />
          </button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div ref={suggestionRef} className="search-suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion._id || index}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {suggestion.photos && (
                  <img
                    src={suggestion.photos.startsWith('http')
                      ? suggestion.photos
                      : `/${suggestion.photos}`
                    }
                    alt={suggestion.name}
                    className="suggestion-image"
                  />
                )}
                <div className="suggestion-content">
                  <span className="suggestion-name">{suggestion.name}</span>
                  {suggestion.brandName && (
                    <span className="suggestion-brand">{suggestion.brandName}</span>
                  )}
                  {suggestion.perPiecePrice && (
                    <span className="suggestion-price">₹{suggestion.perPiecePrice}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {loading && inputValue && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchInput;
