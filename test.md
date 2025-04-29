import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "../components/OptimizedImage";

export function useProductsForYou(product) {
  const [productsForYou, setProductsForYou] = useState([]);
  useEffect(() => {
    const getProductsForYou = async () => {
      if (product.category?._id && product.subcategory?._id) {
        try {
          const { data } = await axios.get(
            `/api/v1/productForYou/products/${product.category._id}/${product.subcategory._id}`
          );
          if (data?.success) {
            setProductsForYou(data.products || []);
          }
        } catch (error) {
          // Handle error if needed
        }
      }
    };
    getProductsForYou();
  }, [product.category, product.subcategory]);
  return productsForYou;
}

// Example usage in a component:
/*
const productsForYou = useProductsForYou(product);

return (
  <div>
    {productsForYou.map((item) => (
      <div key={item.productId?._id}>
        <OptimizedImage
          src={item.productId.photos}
          alt={item.productId.name}
        />
        <div>{item.productId.name}</div>
        <div>₹{item.productId.perPiecePrice}</div>
      </div>
    ))}
  </div>
);
*/
