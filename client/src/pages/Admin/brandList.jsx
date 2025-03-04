import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Modal, Button, Form, Table } from "react-bootstrap";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import BrandForm from "../../components/Form/brandForm";

const CreateBrand = () => {
  const [brands, setBrands] = useState([]);
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");

  // Fetch all brands
  const getAllBrands = async () => {
    try {
      const { data } = await axios.get("/api/v1/brand/get-brands");
      if (data?.success) {
        setBrands(data?.brands);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong in getting brands");
    }
  };

  useEffect(() => {
    getAllBrands();
  }, []);

  // Handle brand creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/v1/brand/create-brand", { name });
      if (data?.success) {
        //toast.success(`${name} is created`);
        getAllBrands();
        setName("");
      } else {
        //toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong in input form");
    }
  };

  // Handle brand update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(`/api/v1/brand/update-brand/${selected._id}`, { name: updatedName });
      if (data?.success) {
        //toast.success(`${updatedName} is updated`);
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
        getAllBrands();
      } else {
        //toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong while updating");
    }
  };

  // Handle brand deletion
  const handleDelete = async (bId) => {
    try {
      const { data } = await axios.delete(`/api/v1/brand/delete-brand/${bId}`);
      if (data.success) {
        //toast.success(`Brand is deleted`);
        getAllBrands();
      } else {
        //toast.error(data.message);
      }
    } catch (error) {
      ////toast.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Dashboard - Brands"}>
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Manage Brands</h1>

            {/* Create Brand Form */}
            <div className="p-3 mb-4">
              <h3>Create Brand</h3>
              <BrandForm handleSubmit={handleSubmit} value={name} setValue={setName} />
            </div>

            {/* Brand List */}
            <div>
              <h3>Brand List</h3>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands?.map((b) => (
                    <tr key={b._id}>
                      <td>{b.name}</td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setVisible(true);
                            setUpdatedName(b.name);
                            setSelected(b);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(b._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Edit Modal */}
            <Modal show={visible} onHide={() => setVisible(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Edit Brand</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleUpdate}>
                  <Form.Group className="mb-3">
                    <Form.Label>Brand Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={updatedName}
                      onChange={(e) => setUpdatedName(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Update Brand
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

export default CreateBrand;
