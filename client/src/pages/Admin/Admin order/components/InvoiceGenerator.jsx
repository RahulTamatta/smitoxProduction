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
    
    // Left Column - Sold By (Hardcoded Smitox B2B Address)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Sold By :", leftColX, currentY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Smitox B2B", leftColX, currentY + 5);
    doc.text("Mumbai", leftColX, currentY + 9);
    
    let addressY = currentY + 17;

    // Right Column - Billing Address (Customer Address)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Billing Address :", rightColX, currentY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const buyerName = selectedOrder.buyer?.user_fullname || "Customer Name";
    doc.text(buyerName, rightColX, currentY + 5);
    
    const address = selectedOrder.buyer?.address || "Address not provided";
    const addressLines = doc.splitTextToSize(address, 75);
    let customerAddressY = currentY + 9;
    addressLines.forEach((line, index) => {
      doc.text(line, rightColX, customerAddressY + (index * 4));
    });
    customerAddressY += Math.max(addressLines.length * 4, 12);
    
    doc.text(`${selectedOrder.buyer?.city || ""}, ${selectedOrder.buyer?.state || ""}, ${selectedOrder.buyer?.pincode || ""}`, rightColX, customerAddressY);
    doc.text("IN", rightColX, customerAddressY + 4);
    doc.text(`State/UT Code: ${selectedOrder.buyer?.pincode?.substring(0, 2) || "40"}`, rightColX, customerAddressY + 8);

    // Adjust currentY based on the longer address section
    currentY = Math.max(addressY, customerAddressY + 12) + 6;

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
      "Qty x Unit Price",
      "Net Amount",
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
        `${quantity} x Rs ${price.toFixed(2)}`,
        "Rs " + netAmount.toFixed(2),
        "Rs " + taxAmount.toFixed(2)
      ];
    });

    // Add TOTAL row
    tableRows.push([
      "",
      "TOTAL:",
      "",
      "Rs " + totals.subtotal.toFixed(2),
      "Rs " + totals.gst.toFixed(2)
    ]);

    // Compact professional table configuration with smaller fonts
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      styles: { 
        fontSize: 7.5,
        cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
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
        fontSize: 8,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        minCellHeight: 4,
        valign: 'middle',
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },     // Sl. No - smaller
        1: { cellWidth: 85, halign: 'left' },       // Description - larger for product names
        2: { cellWidth: 35, halign: 'center' },     // Qty x Unit Price
        3: { cellWidth: 28, halign: 'right' },      // Net Amount
        4: { cellWidth: 28, halign: 'right' }       // Tax Amount
      },
      didParseCell: function (data) {
        // Style TOTAL row
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontSize = 8;
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
    const amountPaid = selectedOrder.amount || 0; // Use 'amount' field for amount paid
    const amountPending = totalAmount - amountPaid;

    // Create totals breakdown - positioned on right side with proper spacing
    let totalsY = finalY;
    const totalsX = pageWidth - 85;  // Increased space for better alignment
    const totalsRightX = pageWidth - 15;  // Fixed right alignment position
    
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    
    if (subtotal > 0) {
      doc.text("Subtotal:", totalsX, totalsY);
      doc.text("Rs " + subtotal.toFixed(2), totalsRightX, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (gstAmount > 0) {
      doc.text("GST:", totalsX, totalsY);
      doc.text("Rs " + gstAmount.toFixed(2), totalsRightX, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (deliveryCharges > 0) {
      doc.text("Delivery Charges:", totalsX, totalsY);
      doc.text("Rs " + deliveryCharges.toFixed(2), totalsRightX, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (codCharges > 0) {
      doc.text("COD Charges:", totalsX, totalsY);
      doc.text("Rs " + codCharges.toFixed(2), totalsRightX, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (discount > 0) {
      doc.text("Discount:", totalsX, totalsY);
      doc.text("- Rs " + discount.toFixed(2), totalsRightX, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    // Total line with bold formatting
    doc.setFont("helvetica", "bold");
    doc.text("Total:", totalsX, totalsY);
    doc.text("Rs " + totalAmount.toFixed(2), totalsRightX, totalsY, { align: 'right' });
    totalsY += 4;
    
    doc.setFont("helvetica", "normal");
    
    if (amountPaid > 0) {
      doc.text("Amount Paid:", totalsX, totalsY);
      doc.text("Rs " + amountPaid.toFixed(2), totalsRightX, totalsY, { align: 'right' });
      totalsY += 4;
    }
    
    if (amountPending > 0) {
      doc.text("Amount Pending:", totalsX, totalsY);
      doc.text("Rs " + amountPending.toFixed(2), totalsRightX, totalsY, { align: 'right' });
      totalsY += 4;
    }

    // ===== AMOUNT IN WORDS SECTION =====
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Amount in Words:", margin, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const amountInWords = convertToWords(Math.round(totalAmount));
    doc.text(amountInWords, margin, finalY + 4);

    finalY += 12;

    // ===== PAYMENT DETAILS SECTION =====
    // Dynamic positioning to prevent overlap with totals
    const minPaymentY = Math.max(totalsY + 10, finalY + 5);
    finalY = Math.max(minPaymentY, pageHeight - 60);
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
        fontSize: 7,
        cellPadding: { top: 0.5, right: 1, bottom: 0.5, left: 1 },
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 48, halign: 'left' },
        1: { cellWidth: 38, halign: 'left' },
        2: { cellWidth: 28, halign: 'left' },
        3: { cellWidth: 48, halign: 'left' }
      },
      margin: { left: margin, right: margin }
    });

    // ===== DISCLAIMER SECTION =====
    // Dynamic footer positioning based on content
    const disclaimerStartY = Math.max(doc.lastAutoTable.finalY + 8, pageHeight - 25);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    
    // Disclaimer points in very small font
    const disclaimerLines = [
      "Check Bill 2-3 Times Before Making Payment.Once Payment Received It Will Not Refundable.There Is No Any Warranty Or Guarantee On Any Products.Don't Ask For Replacement Or Warranty",

    
    ];
    
    // Check if we need to add a new page for disclaimers
    let disclaimerY = disclaimerStartY;
    if (disclaimerStartY + (disclaimerLines.length * 3) + 8 > pageHeight - 5) {
      doc.addPage();
      disclaimerY = 15;
    }
    
    disclaimerLines.forEach((line, index) => {
      doc.text(line, margin, disclaimerY + (index * 3));
    });
    
    // Page number
    const pageNumberY = Math.min(disclaimerY + (disclaimerLines.length * 3) + 5, pageHeight - 5);
    doc.text("Page 1 of 1", pageWidth - margin, pageNumberY, { align: "right" });

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
