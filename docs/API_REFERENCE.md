# API Reference

This document describes all public (global) functions exposed by `script.js`, grouped by feature area. Functions are available on the page scope once `index.html` loads and `initializeApp()` runs.

Note: Many functions rely on DOM elements present in `index.html` and on global state objects: `taxonomyData`, `taxonomyTree`, and `currentSelection`.

## Initialization & State

- initializeApp()
  - Description: Bootstraps the app. Loads taxonomy, builds the tree, populates UI, and registers event listeners.
  - Returns: Promise<void>
  - Side effects: Updates DOM, global state, and logs errors if any.
  - Example:
    ```js
    document.addEventListener('DOMContentLoaded', initializeApp);
    ```

- loadTaxonomyData()
  - Description: Fetches `taxonomy.txt`, parses hierarchical paths, and sets `taxonomyData`. Updates `#taxonomy-date` if present.
  - Returns: Promise<void>
  - Throws: Error on fetch/parse failures.

- buildTaxonomyTree()
  - Description: Builds `taxonomyTree` from `taxonomyData` with counts and sets of product types.
  - Returns: void

- currentSelection
  - Shape: `{ department: string, category: string, subcategory: string, producttype: string }`
  - Description: Tracks the user’s active taxonomy selection across levels.

## UI Population (Taxonomy)

- populateDepartments()
  - Description: Populates the Level 1 `#department` dropdown; updates department count.
  - Returns: void

- populateCategories(department)
  - Params: `department: string`
  - Description: Populates Level 2 `#category` and updates count; disables if none.
  - Returns: void

- populateSubcategories(department, category)
  - Params: `department: string, category: string`
  - Description: Populates Level 3 `#subcategory` and updates count; disables if none.
  - Returns: void

- populateProductTypes(department, category, subcategory)
  - Params: `department: string, category: string, subcategory: string`
  - Description: Populates Level 4 `#producttype` and updates count; disables if none.
  - Returns: void

- clearLowerLevels(levels)
  - Params: `levels: string[]` of lower-level select IDs to reset/disable
  - Description: Clears options, disables selects, and resets counters for lower levels.
  - Returns: void

## Event Wiring & Handlers

- setupEventListeners()
  - Description: Registers all UI event handlers (dropdown changes, validate, generate, export, modal controls, etc.).
  - Returns: void

- handleDepartmentChange(e), handleCategoryChange(e), handleSubcategoryChange(e), handleProductTypeChange(e)
  - Params: `e: Event`
  - Description: Update `currentSelection`, repopulate dependent levels, and refresh breadcrumb/style-guide.
  - Returns: void

## Search & Matching

- handleFindMatch()
  - Description: Reads `#manual-product`, finds similar product types, and displays results.
  - Returns: void

- findSimilarProducts(query)
  - Params: `query: string`
  - Description: Fuzzy-matches product types using Levenshtein-based similarity; returns top 10.
  - Returns: `{ item, similarity, score }[]`

- calculateSimilarity(str1, str2)
  - Params: `str1: string, str2: string`
  - Description: Normalized Levenshtein similarity in [0,1].
  - Returns: number

- displayMatches(matches)
  - Params: `matches: Array<{ item, similarity, score }>`
  - Description: Renders clickable matches in `#match-results`.
  - Returns: void

- selectMatch(fullPath)
  - Params: `fullPath: string` (e.g., "Apparel & Accessories > Clothing > Tops > T-Shirts")
  - Description: Sets `currentSelection` and all selects to match the path; updates UI.
  - Returns: void

## Breadcrumb & Action Enablement

- updateBreadcrumb()
  - Description: Updates `#breadcrumb` and calls `updateGenerateButton()`.
  - Returns: void

- updateGenerateButton()
  - Description: Enables/disables `#generate-taxonomy` and shows hint based on selection completeness.
  - Returns: void

- getAvailableTaxonomyLevels()
  - Description: Returns which levels are available given current tree and selection.
  - Returns: `{ department: boolean, category: boolean, subcategory: boolean, producttype: boolean }`

- isSelectionComplete(availableLevels)
  - Params: `availableLevels: ReturnType<typeof getAvailableTaxonomyLevels>`
  - Returns: boolean

