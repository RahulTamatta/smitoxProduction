import { Modal } from "antd";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import OptimizedImage from "../../components/OptimizedImage";
import { api } from "../../context/auth";

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedPhoto, setUpdatedPhoto] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [updatedIsActive, setUpdatedIsActive] = useState(true);


  // handle Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Creating category...");

      const categoryData = new FormData();
      categoryData.append("name", name);
      categoryData.append("isActive", isActive);
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
        setIsActive(true);
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
      categoryData.append("isActive", updatedIsActive);
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
        setSelected(null);
        setUpdatedName("");
        setUpdatedPhoto(null);
        setUpdatedIsActive(true);
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
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="activeCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="activeCheck">Active</label>
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
                    <th scope="col">Status</th>
                    <th scope="col">Image</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories?.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>
                        <button
                          onClick={async () => {
                            // Optimistic Update
                            setCategories(prev => prev.map(cat =>
                              cat._id === c._id ? { ...cat, isActive: !cat.isActive } : cat
                            ));
                            try {
                              await api.patch(`/api/v1/category/toggle-category/${c._id}`);
                              toast.success("Status updated");
                            } catch (error) {
                              // Revert
                              setCategories(prev => prev.map(cat =>
                                cat._id === c._id ? { ...cat, isActive: !cat.isActive } : cat
                              ));
                              toast.error("Failed to update status");
                            }
                          }}
                          className={`btn btn-sm ${c.isActive ? 'btn-success' : 'btn-danger'}`}
                          style={{ width: '100px' }}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
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
                            setUpdatedIsActive(c.isActive !== undefined ? c.isActive : true);
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
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="updateActiveCheck"
                  checked={updatedIsActive}
                  onChange={(e) => setUpdatedIsActive(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="updateActiveCheck">Active</label>
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