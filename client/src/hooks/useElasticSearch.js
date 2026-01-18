/**
 * useElasticSearch Hook
 * 
 * Production-grade search hook with:
 * - 250ms debouncing (prevents excessive API calls)
 * - Request cancellation (AbortController for in-flight requests)
 * - Loading and error states
 * - Autocomplete suggestions
 * - Automatic cleanup on unmount
 */

import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 250;
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * Custom hook for Elasticsearch-powered product search
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 250)
 * @param {number} options.minQueryLength - Minimum query length to trigger search (default: 1)
 * @param {boolean} options.isAdmin - Use admin search endpoint (includes inactive products)
 * @returns {Object} Search state and handlers
 */
export const useElasticSearch = (options = {}) => {
    const {
        debounceMs = DEBOUNCE_MS,
        minQueryLength = 1,
        isAdmin = false
    } = options;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(0);
    const [responseTime, setResponseTime] = useState(null);

    // Refs for debouncing and cancellation
    const debounceTimerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    /**
     * Execute search with debouncing and cancellation
     */
    const executeSearch = useCallback(async (searchQuery, searchPage = 1, limit = 20) => {
        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Don't search if query is too short
        if (!searchQuery || searchQuery.trim().length < minQueryLength) {
            setResults([]);
            setSuggestions([]);
            setTotal(0);
            setPages(0);
            setLoading(false);
            return;
        }

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const endpoint = isAdmin ? '/api/search/admin' : '/api/search';
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
                params: {
                    q: searchQuery.trim(),
                    page: searchPage,
                    limit
                },
                signal: abortControllerRef.current.signal
            });

            // Only update state if component is still mounted
            if (mountedRef.current) {
                const data = response.data;
                setResults(data.results || []);
                setTotal(data.total || 0);
                setPages(data.pages || 0);
                setPage(data.page || 1);
                setResponseTime(data.responseTime || null);
                setLoading(false);
            }
        } catch (err) {
            // Ignore abort errors
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return;
            }

            if (mountedRef.current) {
                console.error('Search error:', err);
                setError(err.response?.data?.message || 'Search failed');
                setLoading(false);
            }
        }
    }, [isAdmin, minQueryLength]);

    /**
     * Fetch autocomplete suggestions (faster, lighter endpoint)
     */
    const fetchSuggestions = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < minQueryLength) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/api/search/autocomplete`, {
                params: {
                    q: searchQuery.trim(),
                    limit: 8
                }
            });

            if (mountedRef.current) {
                setSuggestions(response.data.suggestions || []);
            }
        } catch (err) {
            // Silently fail for autocomplete - not critical
            if (mountedRef.current) {
                setSuggestions([]);
            }
        }
    }, [minQueryLength]);

    /**
     * Handle query change with debouncing
     */
    const handleQueryChange = useCallback((newQuery) => {
        setQuery(newQuery);

        // Clear existing debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounce timer
        debounceTimerRef.current = setTimeout(() => {
            executeSearch(newQuery, 1);
            fetchSuggestions(newQuery);
        }, debounceMs);
    }, [executeSearch, fetchSuggestions, debounceMs]);

    /**
     * Handle page change (for pagination)
     */
    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= pages) {
            setPage(newPage);
            executeSearch(query, newPage);
        }
    }, [query, pages, executeSearch]);

    /**
     * Clear search state
     */
    const clearSearch = useCallback(() => {
        setQuery('');
        setResults([]);
        setSuggestions([]);
        setTotal(0);
        setPages(0);
        setPage(1);
        setError(null);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    }, []);

    /**
     * Immediate search (bypasses debounce)
     */
    const searchNow = useCallback((searchQuery) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setQuery(searchQuery);
        executeSearch(searchQuery, 1);
    }, [executeSearch]);

    return {
        // State
        query,
        results,
        suggestions,
        loading,
        error,
        total,
        page,
        pages,
        responseTime,

        // Handlers
        setQuery: handleQueryChange,
        setPage: handlePageChange,
        clearSearch,
        searchNow,

        // Raw setters (for controlled components)
        setQueryRaw: setQuery
    };
};

/**
 * Simplified hook for autocomplete-only use cases
 */
export const useAutocomplete = (options = {}) => {
    const { debounceMs = 250, minLength = 1 } = options;

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const debounceTimerRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const handleChange = useCallback((value) => {
        setQuery(value);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (abortControllerRef.current) abortControllerRef.current.abort();

        if (!value || value.length < minLength) {
            setSuggestions([]);
            return;
        }

        debounceTimerRef.current = setTimeout(async () => {
            abortControllerRef.current = new AbortController();
            setLoading(true);

            try {
                const res = await axios.get('/api/search/autocomplete', {
                    params: { q: value, limit: 8 },
                    signal: abortControllerRef.current.signal
                });
                setSuggestions(res.data.suggestions || []);
            } catch (err) {
                if (err.name !== 'AbortError') setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, debounceMs);
    }, [debounceMs, minLength]);

    const clear = () => {
        setQuery('');
        setSuggestions([]);
    };

    return { query, suggestions, loading, setQuery: handleChange, clear };
};

export default useElasticSearch;
