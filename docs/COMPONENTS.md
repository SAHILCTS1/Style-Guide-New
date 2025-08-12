# Components Guide

This guide documents the UI components in `index.html`, their responsibilities, and their connections to functions in `script.js`.

## Layout
- Header: Branding and subtitle
- Main: Three sections (Taxonomy Navigator, Product Validation, Style Guide Output)
- Modal: Generated Style Guide dialog
- Footer: Version/date metadata
- Loading Overlay: Full-page loading mask while taxonomy loads

## Taxonomy Navigator
- Department (Level 1)
  - Select: `#department`
  - Count: `#dept-count`
  - Populated by: `populateDepartments()`
  - Changes handled by: `handleDepartmentChange()`

- Category (Level 2)
  - Select: `#category` (disabled until department chosen)
  - Count: `#cat-count`
  - Populated by: `populateCategories(department)`
  - Changes handled by: `handleCategoryChange()`

- Sub-category (Level 3)
  - Select: `#subcategory` (disabled until category chosen)
  - Count: `#subcat-count`
  - Populated by: `populateSubcategories(department, category)`
  - Changes handled by: `handleSubcategoryChange()`

- Product Type (Level 4)
  - Select: `#producttype` (disabled until sub-category chosen)
  - Count: `#prodtype-count`
  - Populated by: `populateProductTypes(department, category, subcategory)`
  - Changes handled by: `handleProductTypeChange()`

- Manual Product Type Entry
  - Input: `#manual-product`
  - Button: `#find-match` → `handleFindMatch()`
  - Results: `#match-results` populated by `displayMatches()` with `onclick="selectMatch(path)"`

- Selected Path & Generate
  - Breadcrumb: `#breadcrumb` → updated by `updateBreadcrumb()`
  - Generate Button: `#generate-taxonomy` (enabled by `updateGenerateButton()` when selection complete)
  - Hint: `.generate-hint`

## Product Validation
- Form fields
  - `#product-title`, `#product-description`, `#product-price`, `#product-brand`, `#product-material`, `#product-color`, `#product-size`, `#product-image`
  - Read by: `collectProductData()`

- Actions
  - Validate: `#validate-product` → `handleValidateProduct()`
  - Generate Style Guide (PDF): `#generate-styleguide` → `handleGenerateStyleGuide()` (enabled after successful validation)
  - Clear: `#clear-form` → `handleClearForm()`

- Suggestions & Results
  - Auto-suggestions panel: `#auto-suggestions` populated by `showAutoSuggestionsPanel()` → uses `onclick="applySuggestion(field,value)"`
  - Validation Results: `#validation-results` populated by `displayValidationResults()` or `showValidationMessage()`

## Style Guide Output (Inline)
- Output Container: `#style-guide-output`
  - Updated by: `updateStyleGuide()` → uses `generateStyleGuide()`

- Export Actions
  - Export JSON: `#export-json` → `exportData('json')`
  - Export CSV: `#export-csv` → `exportData('csv')`
  - Copy to Clipboard: `#copy-output` → `copyToClipboard()`
  - Enabled/Disabled by: `enableExportButtons()` / `disableExportButtons()`

## Modal: Generated Style Guide
- Overlay: `#styleguide-modal`
- Content: `#styleguide-content` → set by `showStyleGuideModal(generateTaxonomyStyleGuide())`
- Controls
  - Close (header): `#close-modal` → `closeStyleGuideModal()`
  - Close (footer): `#close-styleguide` → `closeStyleGuideModal()`
  - Download PDF: `#download-pdf` → `downloadStyleGuidePDF()`
  - Copy to Clipboard: `#copy-styleguide` → `copyStyleGuideContent()`

## Loading Overlay
- Element: `#loading-overlay`
- Controlled by: `showLoading(show)`

## Footer Metadata
- Taxonomy date: `#taxonomy-date` (populated in `loadTaxonomyData()` if available in the file header)

## Component Usage Notes
- Initialization
  - The app initializes via `DOMContentLoaded → initializeApp()`.
  - Ensure `taxonomy.txt` is served from the same origin to avoid CORS issues.

- Selection Flow
  - Each level enables the next; changing a level clears lower levels via `clearLowerLevels()` to keep the state consistent.

- Manual Matching
  - Use the manual entry if the product type is known but the category path is not; selecting a match populates all dropdowns and updates the breadcrumb.

- Validation & Generation
  - You must provide at least a product title or description to validate.
  - `Generate Style Guide` (PDF) becomes enabled after validation succeeds.
  - The `Generate Style Guide` button in the Taxonomy section opens a rich, taxonomy-driven modal guide; the button enables only when selection completeness rules are met (`updateGenerateButton()`).