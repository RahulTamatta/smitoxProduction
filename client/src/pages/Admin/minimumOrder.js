import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MinimumOrderForm = () => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [advancePercentage, setAdvancePercentage] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMinimumOrder();
  }, []);

  const fetchMinimumOrder = async () => {
    try {
      const response = await axios.get('/api/v1/minimumOrder/getMinimumOrder');
      if (response.data) {
        setAmount(response.data.amount);
        setCurrency(response.data.currency);
        setAdvancePercentage(response.data.advancePercentage || '');
      }
    } catch (error) {
      console.error('Error fetching minimum order:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {};
      
      // Only include fields that have been modified
      if (amount !== '') updateData.amount = parseFloat(amount);
      if (currency !== '') updateData.currency = currency;
      if (advancePercentage !== '') updateData.advancePercentage = parseFloat(advancePercentage);

      const response = await axios.put('/api/v1/minimumOrder/updateMinimumOrder', updateData);
      setMessage('Minimum order updated successfully!');
      console.log(response.data);
    } catch (error) {
      setMessage('Error updating minimum order.');
      console.error('Error updating minimum order:', error);
    }
  };

  return (
    <div>
      <h2>Minimum Order Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (optional)"
          />
        </div>
        <div>
          <label htmlFor="currency">Currency:</label>
          <input
            type="text"
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="Enter currency (optional)"
          />
        </div>
        <div>
          <label htmlFor="advancePercentage">Advance Payment (%):</label>
          <input
            type="number"
            id="advancePercentage"
            value={advancePercentage}
            onChange={(e) => setAdvancePercentage(e.target.value)}
            min="0"
            max="100"
            placeholder="Enter advance percentage (optional)"
          />
        </div>
        <button type="submit">Update Minimum Order</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default MinimumOrderForm;