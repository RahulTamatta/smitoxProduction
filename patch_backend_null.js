const fs = require('fs');
let code = fs.readFileSync('server/controllers/userController.js', 'utf8');

const searchStr = `          for (const item of cart.products) {
            if (item.product) {
              productCount += item.quantity;
              totalAmount += item.quantity * (item.product.perPiecePrice || 0);
            }
          }`;

const replaceStr = `          for (const item of cart.products) {
            if (item && item.product) {
              productCount += item.quantity;
              totalAmount += item.quantity * (item.product.perPiecePrice || 0);
            }
          }`;

if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync('server/controllers/userController.js', code);
    console.log("Patched successfully");
} else {
    console.log("Could not find code to patch");
}
