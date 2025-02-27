import React from "react";
import Layout from "./../components/Layout/Layout";
import { useSearch } from "../context/search";
import { useParams, useNavigate } from "react-router-dom";
const Search = () => {
  const [values, setValues] = useSearch();
  const navigate = useNavigate();
  return (
    <Layout title={"Search results"}>
      <div className="container pt-5">
        <div className="text-center py-5">
          <h1>Search Results</h1>
          <h6>
            {(Array.isArray(values?.results) && values?.results.length < 1)
              ? "No Products Found"
              : `Found ${values?.results?.length || 0}`}
          </h6>
          <div className="row g-4 mt-4">
            {Array.isArray(values?.results) &&
              values?.results
                .filter((p) => p.stock > 0) // Filter out products with zero stock
                .map((p) => (
                  <div className="col-lg-3 col-md-4 col-sm-6 mb-3" key={p._id}>
                    <div
                      className="card product-card h-100"
                      style={{ cursor: "pointer", position: "relative" }}
                      onClick={() => navigate(`/product/${p.slug}`)} // Navigates to product page
                    >
                      <img
                        src={p.photos}
                        className="card-img-top product-image img-fluid"
                        alt={p.name}
                        style={{ height: "200px", objectFit: "contain" }}
                      />
                      <div className="p-4 flex flex-col h-full">
                        <h5
                          className="text-sm font-semibold text-gray-900 dark:text-white mb-2"
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "200px",
                            display: "inline-block",
                          }}
                        >
                          {p.name}
                        </h5>
                        <div className="mt-auto">
                          <h5 className="text-base font-bold text-gray-900 dark:text-white">
                            {p.perPiecePrice?.toLocaleString("en-US", {
                              style: "currency",
                              currency: "INR",
                            }) || "Price not available"}
                          </h5>
                          {p.mrp && (
                            <h6
                              className="text-xs text-red-500"
                              style={{ textDecoration: "line-through" }}
                            >
                              {p.mrp.toLocaleString("en-US", {
                                style: "currency",
                                currency: "INR",
                              })}
                            </h6>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
          {/* If no products are available after filtering, show a message */}
          {Array.isArray(values?.results) && values?.results.filter((p) => p.stock > 0).length === 0 && (
            <div className="text-center mt-4">
              <h5>No products available in stock.</h5>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
  
};


export default Search;
