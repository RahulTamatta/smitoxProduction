import React from "react";
import { useSearch } from "../../context/search";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

const SearchInput = () => {
  const [values, setValues] = useSearch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.get(
        `/api/v1/product/search/${values.keyword}`
      );
      setValues({ ...values, results: data });
      navigate("/search");
    } catch (error) {
      console.log(error);
    }
  };

  const searchInputStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '4px',
    padding: '5px 10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const inputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    padding: '5px',
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    color: '#2874f0',
  };

  return (
    <form onSubmit={handleSubmit} style={searchInputStyle}>
      <input
        type="search"
        placeholder="Search for products, brands and more"
        aria-label="Search"
        value={values.keyword}
        onChange={(e) => setValues({ ...values, keyword: e.target.value })}
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        <FaSearch />
      </button>
    </form>
  );
};

export default SearchInput;