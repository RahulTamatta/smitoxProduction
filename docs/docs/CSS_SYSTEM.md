# CSS & Styling Architecture

The Smitox web platform employs a hybrid styling strategy, combining global CSS, utility classes from major frameworks, and component-specific stylesheets.

## 1. UI Frameworks & Design Systems
The project currently has a heavy dependency footprint regarding CSS frameworks, resulting in a mix of styling paradigms:
- **Bootstrap 5 / React Bootstrap**: Forms the backbone of the grid system (`container`, `row`, `col`) and responsive layouts.
- **Ant Design (antd)**: Primarily used in the Admin dashboard and complex interactive components (e.g., DataTables, Modals, Pagination, Date Pickers).
- **MDB React UI Kit (Material Design for Bootstrap)**: Used for modern, material-style cards, inputs, and buttons on the customer-facing side.
- **Material UI (@mui/material)**: Present in the dependencies, likely used for specific icons or legacy components.

*Note: The presence of Bootstrap, Ant Design, and MUI simultaneously is a significant performance bottleneck due to overlapping utility classes and conflicting CSS resets. A UI audit to standardize on a single framework is highly recommended.*

## 2. Custom CSS Structure
Custom styles are located in `client/src/styles/` and follow a standard monolithic/component-hybrid approach rather than CSS Modules.

### Key Files
- `admin-theme.css`: A massive 25KB+ stylesheet specifically dedicated to overriding Ant Design/Bootstrap defaults to create the custom look and feel for the Admin/Seller dashboard. It handles sidebar transitions, dark mode tables, and custom form inputs.
- `Homepage.css`: Scoped styles specifically for the `HomePage.jsx` layout, including hero banner adjustments and responsive grid overrides.
- `ProductDetailsStyles.css`: Custom flexbox layouts and image gallery styling for the product description page.
- `AuthStyles.css`: Custom styling for the Login/Registration forms, likely handling background images and glassmorphism effects.

## 3. Styling Methodology
- **No SCSS/SASS**: The project relies purely on vanilla CSS. There are no preprocessors in use.
- **No CSS Modules**: Stylesheets are imported globally at the component level (`import '../styles/CartStyles.css'`), which means class names must be unique to avoid global scope bleed.
- **No Tailwind**: Despite modern trends, Tailwind CSS is NOT used in this project. All custom styling is done via explicit class names mapped to standard CSS files.

## 4. Responsive Breakpoints
The system relies on Bootstrap's standard breakpoints:
- `xs`: < 576px (Mobile Portrait)
- `sm`: ≥ 576px (Mobile Landscape)
- `md`: ≥ 768px (Tablets)
- `lg`: ≥ 992px (Small Laptops)
- `xl`: ≥ 1200px (Desktops)
- `xxl`: ≥ 1400px (Large Screens)

## 5. Performance & Technical Debt
- **Duplication**: Because multiple frameworks are installed, there is likely a high amount of unused CSS shipped to the client.
- **Z-Index Management**: Global z-indexes are manually managed in files like `admin-theme.css`. This can lead to stacking context issues between Ant Design modals and custom navigation bars.
