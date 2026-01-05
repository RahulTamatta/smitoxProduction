import { useEffect, useState } from "react";
import { Button, Form, Modal, Table, ToggleButton } from "react-bootstrap";
import toast from "react-hot-toast";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import OptimizedImage from "../../components/OptimizedImage";
import { api } from "../../context/auth";

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


  // Get all categories for dropdown
  const getAllCategories = async () => {
    try {
      const { data } = await api.get("/api/v1/category/get-category");
      setCategories(data?.category || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      ////toast.error("Failed to load categories.");
    }
  };

  // Get all subcategories
  const getAllSubcategories = async () => {
    try {
      const { data } = await api.get("/api/v1/subcategory/get-subcategories");
      setSubcategories(data.subcategories || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      ////toast.error("Failed to load subcategories.");
      setLoading(false);
    }
  };

  // Create subcategory
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Creating subcategory...");

      const subcategoryData = new FormData();
      subcategoryData.append("name", name);
      subcategoryData.append("parentCategoryId", parentCategoryId);
      subcategoryData.append("isActive", isActive);
      if (photos) {
        subcategoryData.append("photo", photos);
      }

      const { data } = await api.post("/api/v1/subcategory/create-subcategory", subcategoryData);

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
        toast.error(data.message || "Failed to create subcategory");
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Failed to create subcategory.");
    }
  };

  // Update subcategory
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingSubcategory) return;

    try {
      toast.loading("Updating subcategory...");

      const subcategoryData = new FormData();
      subcategoryData.append("name", editName);
      subcategoryData.append("parentCategoryId", editParentCategoryId);
      subcategoryData.append("isActive", editIsActive);
      if (editPhotos) {
        subcategoryData.append("photo", editPhotos);
      }

      const { data } = await api.put(
        `/api/v1/subcategory/update-subcategory/${editingSubcategory._id}`,
        subcategoryData
      );

      if (data?.success) {
        toast.dismiss();
        toast.success(`${editName} updated successfully.`);
        setShowEditModal(false);
        getAllSubcategories();
      } else {
        toast.dismiss();
        toast.error(data.message || "Failed to update subcategory");
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Failed to update subcategory.");
    }
  };

  // Delete subcategory
  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/api/v1/subcategory/delete-subcategory/${id}`);
      if (data?.success) {
        toast.success("Subcategory deleted successfully.");
        getAllSubcategories();
      } else {
        //toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      ////toast.error("Failed to delete subcategory.");
    }
  };

  // Toggle subcategory status
  const toggleSubcategoryStatus = async (id, currentStatus) => {
    try {
      const { data } = await api.patch(
        `/api/v1/subcategory/toggle-subcategory/${id}`,
        { isActive: !currentStatus }
      );
      if (data?.success) {
        toast.success("Subcategory status updated.");
        getAllSubcategories();
      } else {
        //toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      ////toast.error("Failed to update status.");
    }
  };

  useEffect(() => {
    getAllCategories();
    getAllSubcategories();
  }, []);

  return (
    <Layout title="Dashboard - Subcategories">
      <AdminMenu />
      <div className="container-fluid dashboard">
        <div className="row">
          <div className="col-md-12">
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
            <div className="mt-5">
              <h3>Subcategory List</h3>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="admin-table-wrapper">
                  <Table striped bordered hover className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: "100px" }}>Image</th>
                        <th>Name</th>
                        <th>Parent Category</th>
                        <th style={{ width: "120px" }}>Status</th>
                        <th style={{ width: "150px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategories.map((subcategory) => (
                        <tr key={subcategory._id}>
                          <td style={{ textAlign: "center" }}>
                            <OptimizedImage
                              src={subcategory.photos}
                              alt={subcategory.name}
                              width={60}
                              height={60}
                              style={{ objectFit: "cover", borderRadius: "4px" }}
                            />
                          </td>
                          <td>{subcategory.name}</td>
                          <td>{categories.find((c) => c._id === subcategory.category)?.name || "N/A"}</td>
                          <td style={{ textAlign: "center" }}>
                            <ToggleButton
                              type="checkbox"
                              variant={subcategory.isActive ? "outline-success" : "outline-danger"}
                              checked={subcategory.isActive}
                              onChange={() => toggleSubcategoryStatus(subcategory._id, subcategory.isActive)}
                              size="sm"
                            >
                              {subcategory.isActive ? "Active" : "Inactive"}
                            </ToggleButton>
                          </td>
                          <td style={{ textAlign: "center" }}>
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
                              className="me-2"
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Edit Subcategory</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleUpdate}>
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
                          <OptimizedImage
                            src={editingSubcategory.photos}
                            alt="subcategory_photos"
                            height={200}
                            style={{ objectFit: 'contain' }}
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
