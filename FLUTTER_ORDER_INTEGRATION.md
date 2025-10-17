# Flutter App Order Integration Guide

## ✅ Order Schema - All Snapshot Fields Are Optional

The order schema has been updated to make all snapshot fields **optional** with default values. This means:

- ✅ **Flutter app can send minimal order data** (just product, quantity, price)
- ✅ **React web app sends enriched data** (with all snapshot fields)
- ✅ **Both work seamlessly** with the same backend

---

## 📦 Minimum Required Fields (Flutter App)

Flutter app only needs to send these **required** fields:

```dart
{
  "products": [
    {
      "product": "507f1f77bcf86cd799439011",  // Product ObjectId (required)
      "quantity": 104,                         // Quantity (required)
      "price": 3.00                            // Unit price (required)
    }
  ],
  "amount": 312.00,                            // Total amount (required)
  "payment": {
    "paymentMethod": "COD"                     // COD, Razorpay, or Advance (required)
  }
}
```

### Optional Fields (Will Use Defaults):
- `unitPrice` → defaults to 0
- `netAmount` → defaults to 0
- `taxAmount` → defaults to 0
- `totalAmount` → defaults to 0
- `gst` → defaults to 0
- `productName` → defaults to ""
- `productImage` → defaults to ""
- `unitSet` → defaults to 1
- `deliveryCharges` → defaults to 0
- `codCharges` → defaults to 0
- `discount` → defaults to 0
- `amountPending` → defaults to 0

---

## 🎯 Recommended Approach for Flutter

### Option 1: Send Minimal Data (Simplest)
Flutter app sends only required fields. Backend will use defaults for snapshot fields.

```dart
// Flutter Order Model
class Order {
  List<OrderProduct> products;
  double amount;
  Payment payment;
  
  Map<String, dynamic> toJson() {
    return {
      'products': products.map((p) => {
        'product': p.productId,
        'quantity': p.quantity,
        'price': p.price,
      }).toList(),
      'amount': amount,
      'payment': {
        'paymentMethod': payment.method, // "COD", "Razorpay", "Advance"
      },
    };
  }
}
```

### Option 2: Send Complete Snapshot Data (Recommended)
Flutter app calculates and sends snapshot fields for better data integrity.

```dart
class OrderProduct {
  String productId;
  int quantity;
  double price;
  
  // Optional snapshot fields
  double? unitPrice;
  double? netAmount;
  double? taxAmount;
  double? totalAmount;
  double? gst;
  String? productName;
  String? productImage;
  int? unitSet;
  
  Map<String, dynamic> toJson() {
    return {
      'product': productId,
      'quantity': quantity,
      'price': price,
      // Include snapshot fields if available
      if (unitPrice != null) 'unitPrice': unitPrice,
      if (netAmount != null) 'netAmount': netAmount,
      if (taxAmount != null) 'taxAmount': taxAmount,
      if (totalAmount != null) 'totalAmount': totalAmount,
      if (gst != null) 'gst': gst,
      if (productName != null) 'productName': productName,
      if (productImage != null) 'productImage': productImage,
      if (unitSet != null) 'unitSet': unitSet,
    };
  }
  
  // Calculate snapshot data
  void calculateSnapshot(Product product) {
    unitPrice = price;
    netAmount = price * quantity;
    gst = product.gst ?? 0;
    taxAmount = (netAmount! * gst!) / 100;
    totalAmount = netAmount! + taxAmount!;
    productName = product.name;
    productImage = product.imageUrl;
    unitSet = product.unitSet ?? 1;
  }
}
```

---

## 🔌 API Endpoint

### POST `/api/v1/product/process-payment`

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body (Minimal - Flutter):**
```json
{
  "products": [
    {
      "product": "507f1f77bcf86cd799439011",
      "quantity": 104,
      "price": 3.00
    },
    {
      "product": "507f1f77bcf86cd799439012",
      "quantity": 180,
      "price": 160.00
    }
  ],
  "amount": 29112.00,
  "paymentMethod": "COD"
}
```

**Request Body (Complete - Recommended):**
```json
{
  "products": [
    {
      "product": "507f1f77bcf86cd799439011",
      "quantity": 104,
      "price": 3.00,
      "unitPrice": 3.00,
      "netAmount": 312.00,
      "taxAmount": 0.00,
      "totalAmount": 312.00,
      "gst": 0,
      "productName": "Km 809 A Trimmer",
      "productImage": "https://ik.imagekit.io/...",
      "unitSet": 2
    },
    {
      "product": "507f1f77bcf86cd799439012",
      "quantity": 180,
      "price": 160.00,
      "unitPrice": 160.00,
      "netAmount": 28800.00,
      "taxAmount": 0.00,
      "totalAmount": 28800.00,
      "gst": 0,
      "productName": "Zengaa Puzzule Game",
      "productImage": "https://ik.imagekit.io/...",
      "unitSet": 3
    }
  ],
  "amount": 29112.00,
  "amountPending": 0,
  "deliveryCharges": 0,
  "codCharges": 0,
  "discount": 0,
  "paymentMethod": "COD"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "COD order placed successfully",
  "order": {
    "_id": "68d0e685bbf2fe48695fd6a8",
    "products": [...],
    "buyer": "507f1f77bcf86cd799439013",
    "amount": 29112.00,
    "status": "Pending",
    "createdAt": "2025-09-24T04:29:00.000Z"
  }
}
```

