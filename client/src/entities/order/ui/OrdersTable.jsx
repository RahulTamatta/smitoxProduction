import React from "react";
import { Button, Table } from "react-bootstrap";
import moment from "moment";

export default function OrdersTable({
  orders,
  page,
  perPage,
  total,
  sortBy,
  sortOrder,
  onSortChange,
  onView,
  onAddTracking,
  calcRowTotals,
}) {
  return (
    <Table striped bordered hover style={{ width: "100%", fontSize: "1rem", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>#</th>
          <th style={{ fontSize: '0.8rem', padding: '4px', cursor: 'pointer' }} onClick={() => onSortChange("orderId")}>
            Order Id <span style={{ fontWeight: 'bold' }}>{sortBy === 'orderId' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
          </th>
          <th style={{ fontSize: '0.8rem', padding: '4px', cursor: 'pointer' }} onClick={() => onSortChange("total")}>
            Total <span style={{ fontWeight: 'bold' }}>{sortBy === 'total' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
          </th>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>Payment</th>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>Status</th>
          <th style={{ fontSize: '0.8rem', padding: '4px', cursor: 'pointer' }} onClick={() => onSortChange("createdAt")}>
            Created <span style={{ fontWeight: 'bold' }}>{sortBy === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
          </th>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o, idx) => {
          const row = calcRowTotals(o);
          return (
            <tr key={o._id} style={{ fontSize: '0.7rem', padding: '2px' }}>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>{(page - 1) * perPage + idx + 1}</td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
                <div style={{ display: 'inline-block', padding: '4px 8px', border: '1px solid #007bff', borderRadius: '4px', backgroundColor: '#e7f1ff', fontWeight: 'bold', color: '#007bff', cursor: 'pointer', width: 'fit-content' }} onClick={() => onView(o)}>
                  {String(o._id).substring(0, 10)}
                </div>
                <div style={{ fontSize: '0.7rem' }}>{o.buyer?.user_fullname || 'N/A'}</div>
                <div style={{ fontSize: '0.7rem' }}>{o.buyer?.mobile_no || 'N/A'}</div>
                {o.tracking ? (
                  <div style={{ fontSize: '0.7rem' }}>{o.tracking.company}: {o.tracking.id}</div>
                ) : (
                  <Button variant="primary" style={{ fontSize: '0.6rem', padding: '2px 4px', borderRadius: '3px', marginTop: 4 }} onClick={() => onAddTracking(o)}>
                    Add Tracking ID
                  </Button>
                )}
              </td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>{row.total.toFixed(2)}</td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>{o.payment?.paymentMethod}</td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>{o.status}</td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>{o.createdAt ? moment(o.createdAt).format('DD-MM-YYYY') : '-'}</td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
                <Button variant="info" style={{ fontSize: '0.6rem', padding: '2px 4px', borderRadius: '3px' }} onClick={() => onView(o)}>View</Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
