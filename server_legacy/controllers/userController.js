// export const getUsers = async (req, res) => {
//     try {
//       const { page = 1, limit = 20, search = '' } = req.query;
      
//       let searchQuery = {};
      
//       if (search) {
//         // Check if search term is numeric
//         const isNumeric = /^\d+$/.test(search);
        
//         if (isNumeric) {
//           // For mobile number searches
//           searchQuery = {
//             $or: [
//               { user_fullname: { $regex: search, $options: 'i' } },
//               { email_id: { $regex: search, $options: 'i' } },
//               { address: { $regex: search, $options: 'i' } },
//               // Try multiple ways to match mobile numbers
//               { mobile_no: { $regex: search, $options: 'i' } },
//               { mobile_no: Number(search) }, // If stored as number
//               { mobile_no: { $type: "string", $regex: search } }, // If stored as string
//               { mobile_no: { $type: "number", $eq: Number(search) } } // If stored as number with exact match
//             ]
//           };
//         } else {
//           // For non-numeric searches
//           searchQuery = {
//             $or: [
//               { user_fullname: { $regex: search, $options: 'i' } },
//               { email_id: { $regex: search, $options: 'i' } },
//               { address: { $regex: search, $options: 'i' } }
//             ]
//           };
//         }
//       }
  
//       const users = await userModel
//         .find(searchQuery)
//         .skip((page - 1) * limit)
//         .limit(Number(limit))
//         .populate('products')
//         .populate('wishlist')
//         .populate('cart.product');
  
//       const total = await userModel.countDocuments(searchQuery);
  
//       res.json({ status: 'success', list: users, total });
//     } catch (error) {
//       res.status(500).json({ status: 'error', message: error.message });
//     }
//   };