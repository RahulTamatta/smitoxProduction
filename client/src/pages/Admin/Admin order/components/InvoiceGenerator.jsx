import jsPDF from "jspdf";
import "jspdf-autotable";
import moment from "moment";

export const generateInvoicePDF = async (selectedOrder, calculateTotals, convertToWords) => {
  if (!selectedOrder) {
    alert("No order selected");
    return;
  }

  try {
    const doc = new jsPDF();
    const totals = calculateTotals();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const products = selectedOrder?.products || [];
    const margin = 10;

    // ===== HEADER SECTION =====
    let currentY = 12;

    // Company Logo and Name (Left side)
    try {
      const logoData = await loadImage("https://smitox.com/img/logo.png");
      doc.addImage(logoData, "PNG", margin, currentY, 20, 8);
      
      // Company name next to logo
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("smitox.in", margin + 25, currentY + 6);
    } catch (imageError) {
      console.warn("Failed to load logo:", imageError);
      // Fallback: Company name only
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("smitox.in", margin, currentY + 6);
    }

    currentY += 15;

    // ===== CUSTOMER INFO SECTION =====
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 5;
    
    // Left Column - Billing Address
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Billing Address :", leftColX, currentY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const buyerName = selectedOrder.buyer?.user_fullname || "Customer Name";
    doc.text(buyerName, leftColX, currentY + 5);
    
    const address = selectedOrder.buyer?.address || "Address not provided";
    const addressLines = doc.splitTextToSize(address, 75);
    let addressY = currentY + 9;
    addressLines.forEach((line, index) => {
      doc.text(line, leftColX, addressY + (index * 4));
    });
    addressY += Math.max(addressLines.length * 4, 12);
    
    doc.text(`${selectedOrder.buyer?.city || ""}, ${selectedOrder.buyer?.state || ""}, ${selectedOrder.buyer?.pincode || ""}`, leftColX, addressY);
    doc.text("IN", leftColX, addressY + 4);
    doc.text(`State/UT Code: ${selectedOrder.buyer?.pincode?.substring(0, 2) || "40"}`, leftColX, addressY + 8);

    // Right Column - Shipping Address
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Shipping Address :", rightColX, currentY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(buyerName, rightColX, currentY + 5);
    doc.text(addressLines[0] || address.substring(0, 35), rightColX, currentY + 9);
    doc.text(`${selectedOrder.buyer?.city || ""}, ${selectedOrder.buyer?.state || ""}, ${selectedOrder.buyer?.pincode || ""}`, rightColX, currentY + 13);
    doc.text("IN", rightColX, currentY + 17);
    doc.text(`State/UT Code: ${selectedOrder.buyer?.pincode?.substring(0, 2) || "40"}`, rightColX, currentY + 21);
    doc.text(`Place of supply: ${selectedOrder.buyer?.state || "maharashtra"}`, rightColX, currentY + 25);
    doc.text(`Place of delivery: ${selectedOrder.buyer?.state || "maharashtra"}`, rightColX, currentY + 29);

    currentY += 38;

    // ===== ORDER & INVOICE DETAILS SECTION =====
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Left - Order Details
    doc.text(`Order Number: ${selectedOrder._id?.substring(0, 17) || "N/A"}`, leftColX, currentY);
    doc.text(`Order Date: ${moment(selectedOrder.createdAt).format("DD.MM.YYYY")}`, leftColX, currentY + 4);
    
    // Right - Invoice Details
    doc.text(`Invoice Number : ${selectedOrder._id?.substring(0, 10) || "IN-994"}`, rightColX, currentY);
    doc.text(`Invoice Details : ${selectedOrder._id?.substring(0, 17) || "GJ-1773586925-2526"}`, rightColX, currentY + 4);
    doc.text(`Invoice Date : ${moment().format("DD.MM.YYYY")}`, rightColX, currentY + 8);

    currentY += 18;

    // ===== PRODUCTS TABLE SECTION =====
    const tableColumns = [
      "Sl. No",
      "Description", 
      "Unit Price x Qty",
      "Net Amount",
      "Tax Rate",
      "Tax Amount"
    ];

    const tableRows = products.map((product, index) => {
      const productData = product.product || {};
      const quantity = product.quantity || 0;
      const price = product.price || 0;
      const gst = parseFloat(productData.gst) || 0;
      const netAmount = price * quantity;
      const taxAmount = netAmount * (gst / 100);
      
      return [
        String(index + 1),
        productData.name || "Product Name",
        `Rs ${price.toFixed(2)} x ${quantity}`,
        "Rs " + netAmount.toFixed(2),
        gst + "%",
        "Rs " + taxAmount.toFixed(2)
      ];
    });

    // Add TOTAL row
    tableRows.push([
      "",
      "TOTAL:",
      "",
      "Rs " + totals.subtotal.toFixed(2),
      "",
      "Rs " + totals.gst.toFixed(2)
    ]);

    // Compact professional table configuration
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        textColor: [0, 0, 0],
        overflow: 'linebreak',
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        minCellHeight: 5,
        valign: 'middle',
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 70, halign: 'left' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' }
      },
      didParseCell: function (data) {
        // Style TOTAL row
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontSize = 10;
        }
      },
      margin: { left: margin, right: margin }
    });

    let finalY = doc.lastAutoTable.finalY + 6;

    // ===== TOTALS BREAKDOWN SECTION =====
    const subtotal = totals.subtotal || 0;
    const gstAmount = totals.gst || 0;
    const deliveryCharges = selectedOrder.deliveryCharges || 0;
    const codCharges = selectedOrder.codCharges || 0;
    const discount = selectedOrder.discount || 0;
    const totalAmount = subtotal + gstAmount + deliveryCharges + codCharges - discount;
    const amountPaid = selectedOrder.amountPaid || 0;
    const amountPending = totalAmount - amountPaid;

    // Create totals breakdown - positioned on right side with proper spacing
    let totalsY = finalY;
    const totalsX = pageWidth - 80;
    
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    
    if (subtotal > 0) {
      doc.text("Subtotal:", totalsX, totalsY);
      doc.text("Rs " + subtotal.toFixed(2), totalsX + 35, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (gstAmount > 0) {
      doc.text("GST:", totalsX, totalsY);
      doc.text("Rs " + gstAmount.toFixed(2), totalsX + 35, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (deliveryCharges > 0) {
      doc.text("Delivery Charges:", totalsX, totalsY);
      doc.text("Rs " + deliveryCharges.toFixed(2), totalsX + 35, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (codCharges > 0) {
      doc.text("COD Charges:", totalsX, totalsY);
      doc.text("Rs " + codCharges.toFixed(2), totalsX + 35, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (discount > 0) {
      doc.text("Discount:", totalsX, totalsY);
      doc.text("- Rs " + discount.toFixed(2), totalsX + 35, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    // Total line with bold formatting
    doc.setFont("helvetica", "bold");
    doc.text("Total:", totalsX, totalsY);
    doc.text("Rs " + totalAmount.toFixed(2), totalsX + 35, totalsY, { align: 'right' });
    totalsY += 4;
    
    doc.setFont("helvetica", "normal");
    
    if (amountPaid > 0) {
      doc.text("Amount Paid:", totalsX, totalsY);
      doc.text("Rs " + amountPaid.toFixed(2), totalsX + 35, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (amountPending > 0) {
      doc.text("Amount Pending:", totalsX, totalsY);
      doc.text("Rs " + amountPending.toFixed(2), totalsX + 35, totalsY, { align: 'right' });
      totalsY += 4;
    }

    // ===== AMOUNT IN WORDS SECTION =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Amount in Words:", margin, finalY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const amountInWords = convertToWords(Math.round(totalAmount));
    doc.text(amountInWords, margin, finalY + 5);

    finalY += 15;

    // ===== SIGNATURE SECTION =====
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`For ${buyerName.toUpperCase()}:`, pageWidth - 65, finalY);
    
    // Signature box with border
    doc.rect(pageWidth - 65, finalY + 3, 50, 20);
    doc.setFontSize(7.5);
    doc.text("Authorized Signatory", pageWidth - 40, finalY + 25, { align: 'center' });

    // ===== PAYMENT DETAILS SECTION =====
    finalY = pageHeight - 45;
    doc.setFontSize(8);
    doc.text("Whether tax is payable under reverse charge - No", margin, finalY);
    
    // Payment transaction details table
    const paymentData = [
      ["Payment Transaction ID:", selectedOrder.payment?.transactionId || "COD-1758681456547-871", "Invoice Value:", "Rs " + totalAmount.toFixed(2)],
      ["Date & Time: " + moment().format("DD/MM/YYYY, HH:mm:ss"), "TPS", "", "Mode of Payment:", selectedOrder.payment?.paymentMethod || "COD"]
    ];

    doc.autoTable({
      body: paymentData,
      startY: finalY + 2,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: { top: 1, right: 1.5, bottom: 1, left: 1.5 },
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' },
        1: { cellWidth: 40, halign: 'left' },
        2: { cellWidth: 30, halign: 'left' },
        3: { cellWidth: 50, halign: 'left' }
      },
      margin: { left: margin, right: margin }
    });

    // ===== FOOTER NOTES SECTION =====
    finalY = pageHeight - 18;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    
    // Footer disclaimers - compact style
    const footerLines = [
      "*SMITOX Amazon Seller Services Pvt. Ltd., ARIPL Amazon Retail India Pvt. Ltd. (only where Amazon Retail India Pvt. Ltd. fulfillment center is co-located)",
      "Customers desirous of availing input GST credit are requested to create a Business account and purchase on Amazon.in/business from Business eligible offers",
      "Please note that this invoice is not a demand note or bill of exchange"
    ];
    
    footerLines.forEach((line, index) => {
      doc.text(line, margin, finalY + (index * 2.5));
    });
    
    // Page number
    doc.text("Page 1 of 1", pageWidth - margin, finalY + 7, { align: "right" });

    // Save PDF
    doc.save(`Invoice_${selectedOrder._id?.substring(0, 10) || "Order"}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};

const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
};
