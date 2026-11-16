import moment from "moment";

export const shareOrderToWhatsApp = (selectedOrder, calculateTotals) => {
  if (!selectedOrder) {
    alert("No order selected");
    return;
  }

  if (!selectedOrder.buyer?.mobile_no) {
    alert("Customer mobile number not available");
    return;
  }

  const phoneNumber = String(selectedOrder.buyer.mobile_no)
    .replace(/\D/g, "")
    .replace(/^0+/, "");

  if (!phoneNumber) {
    alert("Invalid mobile number format");
    return;
  }

  const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `91${phoneNumber}`;
  const totals = calculateTotals();

  const message = `
*Order Details from Smitox B2b*
---------------------------
Order ID: ${selectedOrder._id}
Customer: ${selectedOrder.buyer?.user_fullname}
Date: ${moment().format("DD/MM/YYYY")}

*Order Summary*
Subtotal: Rs. ${totals.subtotal.toFixed(2)}
GST: Rs. ${totals.gst.toFixed(2)}
Delivery Charges: Rs. ${Number(selectedOrder.deliveryCharges || 0).toFixed(2)}
COD Charges: Rs. ${Number(selectedOrder.codCharges || 0).toFixed(2)}
Discount: Rs. ${Number(selectedOrder.discount || 0).toFixed(2)}
*Total Amount: Rs. ${totals.total.toFixed(2)}*
Amount Paid: Rs. ${Number(selectedOrder.amount || 0).toFixed(2)}
Amount Pending: Rs. ${(totals.total - Number(selectedOrder.amount || 0)).toFixed(2)}

Thank you for your business!
`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
  window.open(whatsappLink, "_blank");
};
