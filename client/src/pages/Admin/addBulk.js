import React, { useState } from 'react';

const BulkProductForm = () => {
  // State to manage bulk product entries
  const [bulkProducts, setBulkProducts] = useState([
    { minimum_quantity: '', maximum_quantity: '', discount_mrp: '', selling_price_set: '' }
  ]);

  // Function to handle changes in input fields
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...bulkProducts];
    list[index][name] = value;
    setBulkProducts(list);
  };

  // Function to add a new row
  const handleAddRow = () => {
    setBulkProducts([...bulkProducts, { minimum_quantity: '', maximum_quantity: '', discount_mrp: '', selling_price_set: '' }]);
  };

  // Function to remove a row
  const handleRemoveRow = index => {
    const list = [...bulkProducts];
    list.splice(index, 1);
    setBulkProducts(list);
  };

  return (
    <div className="form-group row" id="product-dimensions">
      <p>
      WHOLESALE&nbsp;&nbsp;
        <button className="btn btn-danger" type="button" onClick={handleAddRow}>
          Add In Bulk
        </button>
      </p>
      <div id="add_bulk_products">
        <table className="table">
          <thead>
            <tr>
              <th>Minimum Quantity</th>
              <th>Maximum Quantity</th>
              <th>Discount Price</th>
              <th>Selling Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bulkProducts.map((product, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    name="minimum_quantity"
                    value={product.minimum_quantity}
                    onChange={e => handleChange(index, e)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    name="maximum_quantity"
                    value={product.maximum_quantity}
                    onChange={e => handleChange(index, e)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    name="discount_mrp"
                    value={product.discount_mrp}
                    step="any"
                    onChange={e => handleChange(index, e)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    name="selling_price_set"
                    value={product.selling_price_set}
                    step="any"
                    onChange={e => handleChange(index, e)}
                  />
                </td>
                <td>
                  <button className="btn btn-danger" onClick={() => handleRemoveRow(index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkProductForm;
