import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useNavigate, useLocation } from 'react-router-dom';
import { Edit, Trash2, MessageCircle } from "lucide-react";

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize state from URL search params
  const urlParams = new URLSearchParams(location.search);
  const pageFromUrl = parseInt(urlParams.get('page')) || 1;

  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [itemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState(""); // Added state for bulk action

  // Listen to browser history changes (back/forward buttons)
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(location.search);
      const page = parseInt(params.get('page')) || 1;
      setCurrentPage(page);
    };

    // Initial check
    handleLocationChange();

    // Listen for location changes
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [location]);

  // Get all products
  const getAllProducts = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/v1/product/get-product?page=${page}&limit=${itemsPerPage}&search=${search}`
      );
      if (data.success) {
        setProducts(data.products);
        setTotalProducts(data.total);

        // Update URL with both page and search parameters
        const newUrl = `${window.location.pathname}?page=${page}&search=${search}`;
        window.history.replaceState({}, '', newUrl);
      }
    } catch (error) {
      console.log(error);
      //toast.error("Something Went Wrong");
    } finally {
      setLoading(false);
    }
  };

  // Update the search handler
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    getAllProducts(1, value); // Fetch results with search term
  };

  // Fetch products when page changes
  useEffect(() => {
    getAllProducts(currentPage);
  }, [currentPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);

      // Update URL with the new page number
      const newUrl = `${window.location.pathname}?page=${newPage}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  useEffect(() => {
    getAllProducts();
  }, []);

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    try {
      if (
        action === "delete" &&
        !window.confirm("Are you sure you want to delete selected products?")
      ) {
        return; // Prevent deletion if the user cancels
      }

      if (action === "delete") {
        await Promise.all(
          selectedProducts.map((id) =>
            axios.delete(`/api/v1/product/delete-product/${id}`)
          )
        );
        toast.success("Selected products deleted!");
        setProducts((prevProducts) =>
          prevProducts.filter(
            (product) => !selectedProducts.includes(product._id)
          )
        );
      } else {
        await Promise.all(
          selectedProducts.map((id) =>
            axios.put(`/api/v1/product/updateStatus/products/${id}`, {
              isActive: action === "activate" ? "1" : "0",
            })
          )
        );
        toast.success(`Selected products ${action}d!`);
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            selectedProducts.includes(product._id)
              ? { ...product, isActive: action === "activate" ? "1" : "0" }
              : product
          )
        );
      }
      setSelectedProducts([]);
    } catch (error) {
      console.log(error);
      toast.error(`Error performing bulk ${action}`);
    }
  };

  // Handle product selection
  const toggleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleIsActive = async (productId, newStatus) => {
    try {
      const response = await axios.put(
        `/api/v1/product/updateStatus/products/${productId}`,
        {
          isActive: newStatus,
        }
      );
      if (response.data.success) {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product._id === productId
              ? { ...product, isActive: newStatus }
              : product
          )
        );
        toast.success(
          `Product status updated to ${
            newStatus === "1" ? "Active" : "Inactive"
          }!`
        );
      } else {
        //toast.error("Failed to update product status.");
      }
    } catch (error) {
      console.error(error);
      //toast.error("An error occurred while updating product status.");
    }
  };

  // Filtered and searched products
  const filteredProducts = products.filter((product) => {
    if (filter === "outOfStock" && product.stock !== 0) return false;
    if (filter === "active" && product.isActive !== "1") return false;
    if (filter === "inactive" && product.isActive !== "0") return false;
    if (
      searchTerm &&
      !product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // Paginated products
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <Layout>
      <div className="flex" style={{ display: "flex", flexDirection: "row" }}>
        {/* Admin Menu in row with product list */}
        <div className="w-1/5" style={{ paddingRight: "20px" }}>
          <AdminMenu />
        </div>
        <div className="w-4/5 p-4" style={{ backgroundColor: "#f4f4f9" }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: "#4a4a4a" }}>
            Products List
          </h1>

          <div className="mb-4">
            <div className="flex space-x-4">
              {["all", "active", "inactive", "outOfStock"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 border ${
                    filter === tab ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                  style={{
                    color: filter === tab ? "white" : "#333",
                    borderRadius: "4px",
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center space-x-4">
            <input
              type="text"
              className="border px-3 py-2"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ borderRadius: "4px", width: "200px" }}
            />
            <span style={{ fontSize: "14px", color: "#666" }}>
              Showing {currentProducts.length} of {filteredProducts.length}{" "}
              products
            </span>
          </div>

          {/* Bulk Action Select */}
    

          <div className="mb-4">
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={selectedProducts.length === 0}
              className="px-4 py-2 border bg-red-500 text-white"
              style={{ backgroundColor: "#e53e3e", color: "white" }}
            >
              Delete Selected
            </button>
            <button
              onClick={() => handleBulkAction("activate")}
              disabled={selectedProducts.length === 0}
              className="px-4 py-2 border bg-green-500 text-white ml-2"
              style={{ backgroundColor: "#48bb78", color: "white" }}
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              disabled={selectedProducts.length === 0}
              className="px-4 py-2 border bg-yellow-500 text-white ml-2"
              style={{ backgroundColor: "#f6e05e", color: "black" }}
            >
              Deactivate Selected
            </button>
          </div>

          {/* Update the products display section */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr>
                  <th className="border p-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(products.map(p => p._id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                    />
                  </th>
                  <th className="border p-2">#</th>
                  <th className="border p-2">Photo</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Category</th>
                  <th className="border p-2">Subcategory</th>
                  <th className="border p-2">Price</th>
                  <th className="border p-2">Stock</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((p, index) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p._id)}
                          onChange={() => toggleSelectProduct(p._id)}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="border p-2 text-center">
                        <img
                          src={p.photos || "/placeholder-image.png"} // Fallback image if photos is undefined
                          alt={p.name}
                          className="border p-2"
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{p.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{p.category.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{p.subcategory.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{p.perPiecePrice}</td>
                      <td className="border border-gray-300 px-4 py-2">{p.stock}</td>
                      <td className="border p-2">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => toggleIsActive(p._id, p.isActive === "1" ? "0" : "1")}
                            className={`${
                              p.isActive === "1"
                                ? "text-yellow-500 hover:text-yellow-700"
                                : "text-green-500 hover:text-green-700"
                            }`}
                          >
                            {p.isActive === "1" ? "Active" : "Deactivate"}
                          </button>
                          <Link
                            to={`/dashboard/admin/product/${p.slug}`}
                            aria-label={`Edit product ${p.name}`}
                          >
                            <Edit className="text-green-500 hover:text-green-700" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Update the pagination controls */}
          <div className="flex justify-between items-center mt-4">
            <div>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border bg-gray-300 ml-2"
              >
                Next
              </button>
            </div>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;

