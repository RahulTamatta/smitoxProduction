# Smitox Web App Search Architecture

This document outlines how the real-time search functionality is implemented across different sections of the Smitox B2B web application, particularly focusing on the `UsersLists` admin dashboard as a primary example.

## 1. Frontend Implementation (React)

The frontend search relies on a combination of controlled inputs, debouncing, and URL synchronization to provide a seamless user experience.

### Controlled Inputs & State Management
In components like `userCartLists.jsx`, search is managed using React state:
```javascript
const [searchTerm, setSearchTerm] = useState("");
const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
```

The user's input directly updates `searchTerm` via the `onChange` handler of the text input.

### Debouncing (Performance Optimization)
To prevent overwhelming the backend server with an API request for every single keystroke, the application employs a **300ms debounce timer** using a `useEffect` hook.

```javascript
useEffect(() => {
  const debounceTimer = setTimeout(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 300);

  return () => clearTimeout(debounceTimer);
}, [searchTerm]);
```
This ensures that the actual data fetch (which is triggered when `debouncedSearchTerm` changes) only happens after the user has stopped typing for 300 milliseconds.

### URL Synchronization
To support direct linking and browser history navigation, the search term is synchronized with the URL query parameters (`?search=...`). When the page loads, the component reads the `search` param from the URL to initialize the state. As the user types, `window.history.replaceState` is used to update the URL without triggering full page reloads.

## 2. Backend Implementation (Node.js/Express & MongoDB)

The backend controller (e.g., `userController.js`) receives the `search` query parameter and constructs a dynamic MongoDB query to filter the database collections.

### Full-Text Search via Regular Expressions
The backend uses MongoDB's `$regex` operator to perform case-insensitive, partial-match searches across multiple fields simultaneously.

```javascript
searchQuery = {
  $or: [
    { user_fullname: { $regex: search, $options: 'i' } },
    { email_id: { $regex: search, $options: 'i' } },
    { address: { $regex: search, $options: 'i' } }
  ]
};
```
The `$options: 'i'` flag ensures the search is case-insensitive (e.g., "john" matches "John"). The `$or` operator allows the user to find a match in *any* of the specified fields.

### Intelligent Numeric Handling (Phone Numbers)
One of the most complex aspects of the search architecture is handling numeric inputs, such as phone numbers, which might be stored as either Numbers or Strings in the database. 

The backend first checks if the incoming search query consists only of digits using a regex test (`/^\d+$/.test(search)`). If it is numeric, the query expands to cover all possible storage types:

```javascript
const isNumeric = /^\d+$/.test(search);
if (isNumeric) {
  searchQuery = {
    $or: [
      // Standard text fields
      { user_fullname: { $regex: search, $options: 'i' } },
      { email_id: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      
      // Phone number variations
      { mobile_no: { $regex: search, $options: 'i' } }, // If stored as searchable string
      { mobile_no: Number(search) }, // Exact numeric match
      { mobile_no: { $type: "string", $regex: search } }, // Explicit string regex
      { mobile_no: { $type: "number", $eq: Number(search) } } // Explicit number match
    ]
  };
}
```
This robust type-checking ensures that no matter how legacy data is formatted in MongoDB, the search will accurately find the target user.

## 3. Summary of Data Flow
1. User types in the UI (Updates `searchTerm`).
2. 300ms passes without typing (Updates `debouncedSearchTerm`).
3. `useEffect` triggers an API call (`axios.get`) with the search query.
4. Express route forwards the query to the controller.
5. Controller builds an `$or` + `$regex` query (with intelligent numeric parsing).
6. MongoDB executes the query.
7. Controller returns the paginated data.
8. React updates `filteredUsers` state and renders the table.