- getMissingLevels(availableLevels)
  - Returns: string[] of human-readable level names that must still be selected.

- getDeepestLevelValue()
  - Description: Returns most specific selected value; falls back to 'Product'.
  - Returns: string

- generateBreadcrumbNavigation()
  - Returns: string breadcrumb like `Home > Department > ...`.

## Validation & SEO

- handleValidateProduct()
  - Description: Collects product form data and runs enhanced validation; updates UI and enables `Generate Style Guide` when no errors.
  - Returns: void

- collectProductData()
  - Description: Reads all product form fields into an object.
  - Returns: `{ title, description, price, brand, material, color, size, image }`

- performEnhancedValidation(productData)
  - Params: `productData: ReturnType<typeof collectProductData>`
  - Description: Aggregates multiple validations (category, SEO, Google standards, required fields, suggestions). Enables/disables `#generate-styleguide` accordingly.
  - Returns: `Array<{ type: 'success'|'warning'|'error', message: string }>`

- getRequiredFieldsForCategory()
  - Description: Heuristic required fields based on selected department.
  - Returns: string[]

- getStandardizedAttributes()
  - Description: Suggestible standardized values (materials, colors, etc.) based on department.
  - Returns: Record<string, string[]>

- validateGoogleStandards(productData, results)
  - Description: Pushes messages into `results` based on title length, description length, price format, and image URL validity.
  - Returns: void

- validateRequiredFields(productData, requiredFields, results)
  - Returns: void

- suggestMissingAttributes(productData, standardizedAttributes, results)
  - Side effects: Calls `showAutoSuggestionsPanel` when suggestions exist.
  - Returns: void

- showAutoSuggestionsPanel(suggestions)
  - Params: `suggestions: Array<{ field: string, suggestions: string[] }>`
  - Description: Renders suggestions with `onclick="applySuggestion(field,value)"`.
  - Returns: void

- applySuggestion(fieldName, value)
  - Description: Writes a suggestion into the field `#product-${fieldName}`, re-validates shortly after.
  - Returns: void

- calculateEnhancedSEOScore(productData)
  - Description: 0–100 score based on taxonomy keyword presence and content completeness.
  - Returns: number

- showValidationMessage(message, type)
  - Description: Renders a single validation message with visual state.
  - Returns: void

## Style Guide Generation (Modal and Inline)

- handleGenerateTaxonomyStyleGuide()
  - Description: Validates level completeness and opens modal with taxonomy-driven guide.
  - Returns: void

- generateTaxonomyStyleGuide()
  - Description: Returns a complete HTML fragment for the modal based on current selection.
  - Returns: string (HTML)

- getCategorySpecificGuidelines()
  - Description: HTML snippets tailored for major departments.
  - Returns: string (HTML)

- showStyleGuideModal(content)
  - Params: `content: string` (HTML)
  - Description: Fills `#styleguide-content`, shows modal, prevents body scroll.
  - Returns: void

- closeStyleGuideModal()
  - Description: Hides modal and restores body scroll.
  - Returns: void

- downloadStyleGuidePDF()
  - Description: Generates a simple product object from current selection and calls `generateComprehensivePDF`.
  - Returns: void

- copyStyleGuideContent()
  - Description: Copies visible modal text content to clipboard; falls back to `execCommand('copy')`.
  - Returns: void

## PDF Generation

- handleGenerateStyleGuide()
  - Description: Validates prerequisites then calls `generateComprehensivePDF(productData)`.
  - Returns: void

- generateComprehensivePDF(productData)
  - Params: `{ title, description, price, brand, material, color, size, image }`
  - Description: Uses `jsPDF` to create a multi-section Style Guide PDF; saves file; shows transient status messages.
  - Returns: Promise<void>
  - Throws: Error if jsPDF UMD not loaded.

- showPDFStatus(message, type)
  - Description: Shows transient status toast for PDF operations.
  - Returns: void

- hidePDFStatus()
  - Description: Hides status toast.
  - Returns: void

## Inline Style Guide (Main Output)

- updateStyleGuide()
  - Description: Writes placeholder or full guide into `#style-guide-output`; toggles export buttons.
  - Returns: void