---

## 🎨 Flutter Example Implementation

### 1. Order Service
```dart
class OrderService {
  final String baseUrl = 'https://your-api.com/api/v1';
  
  Future<OrderResponse> placeOrder({
    required List<CartItem> cartItems,
    required double totalAmount,
    required String paymentMethod,
    double deliveryCharges = 0,
    double codCharges = 0,
    double discount = 0,
  }) async {
    try {
      // Convert cart items to order products
      final products = cartItems.map((item) {
        final product = OrderProduct(
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
        );
        
        // Calculate snapshot data (recommended)
        product.calculateSnapshot(item.product);
        
        return product.toJson();
      }).toList();
      
      // Prepare order data
      final orderData = {
        'products': products,
        'amount': totalAmount,
        'deliveryCharges': deliveryCharges,
        'codCharges': codCharges,
        'discount': discount,
        'paymentMethod': paymentMethod,
      };
      
      // Send to backend
      final response = await http.post(
        Uri.parse('$baseUrl/product/process-payment'),
        headers: {
          'Authorization': 'Bearer ${await getToken()}',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(orderData),
      );
      
      if (response.statusCode == 200) {
        return OrderResponse.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to place order');
      }
    } catch (e) {
      throw Exception('Error placing order: $e');
    }
  }
}
```

### 2. Calculate Totals Helper
```dart
class OrderCalculator {
  static Map<String, double> calculateTotals(List<CartItem> items) {
    double subtotal = 0;
    double tax = 0;
    
    for (var item in items) {
      final netAmount = item.price * item.quantity;
      final gst = item.product.gst ?? 0;
      final taxAmount = (netAmount * gst) / 100;
      
      subtotal += netAmount;
      tax += taxAmount;
    }
    
    return {
      'subtotal': subtotal,
      'tax': tax,
      'total': subtotal + tax,
    };
  }
}
```

---

## ⚠️ Important Notes

1. **Backward Compatibility**: Existing Flutter orders without snapshot data will continue to work
2. **Admin Panel**: Orders without snapshot data will show defaults (0.00, empty strings)
3. **Migration**: Run migration script only affects existing orders, not new ones
4. **Validation**: Backend doesn't validate snapshot fields, only required fields
5. **Defaults**: All optional fields have sensible defaults in the schema

---

## 🧪 Testing

### Test Case 1: Minimal Order (Flutter)
```bash
curl -X POST http://localhost:8080/api/v1/product/process-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [{"product": "PRODUCT_ID", "quantity": 1, "price": 100}],
    "amount": 100,
    "paymentMethod": "COD"
  }'
```

### Test Case 2: Complete Order (Recommended)
```bash
curl -X POST http://localhost:8080/api/v1/product/process-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [{
      "product": "PRODUCT_ID",
      "quantity": 1,
      "price": 100,
      "unitPrice": 100,
      "netAmount": 100,
      "taxAmount": 18,
      "totalAmount": 118,
      "gst": 18,
      "productName": "Test Product",
      "productImage": "https://...",
      "unitSet": 1
    }],
    "amount": 118,
    "paymentMethod": "COD"
  }'
```

---

## 📊 Schema Reference

```javascript
// Order Model Schema
{
  products: [
    {
      product: ObjectId,           // REQUIRED
      quantity: Number,            // REQUIRED
      price: Number,               // REQUIRED (default: 0)
      unitPrice: Number,           // OPTIONAL (default: 0)
      netAmount: Number,           // OPTIONAL (default: 0)
      taxAmount: Number,           // OPTIONAL (default: 0)
      totalAmount: Number,         // OPTIONAL (default: 0)
      gst: Number,                 // OPTIONAL (default: 0)
      productName: String,         // OPTIONAL (default: "")
      productImage: String,        // OPTIONAL (default: "")
      unitSet: Number              // OPTIONAL (default: 1)
    }
  ],
  buyer: ObjectId,                 // AUTO (from auth token)
  amount: Number,                  // REQUIRED
  deliveryCharges: Number,         // OPTIONAL (default: 0)
  codCharges: Number,              // OPTIONAL (default: 0)
  discount: Number,                // OPTIONAL (default: 0)
  amountPending: Number,           // OPTIONAL (default: 0)
  payment: {
    paymentMethod: String          // REQUIRED (COD, Razorpay, Advance)
  }
}
```

---

## ✅ Summary

- ✅ **Flutter app works with minimal data** (product, quantity, price, amount, paymentMethod)
- ✅ **Optional snapshot fields** use schema defaults if not provided
- ✅ **React web app** continues to send enriched data
- ✅ **No breaking changes** - both apps work seamlessly
- ✅ **Recommended**: Flutter app should calculate and send snapshot data for better data integrity

---

## 🆘 Support

If you encounter issues:
1. Check that `product`, `quantity`, `price`, `amount`, and `paymentMethod` are provided
2. Verify authentication token is valid
3. Ensure product IDs exist in database
4. Check server logs for detailed error messages

For questions, contact the backend development team.
