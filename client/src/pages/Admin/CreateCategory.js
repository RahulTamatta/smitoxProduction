import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import CategoryForm from "../../components/Form/CategoryForm";
import { Modal } from "antd";


import { Select } from "antd";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedPhoto, setUpdatedPhoto] = useState(null);

  // Upload to Cloudinary function
  const uploadToCloudinary = async (file) => {
    console.log('Starting Cloudinary upload for file:', file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'smitoxphoto');
      formData.append('cloud_name', 'djtiblazd');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/djtiblazd/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload successful, URL:', data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  // handle Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Creating category...");
      
      let photoUrl = "";
      if (photos) {
        photoUrl = await uploadToCloudinary(photos);
      }

      const { data } = await axios.post("/api/v1/category/create-category", {
        name,
        photos: photoUrl
      });

      if (data?.success) {
        toast.dismiss();
        toast.success(`${name} is created`);
        getAllCategory();
        setName("");
        setPhotos(null);
      } else {
        toast.dismiss();
        toast.error(data.message);
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
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting category");
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

      let photoUrl = "";
      if (updatedPhoto) {
        photoUrl = await uploadToCloudinary(updatedPhoto);
      }

      const { data } = await axios.put(
        `/api/v1/category/update-category/${selected._id}`,
        {
          name: updatedName,
          photos: photoUrl || selected.photos
        }
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
        toast.error(data.message);
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
      const { data } = await axios.delete(
        `/api/v1/category/delete-category/${pId}`
      );
      if (data.success) {
        toast.success(`Category is deleted`);
        getAllCategory();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Dashboard - Create Category"}>
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
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
              <div className="mb-3">
                <button className="btn btn-primary" onClick={handleSubmit}>
                  Submit
                </button>
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
                          <img
                            src={c.photos}
                            alt={c.name}
                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
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
                      <img
                        src={selected.photos}
                        alt="category_photo"
                        height="200"
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