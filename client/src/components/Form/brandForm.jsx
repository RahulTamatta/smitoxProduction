import React from "react";
import { Input } from "antd";

const BrandForm = ({ value, setValue, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="name" className="form-label">
          Brand Name
        </label>
        <Input
          type="text"
          className="form-control"
          id="name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter brand name"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Save
      </button>
    </form>
  );
};

export default BrandForm;