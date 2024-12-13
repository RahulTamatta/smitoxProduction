import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useCategory from "../hooks/useCategory";
import Layout from "../components/Layout/Layout";
const Categories = () => {
  const categories = useCategory();
  return (
    <Layout title={"All Categories"}>
      <div className="container" style={{ marginTop: "100px" }}>
        <div className="row container">
          {categories.map((c) => (
            <div className="col-md-4 mt-5 mb-3 gx-3 gy-3" key={c._id}>
              <div className="card">
                <Link to={`/category/${c.slug}`} className="btn cat-btn">
                  {c.name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;




// import React, { useState, useEffect } from "react";
// import Layout from "./../../components/Layout/Layout";
// import AdminMenu from "./../../components/Layout/AdminMenu";
// import toast from "react-hot-toast";
// import axios from "axios";
// import CategoryForm from "../../components/Form/CategoryForm";
// import { Modal } from "antd";

// const CreateCategory = () => {
//   const [categories, setCategories] = useState([]);
//   const [name, setName] = useState("");
//   const [visible, setVisible] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [updatedName, setUpdatedName] = useState("");
//   const [subcategories, setSubcategories] = useState([]);
//   const [subcategoryName, setSubcategoryName] = useState("");

//   // Handle Form Submission for Creating or Updating Categories
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const formData = {
//         name,
//         subcategories,
//       };

//       const { data } = await axios.post("/api/v1/category/create-category", formData);

//       if (data?.success) {
//         toast.success(`${name} is created`);
//         getAllCategory();
//         setName(""); // Clear input field after submission
//         setSubcategories([]); // Clear subcategories after submission
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       console.log(error);
//       toast.error("Something went wrong in input form");
//     }
//   };

//   // Function to Fetch All Categories
//   const getAllCategory = async () => {
//     try {
//       const { data } = await axios.get("/api/v1/category/get-category");
//       if (data?.success) {
//         setCategories(data?.category);
//       }
//     } catch (error) {
//       console.log(error);
//       toast.error("Something went wrong in getting categories");
//     }
//   };

//   // useEffect to Fetch Categories on Component Mount
//   useEffect(() => {
//     getAllCategory();
//   }, []);

//   // Function to Update Category
//   const handleUpdate = async (e) => {
//     e.preventDefault();
//     try {
//       const { data } = await axios.put(
//         `/api/v1/category/update-category/${selected._id}`,
//         { name: updatedName, subcategories }
//       );
//       if (data?.success) {
//         toast.success(`${updatedName} is updated`);
//         setSelected(null);
//         setUpdatedName("");
//         setVisible(false);
//         getAllCategory();
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   // Function to Delete Category
//   const handleDelete = async (categoryId) => {
//     try {
//       const { data } = await axios.delete(
//         `/api/v1/category/delete-category/${categoryId}`
//       );
//       if (data.success) {
//         toast.success(`Category is deleted`);
//         getAllCategory();
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error("Something went wrong");
//     }
//   };

//   // Function to Add Subcategory
//   const handleAddSubcategory = () => {
//     if (subcategoryName.trim() !== "") {
//       setSubcategories([...subcategories, subcategoryName]);
//       setSubcategoryName("");
//     } else {
//       toast.error("Subcategory name cannot be empty");
//     }
//   };

//   return (
//     <Layout title={"Dashboard - Create Category"}>
//       <div className="container-fluid m-3 p-3 dashboard">
//         <div className="row">
//           <div className="col-md-3">
//             <AdminMenu />
//           </div>
//           <div className="col-md-9">
//             <h1>Manage Category</h1>
//             <div className="p-3 w-50">
//               <CategoryForm
//                 handleSubmit={handleSubmit}
//                 value={name}
//                 setValue={setName}
//                 subcategories={subcategories}
//                 setSubcategories={setSubcategories}
//               />
//               <div className="mt-3">
//                 <h4>Subcategories</h4>
//                 <input
//                   type="text"
//                   value={subcategoryName}
//                   onChange={(e) => setSubcategoryName(e.target.value)}
//                   placeholder="Add subcategory"
//                   className="form-control mb-2"
//                 />
//                 <button
//                   className="btn btn-primary"
//                   onClick={handleAddSubcategory}
//                 >
//                   Add Subcategory
//                 </button>
//                 <ul className="list-group mt-2">
//                   {subcategories.map((subcat, index) => (
//                     <li key={index} className="list-group-item">
//                       {subcat}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//             <div className="w-75">
//               <table className="table">
//                 <thead>
//                   <tr>
//                     <th scope="col">Name</th>
//                     <th scope="col">Subcategories</th>
//                     <th scope="col">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {categories?.map((c) => (
//                     <tr key={c._id}>
//                       <td>{c.name}</td>
//                       <td>
//                         {c.subcategories?.map((subcat, index) => (
//                           <span key={index} className="badge bg-secondary me-1">
//                             {subcat}
//                           </span>
//                         ))}
//                       </td>
//                       <td>
//                         <button
//                           className="btn btn-primary ms-2"
//                           onClick={() => {
//                             setVisible(true);
//                             setUpdatedName(c.name);
//                             setSelected(c);
//                             setSubcategories(c.subcategories || []);
//                           }}
//                         >
//                           Edit
//                         </button>
//                         <button
//                           className="btn btn-danger ms-2"
//                           onClick={() => {
//                             handleDelete(c._id);
//                           }}
//                         >
//                           Delete
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             <Modal
//               onCancel={() => setVisible(false)}
//               footer={null}
//               visible={visible}
//             >
//               <CategoryForm
//                 value={updatedName}
//                 setValue={setUpdatedName}
//                 handleSubmit={handleUpdate}
//                 subcategories={subcategories}
//                 setSubcategories={setSubcategories}
//               />
//               <div className="mt-3">
//                 <h4>Subcategories</h4>
//                 <input
//                   type="text"
//                   value={subcategoryName}
//                   onChange={(e) => setSubcategoryName(e.target.value)}
//                   placeholder="Add subcategory"
//                   className="form-control mb-2"
//                 />
//                 <button
//                   className="btn btn-primary"
//                   onClick={handleAddSubcategory}
//                 >
//                   Add Subcategory
//                 </button>
//                 <ul className="list-group mt-2">
//                   {subcategories.map((subcat, index) => (
//                     <li key={index} className="list-group-item">
//                       {subcat}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </Modal>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default CreateCategory;
