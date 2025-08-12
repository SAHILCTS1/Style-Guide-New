# Usage Examples

Practical examples for programmatic use (via browser console) and common user flows.

## Prerequisites
- Serve the project over a local web server (see root `README.md`), then open the app in a modern browser.
- Wait for the loading overlay to disappear (taxonomy loaded), or call `await initializeApp()` manually in the console.

## Programmatic Selection & Inline Style Guide
```js
// Initialize (if needed)
await initializeApp();

// Select a known taxonomy path (updates selects, breadcrumb, and style-guide readiness)
selectMatch('Apparel & Accessories > Clothing > Tops > T-Shirts');

// Render inline style guide content into the output section
updateStyleGuide();
```

## Manual Matching Flow (UI)
1. Type a product type into the “Manual Product Type Entry” field.
2. Click “Find Match” or press Enter.
3. Click a suggested path to auto-fill all dropdowns.

## Product Validation & PDF Generation
```js
// Fill product form inputs
productTitle = document.getElementById('product-title');
productDesc  = document.getElementById('product-description');
productTitle.value = 'Premium Cotton Crewneck T-Shirt';
productDesc.value  = 'Soft 100% cotton crewneck tee with classic fit and durable stitching.';

// Run validation (shows results in the Validation Results panel)
handleValidateProduct();

// If no errors are present, generate a comprehensive PDF style guide
handleGenerateStyleGuide();
```

## Taxonomy-Driven Modal Style Guide
```js
// Ensure all levels are selected (selectMatch is the easiest way)
selectMatch('Apparel & Accessories > Clothing > Tops > T-Shirts');

// Open modal style guide
handleGenerateTaxonomyStyleGuide();
```

## Exporting Structured Data
```js
// Export JSON file to disk
exportData('json');

// Export CSV file to disk
exportData('csv');

// Copy structured data JSON to clipboard (enabled after inline style guide is present)
copyToClipboard();
```

## PDF Status Helpers (optional)
```js
showPDFStatus('Preparing PDF…', 'info');
// ... when done or on error
hidePDFStatus();
```

## Utilities
```js
// Debounce a noisy function
const onInput = debounce((value) => console.log('User typed:', value), 300);
onInput('hello');

// Validate an image URL
isValidImageUrl('https://example.com/image.jpg'); // => true/false
```

## Error Handling Tips
- If taxonomy fails to load, check browser console for network/CORS errors and ensure a local server is used.
- If PDF generation fails, verify the jsPDF UMD script is reachable (see `<script>` tags in `index.html`).