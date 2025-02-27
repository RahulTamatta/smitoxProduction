// import React, { useState } from 'react';
// import moment from 'moment';

// const OrderDetailsModal = ({ selectedOrder, onUpdateOrder, onClose }) => {
//   const [order, setOrder] = useState(selectedOrder);

//   const calculateSubtotal = () => {
//     return order.products.reduce(
//       (total, product) => total + (product.price * product.quantity),
//       0
//     );
//   };

//   const calculateGST = () => {
//     return order.products.reduce(
//       (total, product) => 
//         total + (product.price * product.quantity * (product.gst || 0) / 100),
//       0
//     );
//   };

//   const calculateTotal = () => {
//     const deliveryCharges = order.deliveryCharges || 0.0;
//     const codCharges = order.codCharges || 0.0;
//     const discount = order.discount || 0.0;

//     return calculateSubtotal() + 
//            calculateGST() + 
//            deliveryCharges + 
//            codCharges - 
//            discount;
//   };

//   const updateProductQuantity = (index, quantity) => {
//     const updatedProducts = [...order.products];
//     updatedProducts[index].quantity = quantity;
//     setOrder({ ...order, products: updatedProducts });
//   };

//   const updateProductPrice = (index, price) => {
//     const updatedProducts = [...order.products];
//     updatedProducts[index].price = price;
//     setOrder({ ...order, products: updatedProducts });
//   };

//   const updateOrderStatus = (newStatus) => {
//     setOrder({ ...order, status: newStatus });
//   };

//   const handleSave = () => {
//     onUpdateOrder(order);
//     onClose();
//   };

//   const renderStatusButtons = () => {
//     switch (order.status) {
//       case 'Pending':
//         return (
//           <div className="status-buttons">
//             <button 
//               className="btn btn-primary me-2"
//               onClick={() => updateOrderStatus('Confirmed')}
//             >
//               Confirm
//             </button>
//             <button 
//               className="btn btn-danger"
//               onClick={() => updateOrderStatus('Cancelled')}
//             >
//               Cancel
//             </button>
//           </div>
//         );
//       case 'Confirmed':
//         return (
//           <button 
//             className="btn btn-success"
//             onClick={() => updateOrderStatus('Accepted')}
//           >
//             Accept
//           </button>
//         );
//       case 'Dispatched':
//         return (
//           <div className="status-buttons">
//             <button 
//               className="btn btn-primary me-2"
//               onClick={() => updateOrderStatus('Delivered')}
//             >
//               Delivered
//             </button>
//             <button 
//               className="btn btn-warning"
//               onClick={() => updateOrderStatus('Returned')}
//             >
//               RTO
//             </button>
//           </div>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="modal" tabIndex="-1" style={{ display: 'block' }}>
//       <div className="modal-dialog modal-lg">
//         <div className="modal-content">
//           <div className="modal-header">
//             <h5 className="modal-title">Order Details</h5>
//             <button 
//               type="button" 
//               className="btn-close" 
//               onClick={onClose}
//             ></button>
//           </div>
//           <div className="modal-body">
//             <div className="row mb-3">
//               <div className="col-md-6">
//                 <p>Order ID: {order.id}</p>
//                 <p>Buyer: {order.buyerName}</p>
//                 <p>Created At: {moment(order.createdAt).format('ll')}</p>
//               </div>
//             </div>

//             <table className="table table-bordered">
//               <thead>
//                 <tr>
//                   <th>Product</th>
//                   <th>Qty</th>
//                   <th>Price</th>
//                   <th>Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {order.products.map((product, index) => (
//                   <tr key={product.id}>
//                     <td>
//                       <div className="d-flex align-items-center">
//                         <img 
//                           src={`https://smitoxmain.onrender.com/api/v1/product/product-photo/${product.id}`} 
//                           alt={product.name}
//                           style={{ 
//                             width: '40px', 
//                             height: '40px', 
//                             objectFit: 'cover',
//                             marginRight: '10px'
//                           }}
//                           onError={(e) => {
//                             e.target.onerror = null;
//                             e.target.src = '/path/to/default-image.jpg';
//                           }}
//                         />
//                         {product.name}
//                       </div>
//                     </td>
//                     <td>
//                       <input 
//                         type="number" 
//                         className="form-control"
//                         value={product.quantity}
//                         onChange={(e) => {
//                           const quantity = parseInt(e.target.value);
//                           if (!isNaN(quantity)) {
//                             updateProductQuantity(index, quantity);
//                           }
//                         }}
//                       />
//                     </td>
//                     <td>
//                       <input 
//                         type="number" 
//                         className="form-control"
//                         value={product.price}
//                         onChange={(e) => {
//                           const price = parseFloat(e.target.value);
//                           if (!isNaN(price)) {
//                             updateProductPrice(index, price);
//                           }
//                         }}
//                       />
//                     </td>
//                     <td>₹{(product.price * product.quantity).toFixed(2)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             <table className="table table-bordered">
//               <tbody>
//                 <tr>
//                   <td>Subtotal</td>
//                   <td>₹{calculateSubtotal().toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>GST</td>
//                   <td>₹{calculateGST().toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>Delivery Charges</td>
//                   <td>₹{(order.deliveryCharges || 0).toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>COD Charges</td>
//                   <td>₹{(order.codCharges || 0).toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>Discount</td>
//                   <td>₹{(order.discount || 0).toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>Amount Paid</td>
//                   <td>₹{order.amount.toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>Amount Pending</td>
//                   <td>₹{order.calculateAmountPending().toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td><strong>Total</strong></td>
//                   <td><strong>₹{calculateTotal().toFixed(2)}</strong></td>
//                 </tr>
//               </tbody>
//             </table>

//             <div className="mt-3">
//               {renderStatusButtons()}
//             </div>
//           </div>
//           <div className="modal-footer">
//             <button 
//               type="button" 
//               className="btn btn-secondary" 
//               onClick={onClose}
//             >
//               Close
//             </button>
//             <button 
//               type="button" 
//               className="btn btn-primary" 
//               onClick={handleSave}
//             >
//               Save Changes
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

