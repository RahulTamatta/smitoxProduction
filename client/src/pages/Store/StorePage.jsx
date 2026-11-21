import axios from "axios";
import { BadgeCheck, Search, Store as StoreIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "../../styles/Homepage.css";
import ProductCard from "../ProductCard";
import "./StorePage.css";

const LIMIT = 24;

const SORT_OPTIONS = [
  { value: "", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

// Store assets are served as paths relative to the API host ("uploads/products/x.jpg").
const imageSrc = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/${path}`;
};

const memberYear = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
};

const StorePage = () => {
  const { storeSlug } = useParams();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sort, setSort] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const appliedSearch = useRef("");
  const currentSlug = useRef(storeSlug);

  // Adjust paging/filters during render when the route param changes.
  if (currentSlug.current !== storeSlug) {
    currentSlug.current = storeSlug;
    appliedSearch.current = "";
    setPage(1);
    setSearch("");
    setSearchInput("");
  }

  // Debounce the search box and jump back to the first page.
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchInput.trim();
      if (q === appliedSearch.current) return;
      appliedSearch.current = q;
      setSearch(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const fetchStore = async () => {
      setLoading(true);
      setError("");
      setNotFound(false);
      try {
        const { data } = await axios.get(`/api/v1/stores/${encodeURIComponent(storeSlug)}`, {
          params: { page, limit: LIMIT, search, ...(sort ? { sort } : {}) },
        });
        if (cancelled) return;
        setStore(data.store);
        setProducts(data.products || []);
        setPages(data.pages || 1);
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setStore(null);
          setNotFound(true);
        } else {
          setError(err?.response?.data?.message || "Could not load this store. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStore();
    return () => {
      cancelled = true;
    };
  }, [storeSlug, page, search, sort, reloadKey]);

  const title = store ? `${store.storeName} - Wholesale store on Smitox` : "Store - Smitox";
  const year = store ? memberYear(store.memberSince) : null;

  if (loading && !store && !notFound && !error) {
    return (
      <Layout title={title}>
        <div className="sx-container mt-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading store...</p>
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout title="Store not found - Smitox">
        <div className="sx-container">
          <div className="sx-store-state">
            <StoreIcon size={40} className="sx-store-state-icon" aria-hidden="true" />
            <h1 className="sx-store-state-title">Store not found</h1>
            <p className="sx-store-state-text">
              This seller store may have been removed, or the link is incorrect.
            </p>
            <Link to="/" className="sx-store-page-btn">
              Back to home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !store) {
    return (
      <Layout title={title}>
        <div className="sx-container">
          <div className="sx-store-state">
            <h1 className="sx-store-state-title">Something went wrong</h1>
            <p className="sx-store-state-text">{error}</p>
            <button
              type="button"
              className="sx-store-page-btn"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={title}
      description={store?.description?.substring(0, 160) || `${store?.storeName || "Seller"} wholesale store on Smitox.`}
    >
      <div className="sx-container sx-store-page">
        <div className="sx-store-header">
          {store.banner && (
            <img
              className="sx-store-banner"
              src={imageSrc(store.banner)}
              alt={`${store.storeName} banner`}
            />
          )}

          <div className="sx-store-head">
            {store.logo ? (
              <img
                className="sx-store-logo"
                src={imageSrc(store.logo)}
                alt={`${store.storeName} logo`}
              />
            ) : (
              <div className="sx-store-logo sx-store-logo--fallback" aria-hidden="true">
                {store.storeName?.charAt(0)?.toUpperCase() || "S"}
              </div>
            )}

            <div className="sx-store-headinfo">
              <div className="sx-store-title-row">
                <h1 className="sx-store-name">{store.storeName}</h1>
                {store.isVerified && (
                  <span className="sx-store-verified">
                    <BadgeCheck size={14} aria-hidden="true" />
                    Verified seller
                  </span>
                )}
              </div>

              <div className="sx-store-meta">
                {store.category && <span>{store.category}</span>}
                <span>{store.productCount} products</span>
                {year && <span>Selling on Smitox since {year}</span>}
              </div>

              {store.description && <p className="sx-store-desc">{store.description}</p>}
            </div>
          </div>

          <div className="sx-store-toolbar">
            <div className="sx-store-search">
              <Search size={16} className="sx-store-search-icon" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search in this store"
                aria-label="Search products in this store"
              />
            </div>

            <div className="sx-store-sort">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="sx-store-inline-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="sx-store-page-btn"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="sx-store-grid-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="sx-store-empty">No products found</div>
        ) : (
          <>
            <div className="sx-home-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {pages > 1 && (
              <div className="sx-store-pagination">
                <button
                  type="button"
                  className="sx-store-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <span className="sx-store-page-info">
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  className="sx-store-page-btn"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default StorePage;
