import React from "react";
import moment from "moment";

const OrderHeader = ({ selectedOrder }) => {
  if (!selectedOrder) return null;

  return (
    <div>
      <h2>Order ID: {selectedOrder._id}</h2>
      <p>
        Name: {selectedOrder.buyer?.user_fullname}{" "}
        {selectedOrder.payment?.paymentMethod === "Razorpay" && (
          <span style={{ marginLeft: "300px" }}>
            Razorpay ID: {selectedOrder.payment.transactionId}
          </span>
        )}
      </p>
      <p>Mobile No: {selectedOrder.buyer?.mobile_no}</p>
      <p>{selectedOrder.buyer?.address}</p>
      <p>{selectedOrder.buyer?.city}</p>
      <p>{selectedOrder.buyer?.landmark}</p>
      <p>{selectedOrder.buyer?.state}</p>
      <p>Pincode: {selectedOrder.buyer?.pincode}</p>
      <p>Created At: {moment(selectedOrder.createdAt).format("LLLL")}</p>
    </div>
  );
};

export default OrderHeader;
