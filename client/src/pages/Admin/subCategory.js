import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import { Button, Form, Card, Row, Col, ToggleButton, Modal } from 'react-bootstrap';
import toast from "react-hot-toast";

const SubcategoryList = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [photo, setPhoto] = useState(null);
  const [isActive, setIsActive] = useState(true);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editName, setEditName] = useState("");
  const [editParentCategoryId, setEditParentCategoryId] = useState("");
  const [editPhoto, setEditPhoto] = useState(null);
  const [editIsActive, setEditIsActive] = useState(true);
  // Toggle confirmation states
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [toggleSubcategory, setToggleSubcategory] = useState(null);

  // Get all categories
  const getAllCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting categories");
    }
  };





  
  // Get all subcategories
  const getAllSubcategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/subcategory/get-subcategories");
      if (data?.success) {
        setSubcategories(data?.subcategories || []);
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting subcategories");
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };


  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    getAllCategories();
    getAllSubcategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // const formData = new FormData();
      // formData.append("name", name);
      // formData.append("category", parentCategoryId);
      // if (photo) formData.append("photo", photo);

      const { data } = await axios.post("/api/v1/subcategory/create-subcategory", {name,parentCategoryId,photo});
      if (data?.success) {
        toast.success(`${name} is created`);
        setName("");
        setParentCategoryId("");
        setPhoto(null);
        getAllSubcategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in creating subcategory");
    }
  };

  const handleDelete = async (pId) => {
    try {
      const { data } = await axios.delete(`/api/v1/subcategory/delete-subcategory/${pId}`);
      if (data.success) {
        toast.success(`Subcategory is deleted`);
        getAllSubcategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleEdit = (subcategory) => {
    setEditingSubcategory(subcategory);
    setEditName(subcategory.name);
    setEditParentCategoryId(subcategory.category);
    setEditPhoto(subcategory.photo);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editName,
        category: editParentCategoryId,
        isActive: editIsActive
      };

      if (editPhoto) {
        updateData.photo = editPhoto;
      }

      const { data } = await axios.put(
        `/api/v1/subcategory/update-subcategory/${editingSubcategory._id}`,
        updateData
      );

      if (data.success) {
        toast.success(`${editName} subcategory updated successfully`);
        setShowEditModal(false);
        setEditName("");
        setEditParentCategoryId("");
        setEditPhoto(null);
        setEditIsActive(true);
        getAllSubcategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong while updating subcategory");
    }
  };

  const handleToggleActive = async (subcategory) => {
    try {
      const { data } = await axios.put(`/api/v1/subcategory/toggle-active/${subcategory._id}`);
      if (data.success) {
        toast.success(`Subcategory status updated`);
        getAllSubcategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong while toggling subcategory status");
    }
  };

  const confirmToggleActive = async () => {
    try {
      const { data } = await axios.put(`/api/v1/subcategory/toggle-active/${toggleSubcategory._id}`, {
        isActive: !toggleSubcategory.isActive
      });
      if (data.success) {
        toast.success(`Subcategory status updated`);
        getAllSubcategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setShowToggleConfirm(false);
    }
  };



  
  return (
    <Layout title={"Dashboard - Subcategories"}>
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Manage Subcategories</h1>
            
            {/* Add Subcategory Form */}
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
                <Form.Group className="mb-3">
                  <Form.Label>Subcategory Image</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleImageChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    label="Active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
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
                  {subcategories.map((s) => (
                    <Col key={s._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                      <Card>
                        <Card.Img 
                          variant="top" 
                          src={s.photo || 'placeholder-image-url.jpg'} 
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                        <Card.Body>
                          <Card.Title>{s.name}</Card.Title>
                          <Card.Text>
                            Parent: {categories.find(c => c._id === s.category)?.name || 'N/A'}
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center">
                            <Button variant="primary" size="sm" onClick={() => handleEdit(s)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(s._id)}>
                              Delete
                            </Button>
                          </div>
                          <div className="mt-2">
                            <ToggleButton
                              id={`toggle-${s._id}`}
                              type="checkbox"
                              variant={s.isActive ? "outline-success" : "outline-danger"}
                              checked={s.isActive}
                              value="1"
                              onChange={() => handleToggleActive(s)}
                            >
                              {s.isActive ? "Active" : "Inactive"}
                            </ToggleButton>
                          </div>
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
                  <Form.Group className="mb-3">
                    <Form.Label>Subcategory Image</Form.Label>
                    {editPhoto && (
                      <img 
                        src={editPhoto} 
                        alt="Current subcategory" 
                        style={{ width: '100px', height: '100px', objectFit: 'cover', marginBottom: '10px' }} 
                      />
                    )}
                    <Form.Control
                      type="file"
                      onChange={handleEditImageChange}
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Update Subcategory
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>

            {/* Toggle Confirmation Modal */}
            <Modal show={showToggleConfirm} onHide={() => setShowToggleConfirm(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Status Change</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Are you sure you want to change the status of this subcategory?
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowToggleConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={confirmToggleActive}>
                  Confirm
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubcategoryList;