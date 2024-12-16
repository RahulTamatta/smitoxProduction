import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import { Edit, Trash2, MessageCircle } from 'lucide-react';


const Products = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Get all products
  const getAllProducts = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/get-product");
      setProducts(data.products);
    } catch (error) {
      console.log(error);
      toast.error("Something Went Wrong");
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    try {
      if (action === "delete" && !window.confirm("Are you sure you want to delete selected products?")) {
        return; // Prevent deletion if the user cancels
      }

      if (action === "delete") {
        await Promise.all(
          selectedProducts.map((id) => axios.delete(`/api/v1/product/delete-product/${id}`))
        );
        toast.success("Selected products deleted!");
        setProducts((prevProducts) =>
          prevProducts.filter((product) => !selectedProducts.includes(product._id))
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
      const response = await axios.put(`/api/v1/product/updateStatus/products/${productId}`, {
        isActive: newStatus,
      });
      if (response.data.success) {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product._id === productId ? { ...product, isActive: newStatus } : product
          )
        );
        toast.success(`Product status updated to ${newStatus === "1" ? "Active" : "Inactive"}!`);
      } else {
        toast.error("Failed to update product status.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating product status.");
    }
  };

  // Filtered and searched products
  const filteredProducts = products.filter((product) => {
    if (filter === "outOfStock" && product.stock !== 0) return false;
    if (filter === "active" && product.isActive !== "1") return false;
    if (filter === "inactive" && product.isActive !== "0") return false;
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Paginated products
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <Layout>
      <div className="flex" style={{ display: 'flex', flexDirection: 'row' }}>
        {/* Admin Menu in row with product list */}
        <div className="w-1/5" style={{ paddingRight: '20px' }}>
          <AdminMenu />
        </div>
        <div className="w-4/5 p-4" style={{ backgroundColor: '#f4f4f9' }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#4a4a4a' }}>Products List</h1>

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
                    color: filter === tab ? 'white' : '#333',
                    borderRadius: '4px',
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
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: '4px', width: '200px' }}
            />
            <span style={{ fontSize: '14px', color: '#666' }}>
              Showing {currentProducts.length} of {filteredProducts.length} products
            </span>
          </div>

          <div className="mb-4">
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={selectedProducts.length === 0}
              className="px-4 py-2 border bg-red-500 text-white"
              style={{ backgroundColor: '#e53e3e', color: 'white' }}
            >
              Delete Selected
            </button>
            <button
              onClick={() => handleBulkAction("activate")}
              disabled={selectedProducts.length === 0}
              className="px-4 py-2 border bg-green-500 text-white ml-2"
              style={{ backgroundColor: '#48bb78', color: 'white' }}
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              disabled={selectedProducts.length === 0}
              className="px-4 py-2 border bg-yellow-500 text-white ml-2"
              style={{ backgroundColor: '#f6e05e', color: 'black' }}
            >
              Deactivate Selected
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelectedProducts(
                          e.target.checked ? currentProducts.map((p) => p._id) : []
                        )
                      }
                      checked={
                        selectedProducts.length > 0 &&
                        currentProducts.every((p) => selectedProducts.includes(p._id))
                      }
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
                {currentProducts.map((p, index) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(p._id)}
                        onChange={() => toggleSelectProduct(p._id)}
                      />
                    </td>
                    <td className="border p-2 text-center">{indexOfFirstItem + index + 1}</td>

                    <td className="border p-2 text-center">
                    <img
  src={`/api/v1/product/product-photo/${p._id}`}
  alt={p.name}
  className="border p-2"
  style={{
    width: "50px", // Set a fixed width
    height: "50px", // Set a fixed height
    objectFit: "cover", // Ensure the image maintains aspect ratio and fits within the box
    borderRadius: "4px", // Add rounded corners if desired
  }}
/>

          </td>
                    <td className="border p-2">{p.name}</td>
          

                    <td className="border p-2">{p.category?.name || "N/A"}</td>
                    <td className="border p-2">{p.subcategory?.name || "N/A"}</td>
                    <td className="border p-2">₹{p.perPiecePrice?.toFixed(2)}</td>
                    <td className="border p-2">{p.stock || 0}</td>
                    <td className="border p-2">
                      <div className="flex justify-center space-x-2">
                      {p.isActive === "1" ? (
                          <button
                            onClick={() => toggleIsActive(p._id, "0")}
                            className="text-yellow-500 hover:text-yellow-700"
                          >
                            Active
                          </button>
                        ) : (
                          <button
                            onClick={() =>toggleIsActive(p._id, "1")}
                            className="text-green-500 hover:text-green-700"
                          >
                            Deactivate
                          </button>
                        )}

                        <Link to={`/dashboard/admin/product/${p.slug}`}>
                          <Edit className="text-green-500 hover:text-green-700" />
                        </Link>
                        {/* <button onClick={() => handleBulkAction("delete")}>
                          <Trash2 className="text-red-500 hover:text-red-700" />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border bg-gray-300"
              >
                Prev
              </button>
              <span className="px-4 py-2">{`Page ${currentPage} of ${totalPages}`}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
