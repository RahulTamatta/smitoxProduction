const fs = require('fs');
let code = fs.readFileSync('server/controllers/userController.js', 'utf8');

// Replace the user mapping and response section
const searchStr = `    const responseList = users.map(u => {
      const uObj = u.toObject();
      if ((hasCart === 'true' || hasCart === true) && cartStatsMap[u._id.toString()]) {
        uObj.cartStats = cartStatsMap[u._id.toString()];
      }
      return uObj;
    });

    res.json({ status: 'success', list: responseList, total });`;

const replaceStr = `    let responseList = users.map(u => {
      const uObj = u.toObject();
      if ((hasCart === 'true' || hasCart === true) && cartStatsMap[u._id.toString()]) {
        uObj.cartStats = cartStatsMap[u._id.toString()];
      }
      return uObj;
    });

    let finalTotal = total;
    if (hasCart === 'true' || hasCart === true) {
      // Strictly enforce that we only return users with cart stats > 0
      responseList = responseList.filter(u => u.cartStats && u.cartStats.productCount > 0);
      finalTotal = responseList.length; // Override total since we filtered post-query
    }

    res.json({ status: 'success', list: responseList, total: finalTotal });`;

if (code.includes('const responseList = users.map')) {
    code = code.replace(searchStr, replaceStr);
    
    // Also handle the case where it might be the old version without hasCart===true
    const oldSearchStr = `    const responseList = users.map(u => {
      const uObj = u.toObject();
      if (hasCart === 'true' && cartStatsMap[u._id.toString()]) {
        uObj.cartStats = cartStatsMap[u._id.toString()];
      }
      return uObj;
    });

    res.json({ status: 'success', list: responseList, total });`;
    
    code = code.replace(oldSearchStr, replaceStr);
    fs.writeFileSync('server/controllers/userController.js', code);
    console.log("Patched successfully");
} else {
    console.log("Could not find code to patch");
}
