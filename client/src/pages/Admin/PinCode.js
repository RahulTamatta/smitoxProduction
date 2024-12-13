import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactPaginate from 'react-paginate';

const PincodeList = () => {
  const [pincodes, setPincodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPincode, setSelectedPincode] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [newPincode, setNewPincode] = useState('');
  const [editedPincode, setEditedPincode] = useState({ code: '', isAvailable: true });

  useEffect(() => {
    fetchPincodes();
  }, []);

  const fetchPincodes = async () => {
    try {
      const { data } = await axios.get('/api/v1/pincodes/get-pincodes');
      if (data?.success) {
        setPincodes(data.pincodes);
      }
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong in getting pincodes');
    }
  };

  const handleSearch = async () => {
    try {
      const { data } = await axios.get(`/api/v1/pincodes/search-pincodes?keyword=${searchKeyword}`);
      if (data?.success) {
        setPincodes(data.results);
        setCurrentPage(0);
      }
    } catch (error) {
      console.log(error);
      toast.error('Error in searching pincodes');
    }
  };

  const handleAddPincode = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/v1/pincodes/create-pincode', { code: newPincode });
      if (data?.success) {
        toast.success(`${data.message}`);
        fetchPincodes();
        setShowAddModal(false);
        setNewPincode('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong');
    }
  };

  const handleEditPincode = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(`/api/v1/pincodes/update-pincode/${selectedPincode._id}`, editedPincode);
      if (data?.success) {
        toast.success(`${data.message}`);
        fetchPincodes();
        setShowEditModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong');
    }
  };

  const handleDeletePincode = async (id) => {
    try {
      const { data } = await axios.delete(`/api/v1/pincodes/delete-pincode/${id}`);
      if (data.success) {
        toast.success(`${data.message}`);
        fetchPincodes();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkUploadFile) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', bulkUploadFile);

    try {
      const { data } = await axios.post('/api/v1/pincodes/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        toast.success('Bulk upload completed');
        fetchPincodes();
        setShowBulkUploadModal(false);
        setBulkUploadFile(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong during bulk upload');
    }
  };

  const pageCount = Math.ceil(pincodes.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentItems = pincodes.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <main>
      <div className="container-fluid site-width">
        {/* Breadcrumbs */}
        <div className="row">
          <div className="col-12 align-self-center">
            <div className="sub-header mt-3 py-3 align-self-center d-sm-flex w-100 rounded">
              <div className="w-sm-100 mr-auto"><h4 className="mb-0">Pincode List</h4></div>
              <ol className="breadcrumb bg-transparent align-self-center m-0 p-0">
                <li className="breadcrumb-item">Master</li>
                <li className="breadcrumb-item">Pincode</li>
                <li className="breadcrumb-item active"><a href="#">Pincode table</a></li>
              </ol>
            </div>
          </div>
        </div>

        {/* Pincode Table */}
        <div className="row">
          <div className="col-12 mt-3">
            <div className="card">
              <div className="card-header justify-content-between align-items-center">
                <h4 className="card-title">
                  <Button variant="danger" onClick={() => setShowAddModal(true)}>
                    Add Pincode
                  </Button>
                  <Button variant="primary" className="ml-2" onClick={() => setShowBulkUploadModal(true)}>
                    Bulk Upload
                  </Button>
                </h4>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search pincodes..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <button onClick={handleSearch}>Search</button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table id="pincode" className="table layout-danger">
                    <thead>
                      <tr>
                        <th>Sr.No</th>
                        <th>Pincode</th>
                        <th>Availability Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((pincode, index) => (
                        <tr key={pincode._id}>
                          <td>{offset + index + 1}</td>
                          <td>{pincode.code}</td>
                          <td>{pincode.isAvailable ? 'Available' : 'Unavailable'}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm mr-2"
                              onClick={() => {
                                setSelectedPincode(pincode);
                                setEditedPincode({
                                  code: pincode.code,
                                  isAvailable: pincode.isAvailable
                                });
                                setShowEditModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeletePincode(pincode._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ReactPaginate
                  previousLabel={'Previous'}
                  nextLabel={'Next'}
                  breakLabel={'...'}
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={handlePageClick}
                  containerClassName={'pagination justify-content-center'}
                  pageClassName={'page-item'}
                  pageLinkClassName={'page-link'}
                  previousClassName={'page-item'}
                  previousLinkClassName={'page-link'}
                  nextClassName={'page-item'}
                  nextLinkClassName={'page-link'}
                  breakClassName={'page-item'}
                  breakLinkClassName={'page-link'}
                  activeClassName={'active'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Pincode Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Pincode</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddPincode}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Pincode</Form.Label>
              <Form.Control
                type="text"
                value={newPincode}
                onChange={(e) => setNewPincode(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Close</Button>
            <Button variant="primary" type="submit">Add</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Pincode Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Pincode</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditPincode}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Pincode</Form.Label>
              <Form.Control
                type="text"
                value={editedPincode.code}
                onChange={(e) => setEditedPincode({ ...editedPincode, code: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="checkbox"
                label="Available"
                checked={editedPincode.isAvailable}
                onChange={(e) => setEditedPincode({ ...editedPincode, isAvailable: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Close</Button>
            <Button variant="primary" type="submit">Update</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal show={showBulkUploadModal} onHide={() => setShowBulkUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bulk Upload Pincodes</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleBulkUpload}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Excel File</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setBulkUploadFile(e.target.files[0])}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBulkUploadModal(false)}>Close</Button>
            <Button variant="primary" type="submit">Upload</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </main>
  );
};

export default PincodeList;