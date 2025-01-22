import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Table, Spinner, Alert } from 'react-bootstrap';
import { PlusCircle, Pencil, Trash } from 'lucide-react';
import { toast } from 'react-toastify';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [formData, setFormData] = useState({
    bannerName: '',
    categoryId: '',
    subcategoryId: '',
    image: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/v1/bannerManagement/get-banners');
      
      setBanners(response.data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setError('Failed to fetch banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data.category || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      //toast.error("Something went wrong in getting categories");
      setCategories([]);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/subcategory/get-subcategories");
      if (data?.success) {
        setSubcategories(data.subcategories || []);
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.log(error);
      //toast.error("Something went wrong in getting subcategories");
      setSubcategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'categoryId') {
      const filteredSubcategories = subcategories.filter(
        (subcat) => subcat.category === value
      );
      setSubcategories(filteredSubcategories);
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
    }
  };

  const handleImageChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const uploadToCloudinary = async (file) => {
    console.log('Starting Cloudinary upload for file:', file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'smitoxphoto'); // Use your upload preset
      formData.append('cloud_name', 'djtiblazd'); // Use your cloud name

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = '';
      if (formData.image) {
        photoUrl = await uploadToCloudinary(formData.image);
      }

      const submitData = {
        bannerName: formData.bannerName,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId,
        photos: photoUrl || (currentBanner ? currentBanner.photos : '')
      };

      if (currentBanner) {
        await axios.put(`/api/v1/bannerManagement/update-banner/${currentBanner._id}`, submitData);
        toast.success('Banner updated successfully');
      } else {
        await axios.post('/api/v1/bannerManagement/create-banner', submitData);
        toast.success('Banner created successfully');
      }
      fetchBanners();
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting banner:', error);
      toast.error('Failed to submit banner');
    }
  };
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/v1/bannerManagement/delete-banner/${id}`);
      fetchBanners();
      toast.success('Banner deleted successfully');
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentBanner(null);
    setFormData({ bannerName: '', categoryId: '', subcategoryId: '', image: null });
  };

  const handleEdit = (banner) => {
    setCurrentBanner(banner);
    setFormData({
      bannerName: banner.bannerName,
      categoryId: banner.categoryId,
      subcategoryId: banner.subcategoryId,
      image: null
    });
    setShowEditModal(true);
  };

  return (
    <div className="container-fluid site-width">
      <div className="row">
        <div className="col-12 align-self-center">
          <div className="sub-header mt-3 py-3 align-self-center d-sm-flex w-100 rounded">
            <div className="w-sm-100 mr-auto"><h4 className="mb-0">Banner List</h4></div>
            <ol className="breadcrumb bg-transparent align-self-center m-0 p-0">
              <li className="breadcrumb-item">Master</li>
              <li className="breadcrumb-item">Banner</li>
              <li className="breadcrumb-item active"><a href="#">Banner table</a></li>
            </ol>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 mt-3">
          <div className="card">
            <div className="card-header justify-content-between align-items-center">
              <h4 className="card-title">
                <Button variant="danger" onClick={() => setShowAddModal(true)}>
                  <PlusCircle size={18} className="mr-2" />
                  Add Banner
                </Button>
              </h4>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                  </Spinner>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : banners.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Sr.No</th>
                        <th>Banner Name</th>
                        <th>Category</th>
                        <th>Subcategory</th>
                        <th>Image</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
      {banners.map((banner, index) => (
        <tr key={banner._id}>
          <td>{index + 1}</td>
          <td>{banner.bannerName}</td>
          <td>{banner.categoryId?.name}</td>
          <td>{banner.subcategoryId?.name}</td>
          <td>
            <img 
              src={banner.photos} 
              alt={banner.bannerName} 
              width="50" 
              className="img-thumbnail"
            />
          </td>
          <td>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => handleEdit(banner)} 
              className="mr-2"
            >
              <Pencil size={18} />
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => handleDelete(banner._id)}
            >
              <Trash size={18} />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">No banners found.</Alert>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={showAddModal || showEditModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{currentBanner ? 'Edit Banner' : 'Add Banner'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Category Name</Form.Label>
              <Form.Control as="select" name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>Subcategory Name</Form.Label>
              <Form.Control as="select" name="subcategoryId" value={formData.subcategoryId} onChange={handleInputChange} required>
                <option value="">Select a subcategory</option>
                {subcategories.map(subcategory => (
                  <option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>Banner Name</Form.Label>
              <Form.Control type="text" name="bannerName" value={formData.bannerName} onChange={handleInputChange} placeholder="Banner Name" required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Image</Form.Label>
              <Form.Control type="file" name="image" onChange={handleImageChange} accept="image/*" required={!currentBanner} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
            <Button variant="primary" type="submit">{currentBanner ? 'Update' : 'Add'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default BannerManagement;