- generateStyleGuide()
  - Description: Returns complete HTML for inline output with product overview, media, specs, size/fit, cross-selling, engagement, and shelf placement.
  - Returns: string (HTML)

- generateProductOverview(), generateVisualMediaAssets(), generateProductSpecifications(), generateSizeFitGuidance(), generateCrossSellingPersonalization(), generateCustomerEngagement(), generateDiscoverabilityShelfPlacement()
  - Description: Section builders returning HTML fragments used by `generateStyleGuide()`.
  - Returns: string (HTML)

- generateProductOverviewForModal(), generateVisualMediaAssetsForModal(), generateProductAttributesForModal(), generateSizeFitGuidanceForModal(), generateCrossSellingPersonalizationForModal(), generateCustomerEngagementForModal(), generateDiscoverabilityShelfPlacementForModal()
  - Description: Modal-specific section builders.
  - Returns: string (HTML)

## Intelligent Content & Data Providers

- getProductOverviewData(), getVisualMediaAssetsData(), getProductSpecificationsData(), getSizeFitGuidanceData(), getCrossSellingPersonalizationData(), getCustomerEngagementData(), getDiscoverabilityShelfPlacementData()
  - Description: Return content tailored to current selection/product type.
  - Returns: Typed objects used by section builders.

- generateProductSpecificContent(productType, department, category, subcategory, categoryId)
  - Description: Creates realistic product content examples for common product types.
  - Returns: `{ title, shortDescription, keyFeatures: string[], categoryId: number, certifications: string[] }`

- generateCategoryManagerInstructions(), generateVisualMediaInstructions(), generateProductAttributeInstructions(), generateSizeFitInstructions(), getStandardizedProductAttributes(), getIntelligentCrossSellingRecommendations(), getIntelligentCustomerEngagementData()
  - Description: Produce detailed, category-aware guidance/metadata used in modal and attributes sections.

## Structured Data, Export & Clipboard

- getCurrentPath()
  - Returns: string like `Department > Category > Sub-category > Product Type`.

- getCurrentPathKeywords()
  - Returns: Comma-separated keywords derived from current path.

- getStructuredData()
  - Returns: JSON-LD style object with category, classification, and SEO recommendations.

- exportData(format)
  - Params: `format: 'json'|'csv'`
  - Description: Exports structured data via file download.
  - Returns: void

- convertToCSV(data)
  - Description: Converts structured data into a simple two-column CSV.
  - Returns: string (CSV)

- downloadFile(content, filename, contentType)
  - Description: Triggers browser download for given content.
  - Returns: void

- copyToClipboard()
  - Description: Copies structured data to clipboard; falls back to hidden textarea.
  - Returns: void

## Utilities & UX

- debounce(func, wait)
  - Description: Debounces a function by `wait` ms.
  - Returns: `(…args) => void`

- showTemporaryMessage(message)
  - Description: Shows and auto-dismisses a toast message.
  - Returns: void

- enableExportButtons(), disableExportButtons()
  - Description: Toggle state of export buttons.
  - Returns: void

- updateCount(elementId, count)
  - Description: Updates the visible count text for filter options.
  - Returns: void

- showLoading(show)
  - Params: `show: boolean`
  - Description: Shows/hides full-page loading overlay.
  - Returns: void

- showError(message)
  - Description: Renders error message in `#validation-results`.
  - Returns: void

- isValidImageUrl(url)
  - Description: Validates URL format and typical image file extensions.
  - Returns: boolean

## Programmatic Usage Examples

- Select a taxonomy path and generate inline style guide
  ```js
  await initializeApp();
  selectMatch('Apparel & Accessories > Clothing > Tops > T-Shirts');
  updateStyleGuide();
  ```

- Validate a product and generate a PDF
  ```js
  document.getElementById('product-title').value = 'Premium Cotton T-Shirt';
  document.getElementById('product-description').value = 'Soft 100% cotton tee for everyday wear.';
  handleValidateProduct();
  handleGenerateStyleGuide();
  ```

- Export structured data
  ```js
  exportData('json');
  exportData('csv');
  ```