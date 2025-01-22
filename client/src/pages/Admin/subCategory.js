import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import { Button, Form, Card, Row, Col, ToggleButton, Modal } from "react-bootstrap";
import toast from "react-hot-toast";

const SubcategoryList = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [photos, setPhotos] = useState(null);
  const [isActive, setIsActive] = useState(true);

  // States for Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editName, setEditName] = useState("");
  const [editParentCategoryId, setEditParentCategoryId] = useState("");
  const [editPhotos, setEditPhotos] = useState(null);
  const [editIsActive, setEditIsActive] = useState(true);

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

  // Fetch categories
  const getAllCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data.category);
      }
    } catch (error) {
      console.error(error);
      //toast.error("Failed to fetch categories.");
    }
  };

  // Fetch subcategories
  const getAllSubcategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/subcategory/get-subcategories");
      if (data?.success) {
        setSubcategories(data.subcategories);
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.error(error);
      //toast.error("Failed to fetch subcategories.");
    } finally {
      setLoading(false);
    }
  };

  // Create subcategory
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Creating subcategory...");

      let photoUrl = "";
      if (photos) {
        photoUrl = await uploadToCloudinary(photos);
      }

      const { data } = await axios.post("/api/v1/subcategory/create-subcategory", {
        name,
  parentCategoryId,
        photos: photoUrl
      });

      if (data?.success) {
        toast.dismiss();
        toast.success(`${name} created successfully.`);
        setName("");
        setParentCategoryId("");
        setPhotos(null);
        setIsActive(true);
        getAllSubcategories();
      } else {
        toast.dismiss();
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      //toast.error("Failed to create subcategory.");
    }
  };

  // Update subcategory
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Updating subcategory...");

      let photoUrl = "";
      if (editPhotos && editPhotos instanceof File) {
        photoUrl = await uploadToCloudinary(editPhotos);
      }

      const { data } = await axios.put(
        `/api/v1/subcategory/update-subcategory/${editingSubcategory._id}`,
        {
          name: editName,
          category: editParentCategoryId,
          photos: photoUrl || editingSubcategory.photos,
          isActive: editIsActive,
        }
      );
      
      if (data?.success) {
        toast.dismiss();
        toast.success(`${editName} updated successfully.`);
        setShowEditModal(false);
        getAllSubcategories();
      } else {
        toast.dismiss();
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      //toast.error("Failed to update subcategory.");
    }
  };

  // Delete subcategory
  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(`/api/v1/subcategory/delete-subcategory/${id}`);
      if (data?.success) {
        toast.success("Subcategory deleted successfully.");
        getAllSubcategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      //toast.error("Failed to delete subcategory.");
    }
  };

  // Toggle active status
  const handleToggleActive = async (subcategory) => {
    try {
      const { data } = await axios.put(`/api/v1/subcategory/toggle-active/${subcategory._id}`);
      if (data?.success) {
        toast.success("Subcategory status updated.");
        getAllSubcategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      //toast.error("Failed to update status.");
    }
  };

  useEffect(() => {
    getAllCategories();
    getAllSubcategories();
  }, []);

  return (
    <Layout title="Dashboard - Subcategories">
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Manage Subcategories</h1>

            {/* Create Subcategory */}
            <div className="p-3 mb-4">
              <h3>Create Subcategory</h3>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Subcategory Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Parent Category</Form.Label>
                  <Form.Control
                    as="select"
                    value={parentCategoryId}
                    onChange={(e) => setParentCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Select Parent Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
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
                        alt="subcategory_photos"
                        height="200"
                        className="img img-responsive"
                      />
                    </div>
                  )}
                </div>
                <Form.Check
                  type="checkbox"
                  label="Active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <Button variant="primary" type="submit" className="mt-3">
                  Add Subcategory
                </Button>
              </Form>
            </div>

            {/* Subcategory List */}
            <div>
              <h3>Subcategory List</h3>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <Row>
                  {subcategories.map((subcategory) => (
                    <Col key={subcategory._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                      <Card>
                        <Card.Img
                          variant="top"
                          src={subcategory.photos || "placeholder-image-url.jpg"}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                        <Card.Body>
                          <Card.Title>{subcategory.name}</Card.Title>
                          <Card.Text>
                            Parent: {categories.find((c) => c._id === subcategory.category)?.name || "N/A"}
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setEditingSubcategory(subcategory);
                                setEditName(subcategory.name);
                                setEditParentCategoryId(subcategory.category);
                                setEditPhotos(null);
                                setEditIsActive(subcategory.isActive);
                                setShowEditModal(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(subcategory._id)}
                            >
                              Delete
                            </Button>
                          </div>
                          <ToggleButton
                            className="mt-2"
                            type="checkbox"
                            variant={subcategory.isActive ? "outline-success" : "outline-danger"}
                            checked={subcategory.isActive}
                            onChange={() => handleToggleActive(subcategory)}
                          >
                            {subcategory.isActive ? "Active" : "Inactive"}
                          </ToggleButton>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Edit Subcategory</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleEditSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subcategory Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Parent Category</Form.Label>
                    <Form.Control
                      as="select"
                      value={editParentCategoryId}
                      onChange={(e) => setEditParentCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Select Parent Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                  <div className="mb-3">
                    <label className="btn btn-outline-secondary col-md-12">
                      {editPhotos ? editPhotos.name : "Update Photo"}
                      <input
                        type="file"
                        name="photos"
                        accept="image/*"
                        onChange={(e) => setEditPhotos(e.target.files[0])}
                        hidden
                      />
                    </label>
                    {editPhotos ? (
                      <div className="text-center">
                        <img
                          src={URL.createObjectURL(editPhotos)}
                          alt="subcategory_photos"
                          height="200"
                          className="img img-responsive"
                        />
                      </div>
                    ) : (
                      editingSubcategory?.photos && (
                        <div className="text-center">
                          <img
                            src={editingSubcategory.photos}
                            alt="subcategory_photos"
                            height="200"
                            className="img img-responsive"
                          />
                        </div>
                      )
                    )}
                  </div>
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  <Button variant="primary" type="submit" className="mt-3">
                    Update Subcategory
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default SubcategoryList;
