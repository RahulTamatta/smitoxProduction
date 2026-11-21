import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../pages/Store/StorePage.css";

// Store assets are served as paths relative to the API host ("uploads/products/x.jpg").
const imageSrc = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/${path}`;
};

const ShopBySellers = ({ title = "Shop by seller", limit = 12 }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStores = async () => {
      try {
        const { data } = await axios.get("/api/v1/stores", { params: { limit } });
        if (!cancelled) setStores(data?.stores || []);
      } catch (err) {
        // The home page simply stays as-is when stores cannot be loaded.
        if (!cancelled) setStores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStores();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading || stores.length === 0) return null;

  return (
    <section className="sx-container sx-section">
      <h2 className="sx-section-title">{title}</h2>

      <div className="sx-sellers-rail">
        {stores.map((store) => (
          <Link
            key={store.storeSlug}
            to={`/seller/${store.storeSlug}`}
            className="sx-seller-card"
          >
            <div className="sx-seller-card-top">
              {store.logo ? (
                <img
                  className="sx-seller-logo"
                  src={imageSrc(store.logo)}
                  alt={`${store.storeName} logo`}
                  loading="lazy"
                />
              ) : (
                <span className="sx-seller-logo sx-seller-logo--fallback" aria-hidden="true">
                  {store.storeName?.charAt(0)?.toUpperCase() || "S"}
                </span>
              )}

              <div className="sx-seller-card-text">
                <span className="sx-seller-name">{store.storeName}</span>
                {store.category && <span className="sx-seller-cat">{store.category}</span>}
              </div>
            </div>

            {store.previewPhotos?.length > 0 && (
              <div className="sx-seller-photos">
                {store.previewPhotos.slice(0, 3).map((photo, index) => (
                  <img
                    key={`${photo}-${index}`}
                    className="sx-seller-photo"
                    src={imageSrc(photo)}
                    alt=""
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            <span className="sx-seller-count">{store.productCount} products</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ShopBySellers;
