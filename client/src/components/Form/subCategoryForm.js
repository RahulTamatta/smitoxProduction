import React from "react";
import { Form, Button } from 'react-bootstrap';

const SubcategoryForm = ({ handleSubmit, name, setName, parentCategoryId, setParentCategoryId, categories, setImage }) => {
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  return (
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
      <Button variant="primary" type="submit">
        Add Subcategory
      </Button>
    </Form>
  );
};

export default SubcategoryForm;