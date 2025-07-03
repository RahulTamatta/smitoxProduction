import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/search";
import "./SearchInput.css";

const SearchInput = () => {
  const [values, setValues] = useSearch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.get(
        `/api/v1/product/search/${values.keyword}`
      );
      setValues({ ...values, results: data, keyword: "" });
      navigate("/search");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="search"
        placeholder="Search for products, brands and more"
        aria-label="Search"
        value={values.keyword}
        onChange={(e) =>
          setValues({ ...values, keyword: e.target.value })
        }
        className="search-input"
      />
      <button type="submit" className="search-button">
        <FaSearch />
      </button>
    </form>
  );
};

export default SearchInput;
