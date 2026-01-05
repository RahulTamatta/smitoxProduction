import { Modal } from "antd";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import { api } from "../../context/auth";

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedPhoto, setUpdatedPhoto] = useState(null);


  // handle Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Creating category...");

      const categoryData = new FormData();
      categoryData.append("name", name);
      if (photos) {
        categoryData.append("photo", photos);
      }

      const { data } = await api.post("/api/v1/category/create-category", categoryData);

      if (data?.success) {
        toast.dismiss();
        toast.success(`${name} is created`);
        getAllCategory();
        setName("");
        setPhotos(null);
      } else {
        toast.dismiss();
        toast.error(data.message || "Failed to create category");
      }
    } catch (error) {
      console.log(error);
      toast.dismiss();
      toast.error("Something went wrong in input form");
    }
  };

  // get all categories
  const getAllCategory = async () => {
    try {
      const { data } = await api.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong in getting category");
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // update category
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Updating category...");

      const categoryData = new FormData();
      categoryData.append("name", updatedName);
      if (updatedPhoto) {
        categoryData.append("photo", updatedPhoto);
      }

      const { data } = await api.put(
        `/api/v1/category/update-category/${selected._id}`,
        categoryData
      );

      if (data?.success) {
        toast.dismiss();
        toast.success(`${updatedName} is updated`);
        setSelected(null);
        setUpdatedName("");
        setUpdatedPhoto(null);
        setVisible(false);
        getAllCategory();
      } else {
        toast.dismiss();
        toast.error(data.message || "Failed to update category");
      }
    } catch (error) {
      console.log(error);
      toast.dismiss();
      toast.error("Something went wrong while updating");
    }
  };

  // delete category
  const handleDelete = async (pId) => {
    try {
      // Get token from localStorage
      const auth = JSON.parse(localStorage.getItem('auth')) || {};
      const token = auth.token;

      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      const { data } = await api.delete(`/api/v1/category/delete-category/${pId}`);
      if (data.success) {
        toast.success(`Category is deleted`);
        getAllCategory();
      } else {
        //toast.error(data.message);
      }
    } catch (error) {
      ////toast.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Dashboard - Create Category"}>
      <AdminMenu />
      <div className="container-fluid dashboard">
        <div className="row">
          <div className="col-md-12">
            <h1>Manage Category</h1>
            <div className="p-3 w-50">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter new category"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="btn btn-outline-secondary col-md-12">
                  {photos ? photos.name : "Upload Photo"}
                  <input
                    type="file"
                    name="photos"
                    accept="image/*"
                    onChange={(e) => setPhotos(e.target.files[0])}
                    hidden
                  />
                </label>
                {photos && (
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(photos)}
                      alt="category_photo"
                      height="200"
                      className="img img-responsive"
                    />
                  </div>
                )}
              </div>
              <div className="mb-3 d-flex gap-3">
                <button className="btn btn-primary" onClick={handleSubmit}>
                  Submit
                </button>
                <a
                  href="/dashboard/admin/create-sub-category"
                  className="btn btn-outline-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    // Assuming you have a router, or use standard navigation
                    window.location.href = '/dashboard/admin/create-sub-category';
                  }}
                >
                  Manage Subcategories
                </a>
              </div>
            </div>
            <div className="w-75">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Image</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories?.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>
                        {c.photos && (
                          <OptimizedImage
                            src={c.photos}
                            alt={c.name}
                            width={50}
                            height={50}
                            style={{ objectFit: "cover" }}
                          />
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary ms-2"
                          onClick={() => {
                            setVisible(true);
                            setUpdatedName(c.name);
                            setSelected(c);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger ms-2"
                          onClick={() => {
                            handleDelete(c._id);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Modal
              onCancel={() => setVisible(false)}
              footer={null}
              visible={visible}
            >
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter new category name"
                  value={updatedName}
                  onChange={(e) => setUpdatedName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="btn btn-outline-secondary col-md-12">
                  {updatedPhoto ? updatedPhoto.name : "Update Photo"}
                  <input
                    type="file"
                    name="photos"
                    accept="image/*"
                    onChange={(e) => setUpdatedPhoto(e.target.files[0])}
                    hidden
                  />
                </label>
                {updatedPhoto ? (
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(updatedPhoto)}
                      alt="category_photo"
                      height="200"
                      className="img img-responsive"
                    />
                  </div>
                ) : (
                  selected?.photos && (
                    <div className="text-center">
                      <OptimizedImage
                        src={selected.photos}
                        alt="category_photo"
                        height={200}
                        style={{ objectFit: 'contain' }}
                        className="img img-responsive"
                      />
                    </div>
                  )
                )}
              </div>
              <div className="mb-3">
                <button className="btn btn-primary" onClick={handleUpdate}>
                  Update
                </button>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateCategory;