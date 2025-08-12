// Global variables
let taxonomyData = [];
let taxonomyTree = {};
let currentSelection = {
    department: '',
    category: '',
    subcategory: '',
    producttype: ''
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading(true);
        await loadTaxonomyData();
        buildTaxonomyTree();
        populateDepartments();
        setupEventListeners();
        showLoading(false);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load taxonomy data. Please refresh the page.');
        showLoading(false);
    }
}

// Load taxonomy data from file
async function loadTaxonomyData() {
    try {
        const response = await fetch('taxonomy.txt');
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        taxonomyData = lines.map(line => {
            const parts = line.split(' > ');
            return {
                fullPath: line.trim(),
                parts: parts,
                level: parts.length,
                department: parts[0] || '',
                category: parts[1] || '',
                subcategory: parts[2] || '',
                producttype: parts[3] || ''
            };
        });

        // Update taxonomy date
        const dateMatch = text.match(/# Google_Product_Taxonomy_Version: (\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            document.getElementById('taxonomy-date').textContent = dateMatch[1];
        }
        
        console.log(`Loaded ${taxonomyData.length} taxonomy entries`);
    } catch (error) {
        throw new Error('Failed to load taxonomy file: ' + error.message);
    }
}

// Build hierarchical tree structure
function buildTaxonomyTree() {
    taxonomyTree = {};
    
    taxonomyData.forEach(item => {
        if (!taxonomyTree[item.department]) {
            taxonomyTree[item.department] = {
                categories: {},
                count: 0
            };
        }
        
        taxonomyTree[item.department].count++;
        
        if (item.category) {
            if (!taxonomyTree[item.department].categories[item.category]) {
                taxonomyTree[item.department].categories[item.category] = {
                    subcategories: {},
                    count: 0
                };
            }
            
            taxonomyTree[item.department].categories[item.category].count++;
            
            if (item.subcategory) {
                if (!taxonomyTree[item.department].categories[item.category].subcategories[item.subcategory]) {
                    taxonomyTree[item.department].categories[item.category].subcategories[item.subcategory] = {
                        producttypes: new Set(),
                        count: 0
                    };
                }
                
                taxonomyTree[item.department].categories[item.category].subcategories[item.subcategory].count++;
                
                if (item.producttype) {
                    taxonomyTree[item.department].categories[item.category].subcategories[item.subcategory].producttypes.add(item.producttype);
                }
            }
        }
    });
    
    console.log('Taxonomy tree built successfully');
}

// Populate department dropdown
function populateDepartments() {
    const deptSelect = document.getElementById('department');
    const departments = Object.keys(taxonomyTree).sort();
    
    // Clear existing options except the first one
    deptSelect.innerHTML = '<option value="">Select Department...</option>';
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptSelect.appendChild(option);
    });
    
    updateCount('dept-count', departments.length);
    console.log(`Populated ${departments.length} departments`);
}

// Populate category dropdown based on selected department
function populateCategories(department) {
    const catSelect = document.getElementById('category');
    const categories = department ? Object.keys(taxonomyTree[department].categories).sort() : [];
    
    catSelect.innerHTML = '<option value="">Select Category...</option>';
    
    if (categories.length > 0) {
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            catSelect.appendChild(option);
        });
        catSelect.disabled = false;
    } else {
        catSelect.disabled = true;
    }
    
    updateCount('cat-count', categories.length);
}

// Populate subcategory dropdown based on selected category
function populateSubcategories(department, category) {
    const subcatSelect = document.getElementById('subcategory');
    const subcategories = (department && category) ? 
        Object.keys(taxonomyTree[department].categories[category].subcategories).sort() : [];
    
    subcatSelect.innerHTML = '<option value="">Select Sub-category...</option>';
    
    if (subcategories.length > 0) {
        subcategories.forEach(subcat => {
            const option = document.createElement('option');
            option.value = subcat;
            option.textContent = subcat;
            subcatSelect.appendChild(option);
        });
        subcatSelect.disabled = false;
    } else {
        subcatSelect.disabled = true;
    }
    
    updateCount('subcat-count', subcategories.length);
}

// Populate product type dropdown based on selected subcategory
function populateProductTypes(department, category, subcategory) {
    const prodTypeSelect = document.getElementById('producttype');
    const productTypes = (department && category && subcategory) ? 
        Array.from(taxonomyTree[department].categories[category].subcategories[subcategory].producttypes).sort() : [];
    
    prodTypeSelect.innerHTML = '<option value="">Select Product Type...</option>';
    
    if (productTypes.length > 0) {
        productTypes.forEach(prodType => {
            const option = document.createElement('option');
            option.value = prodType;
            option.textContent = prodType;
            prodTypeSelect.appendChild(option);
        });
        prodTypeSelect.disabled = false;
    } else {
        prodTypeSelect.disabled = true;
    }
    
    updateCount('prodtype-count', productTypes.length);
}

// Setup event listeners
function setupEventListeners() {
    // Dropdown change events
    document.getElementById('department').addEventListener('change', handleDepartmentChange);
    document.getElementById('category').addEventListener('change', handleCategoryChange);
    document.getElementById('subcategory').addEventListener('change', handleSubcategoryChange);
    document.getElementById('producttype').addEventListener('change', handleProductTypeChange);
    
    // Manual entry events
    document.getElementById('find-match').addEventListener('click', handleFindMatch);
    document.getElementById('manual-product').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleFindMatch();
        }
    });
    
    // Validation events
    document.getElementById('validate-product').addEventListener('click', handleValidateProduct);
    document.getElementById('generate-styleguide').addEventListener('click', handleGenerateStyleGuide);
    document.getElementById('clear-form').addEventListener('click', handleClearForm);
    
    // Taxonomy generate button
    document.getElementById('generate-taxonomy').addEventListener('click', handleGenerateTaxonomyStyleGuide);
    
    // Modal events
    document.getElementById('close-modal').addEventListener('click', closeStyleGuideModal);
    document.getElementById('close-styleguide').addEventListener('click', closeStyleGuideModal);
    document.getElementById('download-pdf').addEventListener('click', downloadStyleGuidePDF);
    document.getElementById('copy-styleguide').addEventListener('click', copyStyleGuideContent);
    
    // Close modal when clicking outside
    document.getElementById('styleguide-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeStyleGuideModal();
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('styleguide-modal').classList.contains('show')) {
            closeStyleGuideModal();
        }
    });
    
    // Add input listeners for real-time suggestions
    ['product-title', 'product-description', 'product-material', 'product-color'].forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', debounce(showAutoSuggestions, 300));
    });
    
    // Export events
    document.getElementById('export-json').addEventListener('click', () => exportData('json'));
    document.getElementById('export-csv').addEventListener('click', () => exportData('csv'));
    document.getElementById('copy-output').addEventListener('click', copyToClipboard);
}

// Handle department selection
function handleDepartmentChange(e) {
    const department = e.target.value;
    currentSelection.department = department;
    currentSelection.category = '';
    currentSelection.subcategory = '';
    currentSelection.producttype = '';
    
    populateCategories(department);
    clearLowerLevels(['subcategory', 'producttype']); // Only clear levels below category
    updateBreadcrumb();
    updateStyleGuide();
}

// Handle category selection
function handleCategoryChange(e) {
    const category = e.target.value;
    currentSelection.category = category;
    currentSelection.subcategory = '';
    currentSelection.producttype = '';
    
    populateSubcategories(currentSelection.department, category);
    clearLowerLevels(['producttype']); // Only clear levels below subcategory
    updateBreadcrumb();
    updateStyleGuide();
}

// Handle subcategory selection
function handleSubcategoryChange(e) {
    const subcategory = e.target.value;
    currentSelection.subcategory = subcategory;
    currentSelection.producttype = '';
    
    populateProductTypes(currentSelection.department, currentSelection.category, subcategory);
    // No need to clear anything - we're populating the final level
    updateBreadcrumb();
    updateStyleGuide();
}

// Handle product type selection
function handleProductTypeChange(e) {
    const producttype = e.target.value;
    currentSelection.producttype = producttype;
    
    updateBreadcrumb();
    updateStyleGuide();
}

// Clear lower level dropdowns and counts
function clearLowerLevels(levels) {
    levels.forEach(level => {
        const select = document.getElementById(level);
        select.innerHTML = `<option value="">Select ${level.charAt(0).toUpperCase() + level.slice(1)}...</option>`;
        select.disabled = true;
        
        let countId = level + '-count';
        if (level === 'producttype') countId = 'prodtype-count';
        updateCount(countId, 0);
    });
}

// Handle manual product type search
function handleFindMatch() {
    const query = document.getElementById('manual-product').value.trim();
    if (!query) return;
    
    const matches = findSimilarProducts(query);
    displayMatches(matches);
}

// Find similar products using fuzzy matching
function findSimilarProducts(query) {
    const matches = [];
    const queryLower = query.toLowerCase();
    
    taxonomyData.forEach(item => {
        if (item.producttype) {
            const similarity = calculateSimilarity(queryLower, item.producttype.toLowerCase());
            if (similarity > 0.3) { // Threshold for similarity
                matches.push({
                    item: item,
                    similarity: similarity,
                    score: Math.round(similarity * 100)
                });
            }
        }
    });
    
    // Sort by similarity score (descending)
    matches.sort((a, b) => b.similarity - a.similarity);
    
    return matches.slice(0, 10); // Return top 10 matches
}

// Calculate string similarity using Levenshtein distance
function calculateSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
}

// Display matching results
function displayMatches(matches) {
    const resultsDiv = document.getElementById('match-results');
    
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div class="no-matches">No similar products found. Try a different search term.</div>';
        return;
    }
    
    let html = '<div class="matches-header"><strong>Similar Products Found:</strong></div>';
    
    matches.forEach(match => {
        html += `
            <div class="match-item" onclick="selectMatch('${match.item.fullPath}')">
                <div class="match-path">${match.item.fullPath}</div>
                <div class="match-score">${match.score}% match</div>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = html;
}

// Select a match from search results
function selectMatch(fullPath) {
    const item = taxonomyData.find(t => t.fullPath === fullPath);
    if (!item) return;
    
    // Update current selection
    currentSelection = {
        department: item.department,
        category: item.category,
        subcategory: item.subcategory,
        producttype: item.producttype
    };
    
    // Update all dropdowns
    document.getElementById('department').value = item.department;
    populateCategories(item.department);
    
    if (item.category) {
        document.getElementById('category').value = item.category;
        populateSubcategories(item.department, item.category);
    }
    
    if (item.subcategory) {
        document.getElementById('subcategory').value = item.subcategory;
        populateProductTypes(item.department, item.category, item.subcategory);
    }
    
    if (item.producttype) {
        document.getElementById('producttype').value = item.producttype;
    }
    
    // Clear manual input and results
    document.getElementById('manual-product').value = '';
    document.getElementById('match-results').innerHTML = '';
    
    updateBreadcrumb();
    updateStyleGuide();
}

// Update breadcrumb display
function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    const parts = [];
    
    if (currentSelection.department) parts.push(currentSelection.department);
    if (currentSelection.category) parts.push(currentSelection.category);
    if (currentSelection.subcategory) parts.push(currentSelection.subcategory);
    if (currentSelection.producttype) parts.push(currentSelection.producttype);
    
    if (parts.length === 0) {
        breadcrumb.innerHTML = '<span class="placeholder">No selection made</span>';
    } else {
        breadcrumb.textContent = parts.join(' > ');
    }
    
    // Update generate button state
    updateGenerateButton();
}

// Update generate button state based on taxonomy selection
function updateGenerateButton() {
    const generateBtn = document.getElementById('generate-taxonomy');
    const generateHint = document.querySelector('.generate-hint');
    
    // Check what levels are available and required
    const availableLevels = getAvailableTaxonomyLevels();
    const isComplete = isSelectionComplete(availableLevels);
    
    if (isComplete) {
        generateBtn.disabled = false;
        generateHint.textContent = 'Ready to generate style guide!';
    } else {
        generateBtn.disabled = true;
        const missingLevels = getMissingLevels(availableLevels);
        generateHint.textContent = `Please select: ${missingLevels.join(', ')}`;
    }
}

// Get available taxonomy levels for current selection
function getAvailableTaxonomyLevels() {
    const levels = {
        department: false,
        category: false,
        subcategory: false,
        producttype: false
    };
    
    // Department is always available
    levels.department = true;
    
    // Check if categories are available for selected department
    if (currentSelection.department && taxonomyTree[currentSelection.department]) {
        const categories = Object.keys(taxonomyTree[currentSelection.department].categories);
        if (categories.length > 0) {
            levels.category = true;
        }
        
        // Check if subcategories are available for selected category
        if (currentSelection.category && taxonomyTree[currentSelection.department].categories[currentSelection.category]) {
            const subcategories = Object.keys(taxonomyTree[currentSelection.department].categories[currentSelection.category].subcategories);
            if (subcategories.length > 0) {
                levels.subcategory = true;
            }
            
            // Check if product types are available for selected subcategory
            if (currentSelection.subcategory && taxonomyTree[currentSelection.department].categories[currentSelection.category].subcategories[currentSelection.subcategory]) {
                const productTypes = taxonomyTree[currentSelection.department].categories[currentSelection.category].subcategories[currentSelection.subcategory].producttypes;
                if (productTypes && productTypes.size > 0) {
                    levels.producttype = true;
                }
            }
        }
    }
    
    return levels;
}

// Check if selection is complete based on available levels
function isSelectionComplete(availableLevels) {
    // Department is always required
    if (!currentSelection.department) return false;
    
    // Category is required if available
    if (availableLevels.category && !currentSelection.category) return false;
    
    // Subcategory is required if available
    if (availableLevels.subcategory && !currentSelection.subcategory) return false;
    
    // Product type is required if available
    if (availableLevels.producttype && !currentSelection.producttype) return false;
    
    return true;
}

// Get missing levels for hint text
function getMissingLevels(availableLevels) {
    const missing = [];
    
    if (!currentSelection.department) missing.push('Department');
    if (availableLevels.category && !currentSelection.category) missing.push('Category');
    if (availableLevels.subcategory && !currentSelection.subcategory) missing.push('Sub-category');
    if (availableLevels.producttype && !currentSelection.producttype) missing.push('Product Type');
    
    return missing;
}

// Get the deepest level value for SEO recommendations
function getDeepestLevelValue() {
    if (currentSelection.producttype) return currentSelection.producttype;
    if (currentSelection.subcategory) return currentSelection.subcategory;
    if (currentSelection.category) return currentSelection.category;
    if (currentSelection.department) return currentSelection.department;
    return 'Product'; // Default fallback
}

// Generate breadcrumb navigation based on selected levels
function generateBreadcrumbNavigation() {
    const parts = ['Home'];
    
    if (currentSelection.department) parts.push(currentSelection.department);
    if (currentSelection.category) parts.push(currentSelection.category);
    if (currentSelection.subcategory) parts.push(currentSelection.subcategory);
    if (currentSelection.producttype) parts.push(currentSelection.producttype);
    
    return parts.join(' > ');
}

// Handle product validation
function handleValidateProduct() {
    const productData = collectProductData();
    
    if (!productData.title && !productData.description) {
        showValidationMessage('Please enter a product title or description to validate.', 'error');
        return;
    }
    
    // Use enhanced validation
    const results = performEnhancedValidation(productData);
    displayValidationResults(results);
}

// Check if we have a valid selection
function hasValidSelection() {
    return currentSelection.department && 
           (currentSelection.category || currentSelection.subcategory || currentSelection.producttype);
}



// Display validation results
function displayValidationResults(results) {
    const resultsDiv = document.getElementById('validation-results');
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    let html = '<div class="validation-header"><strong>Validation Results:</strong></div>';
    
    results.forEach(result => {
        html += `<div class="validation-item validation-${result.type}">${result.message}</div>`;
    });
    
    resultsDiv.innerHTML = html;
}

// Show validation message
function showValidationMessage(message, type) {
    const resultsDiv = document.getElementById('validation-results');
    resultsDiv.innerHTML = `<div class="validation-item validation-${type}">${message}</div>`;
}

// Handle clear form
function handleClearForm() {
    // Clear all form fields
    ['product-title', 'product-description', 'product-price', 'product-brand', 
     'product-material', 'product-color', 'product-size', 'product-image'].forEach(fieldId => {
        document.getElementById(fieldId).value = '';
    });
    
    document.getElementById('validation-results').innerHTML = '';
    document.getElementById('auto-suggestions').innerHTML = '';
    document.getElementById('auto-suggestions').classList.remove('show');
    document.getElementById('generate-styleguide').disabled = true;
}

// Enhanced product validation with Google standards
function performEnhancedValidation(productData) {
    const results = [];
    const requiredFields = getRequiredFieldsForCategory();
    const standardizedAttributes = getStandardizedAttributes();
    
    // Category alignment validation
    if (hasValidSelection()) {
        results.push({
            type: 'success',
            message: `✓ Product correctly categorized under: ${getCurrentPath()}`
        });
        
        // Enhanced SEO validation
        const seoScore = calculateEnhancedSEOScore(productData);
        if (seoScore >= 80) {
            results.push({
                type: 'success',
                message: `✓ SEO Score: ${seoScore}% - Excellent optimization`
            });
        } else if (seoScore >= 60) {
            results.push({
                type: 'warning',
                message: `⚠ SEO Score: ${seoScore}% - Good but improvable`
            });
        } else {
            results.push({
                type: 'error',
                message: `✗ SEO Score: ${seoScore}% - Needs significant improvement`
            });
        }
        
        // Google standards validation
        validateGoogleStandards(productData, results);
        
        // Required fields validation
        validateRequiredFields(productData, requiredFields, results);
        
        // Auto-suggest missing attributes
        suggestMissingAttributes(productData, standardizedAttributes, results);
        
        // Enable generate button if validation passes
        const hasErrors = results.some(r => r.type === 'error');
        document.getElementById('generate-styleguide').disabled = hasErrors;
        
    } else {
        results.push({
            type: 'error',
            message: '✗ Please select a product category first'
        });
        document.getElementById('generate-styleguide').disabled = true;
    }
    
    return results;
}

// Get required fields based on selected category
function getRequiredFieldsForCategory() {
    const category = currentSelection.department;
    const requiredFields = ['title', 'description'];
    
    // Category-specific requirements
    if (category?.includes('Apparel') || category?.includes('Clothing')) {
        requiredFields.push('material', 'color', 'size');
    } else if (category?.includes('Electronics')) {
        requiredFields.push('brand');
    } else if (category?.includes('Home') || category?.includes('Furniture')) {
        requiredFields.push('material', 'color');
    }
    
    return requiredFields;
}

// Get standardized attributes from Google taxonomy
function getStandardizedAttributes() {
    const category = currentSelection.department;
    const attributes = {};
    
    if (category?.includes('Apparel') || category?.includes('Clothing')) {
        attributes.materials = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather'];
        attributes.colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray', 'Brown', 'Navy'];
        attributes.sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    } else if (category?.includes('Electronics')) {
        attributes.brands = ['Apple', 'Samsung', 'Sony', 'LG', 'HP', 'Dell', 'Canon', 'Nikon'];
        attributes.colors = ['Black', 'White', 'Silver', 'Gray', 'Blue'];
    }
    
    return attributes;
}

// Validate against Google standards
function validateGoogleStandards(productData, results) {
    // Title length validation (Google recommendations)
    if (productData.title.length < 10) {
        results.push({
            type: 'error',
            message: '✗ Product title too short (minimum 10 characters recommended)'
        });
    } else if (productData.title.length > 150) {
        results.push({
            type: 'warning',
            message: '⚠ Product title may be too long (150 characters recommended max)'
        });
    }
    
    // Description validation
    if (productData.description.length < 50) {
        results.push({
            type: 'warning',
            message: '⚠ Product description should be more detailed (50+ characters)'
        });
    }
    
    // Price format validation
    if (productData.price && !productData.price.match(/^\$?\d+\.?\d*$/)) {
        results.push({
            type: 'warning',
            message: '⚠ Price format should include currency symbol (e.g., $29.99)'
        });
    }
    
    // Image URL validation
    if (productData.image && !isValidImageUrl(productData.image)) {
        results.push({
            type: 'warning',
            message: '⚠ Product image URL may not be valid'
        });
    }
}

// Validate required fields
function validateRequiredFields(productData, requiredFields, results) {
    const missingFields = [];
    
    requiredFields.forEach(field => {
        if (!productData[field] || productData[field].trim() === '') {
            missingFields.push(field);
        }
    });
    
    if (missingFields.length > 0) {
        results.push({
            type: 'warning',
            message: `⚠ Missing recommended fields: ${missingFields.join(', ')}`
        });
    }
}

// Suggest missing attributes
function suggestMissingAttributes(productData, standardizedAttributes, results) {
    const suggestions = [];
    
    Object.keys(standardizedAttributes).forEach(attrType => {
        const fieldName = attrType.slice(0, -1); // Remove 's' from plurals
        if (!productData[fieldName] || productData[fieldName].trim() === '') {
            suggestions.push({
                field: fieldName,
                suggestions: standardizedAttributes[attrType].slice(0, 3) // Top 3 suggestions
            });
        }
    });
    
    if (suggestions.length > 0) {
        showAutoSuggestionsPanel(suggestions);
    }
}

// Show auto-suggestions panel
function showAutoSuggestionsPanel(suggestions) {
    const panel = document.getElementById('auto-suggestions');
    
    let html = `
        <div class="suggestion-header">
            <i class="fas fa-lightbulb"></i>
            Auto-Suggestions Based on Google Standards
        </div>
    `;
    
    suggestions.forEach(suggestion => {
        html += `
            <div class="suggestion-group">
                <strong>${suggestion.field.charAt(0).toUpperCase() + suggestion.field.slice(1)}:</strong>
                <div class="suggestion-options">
        `;
        
        suggestion.suggestions.forEach(value => {
            html += `
                <div class="suggestion-item" onclick="applySuggestion('${suggestion.field}', '${value}')">
                    <span class="suggestion-value">${value}</span>
                    <button class="suggestion-apply">Apply</button>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    panel.innerHTML = html;
    panel.classList.add('show');
}

// Apply suggestion to form field
function applySuggestion(fieldName, value) {
    const fieldId = 'product-' + fieldName;
    const field = document.getElementById(fieldId);
    if (field) {
        field.value = value;
        showTemporaryMessage(`Applied suggestion: ${value}`);
        
        // Re-validate after applying suggestion
        setTimeout(() => {
            handleValidateProduct();
        }, 500);
    }
}

// Enhanced SEO score calculation
function calculateEnhancedSEOScore(productData) {
    let score = 0;
    const text = (productData.title + ' ' + productData.description).toLowerCase();
    
    // Category keyword alignment (40 points)
    if (currentSelection.department && text.includes(currentSelection.department.toLowerCase())) score += 10;
    if (currentSelection.category && text.includes(currentSelection.category.toLowerCase())) score += 10;
    if (currentSelection.subcategory && text.includes(currentSelection.subcategory.toLowerCase())) score += 10;
    if (currentSelection.producttype && text.includes(currentSelection.producttype.toLowerCase())) score += 10;
    
    // Content quality (30 points)
    if (productData.title.length >= 10 && productData.title.length <= 150) score += 10;
    if (productData.description.length >= 50) score += 10;
    if (productData.brand && productData.brand.trim()) score += 10;
    
    // Additional attributes (30 points)
    if (productData.price && productData.price.trim()) score += 10;
    if (productData.material && productData.material.trim()) score += 10;
    if (productData.color && productData.color.trim()) score += 10;
    
    return Math.min(score, 100);
}

// Handle generate style guide
function handleGenerateStyleGuide() {
    const productData = collectProductData();
    
    if (!hasValidSelection()) {
        showValidationMessage('Please select a product category first.', 'error');
        return;
    }
    
    if (!productData.title.trim()) {
        showValidationMessage('Please enter a product title.', 'error');
        return;
    }
    
    showPDFStatus('Generating style guide PDF...', 'info');
    
    // Generate comprehensive style guide
    generateComprehensivePDF(productData);
}

// Generate comprehensive PDF style guide
async function generateComprehensivePDF(productData) {
    try {
        console.log('Starting PDF generation...');
        
        // Check if jsPDF is available
        if (!window.jspdf) {
            throw new Error('jsPDF library not loaded');
        }
        
        const { jsPDF } = window.jspdf;
        console.log('jsPDF loaded successfully');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        console.log('PDF instance created');
        
        // PDF dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        
        let yPosition = margin;
        
        // Helper function to add new page if needed
        const checkNewPage = (requiredHeight) => {
            if (yPosition + requiredHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }
        };
        
        // Header
        pdf.setFontSize(24);
        pdf.setTextColor(102, 126, 234);
        pdf.text('PRODUCT STYLE GUIDE', margin, yPosition);
        yPosition += 15;
        
        // Subtitle
        pdf.setFontSize(12);
        pdf.setTextColor(113, 128, 150);
        pdf.text(`Generated: ${new Date().toLocaleDateString()} | Google Product Taxonomy 2021-09-21`, margin, yPosition);
        yPosition += 20;
        
        // Product Image Placeholder
        checkNewPage(60);
        pdf.setFillColor(247, 250, 252);
        pdf.rect(margin, yPosition, 60, 60, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(160, 174, 192);
        pdf.text('Product Image', margin + 20, yPosition + 35);
        
        // If image URL provided, add note
        if (productData.image) {
            pdf.text('Image URL:', margin + 70, yPosition + 10);
            pdf.setFontSize(8);
            pdf.text(productData.image, margin + 70, yPosition + 15);
        }
        yPosition += 80;
        
        // Product Information Section
        checkNewPage(40);
        pdf.setFontSize(16);
        pdf.setTextColor(45, 55, 72);
        pdf.text('PRODUCT INFORMATION', margin, yPosition);
        yPosition += 15;
        
        // Product details
        const productDetails = [
            ['Product Title', productData.title || 'Not specified'],
            ['Brand', productData.brand || 'Not specified'],
            ['Price', productData.price || 'Not specified'],
            ['Material', productData.material || 'Not specified'],
            ['Color', productData.color || 'Not specified'],
            ['Size', productData.size || 'Not specified']
        ];
        
        pdf.setFontSize(10);
        productDetails.forEach(([label, value]) => {
            checkNewPage(8);
            pdf.setTextColor(45, 55, 72);
            pdf.text(`${label}:`, margin, yPosition);
            pdf.setTextColor(113, 128, 150);
            pdf.text(value, margin + 40, yPosition);
            yPosition += 8;
        });
        
        yPosition += 10;
        
        // Product Description
        checkNewPage(30);
        pdf.setFontSize(14);
        pdf.setTextColor(45, 55, 72);
        pdf.text('PRODUCT DESCRIPTION', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        const description = productData.description || 'No description provided';
        const descriptionLines = pdf.splitTextToSize(description, contentWidth);
        pdf.text(descriptionLines, margin, yPosition);
        yPosition += descriptionLines.length * 5 + 15;
        
        // Visual & Rich Media Assets Section
        const mediaData = getVisualMediaAssetsData();
        checkNewPage(50);
        pdf.setFontSize(16);
        pdf.setTextColor(45, 55, 72);
        pdf.text('VISUAL & RICH MEDIA ASSETS', margin, yPosition);
        yPosition += 15;
        
        // Primary Image
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Primary Image:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        const primaryImageLines = pdf.splitTextToSize(mediaData.primaryImage, contentWidth - 20);
        pdf.text(primaryImageLines, margin + 10, yPosition);
        yPosition += primaryImageLines.length * 5 + 8;
        
        // Additional Views
        checkNewPage(20);
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Additional Views:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        mediaData.additionalViews.forEach(view => {
            checkNewPage(6);
            const viewLines = pdf.splitTextToSize(`• ${view}`, contentWidth - 20);
            pdf.text(viewLines, margin + 10, yPosition);
            yPosition += viewLines.length * 5 + 2;
        });
        yPosition += 5;
        
        // Image Types
        checkNewPage(20);
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Image Types:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        mediaData.imageTypes.forEach(type => {
            checkNewPage(8);
            const typeLines = pdf.splitTextToSize(`• ${type.name}: ${type.description}`, contentWidth - 20);
            pdf.text(typeLines, margin + 10, yPosition);
            yPosition += typeLines.length * 5 + 2;
        });
        yPosition += 5;
        
        // Rich Media
        checkNewPage(20);
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Rich Media:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        mediaData.richMedia.forEach(media => {
            checkNewPage(6);
            const mediaLines = pdf.splitTextToSize(`• ${media}`, contentWidth - 20);
            pdf.text(mediaLines, margin + 10, yPosition);
            yPosition += mediaLines.length * 5 + 2;
        });
        yPosition += 15;
        
        // Product Specifications Section
        const specsData = getProductSpecificationsData();
        checkNewPage(50);
        pdf.setFontSize(16);
        pdf.setTextColor(45, 55, 72);
        pdf.text('PRODUCT SPECIFICATIONS', margin, yPosition);
        yPosition += 15;
        
        // Variants
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Variants:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        Object.entries(specsData.variants).forEach(([key, values]) => {
            checkNewPage(6);
            const variantText = `• ${key}: ${Array.isArray(values) ? values.join(', ') : values}`;
            const variantLines = pdf.splitTextToSize(variantText, contentWidth - 20);
            pdf.text(variantLines, margin + 10, yPosition);
            yPosition += variantLines.length * 5 + 2;
        });
        yPosition += 8;
        
        // Attributes
        checkNewPage(20);
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Attributes:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        Object.entries(specsData.attributes).forEach(([key, value]) => {
            checkNewPage(8);
            const attributeText = `• ${key}: ${value}`;
            const attributeLines = pdf.splitTextToSize(attributeText, contentWidth - 20);
            pdf.text(attributeLines, margin + 10, yPosition);
            yPosition += attributeLines.length * 5 + 2;
        });
        yPosition += 15;
        
        // Size & Fit Guidance Section (only for applicable product types)
        if (shouldShowSizeFitGuidance()) {
            const sizeData = getSizeFitGuidanceData();
            checkNewPage(50);
            pdf.setFontSize(16);
            pdf.setTextColor(45, 55, 72);
            pdf.text('SIZE & FIT GUIDANCE', margin, yPosition);
            yPosition += 15;
            
            // Model Information
            pdf.setFontSize(12);
            pdf.setTextColor(45, 55, 72);
            pdf.text('Model Information:', margin, yPosition);
            yPosition += 8;
            pdf.setFontSize(10);
            pdf.setTextColor(113, 128, 150);
            const modelInfoLines = pdf.splitTextToSize(sizeData.modelInfo, contentWidth - 20);
            pdf.text(modelInfoLines, margin + 10, yPosition);
            yPosition += modelInfoLines.length * 5 + 8;
            
            // Size Guide
            checkNewPage(20);
            pdf.setFontSize(12);
            pdf.setTextColor(45, 55, 72);
            pdf.text('Size Guide:', margin, yPosition);
            yPosition += 8;
            pdf.setFontSize(10);
            pdf.setTextColor(113, 128, 150);
            sizeData.sizeGuide.forEach(guide => {
                checkNewPage(6);
                const guideLines = pdf.splitTextToSize(`• ${guide}`, contentWidth - 20);
                pdf.text(guideLines, margin + 10, yPosition);
                yPosition += guideLines.length * 5 + 2;
            });
            yPosition += 8;
            
            // Size Chart (if available)
            if (sizeData.sizeChart) {
                checkNewPage(30);
                pdf.setFontSize(12);
                pdf.setTextColor(45, 55, 72);
                pdf.text('Size Chart:', margin, yPosition);
                yPosition += 8;
                pdf.setFontSize(9);
                pdf.setTextColor(113, 128, 150);
                pdf.text('See detailed size chart below for accurate measurements:', margin + 10, yPosition);
                yPosition += 6;
                pdf.text('(Size chart would be displayed as a formatted table in actual implementation)', margin + 10, yPosition);
                yPosition += 15;
            }
        }
        
        // Cross-Selling & Personalization Section
        const crossSellingData = getCrossSellingPersonalizationData();
        checkNewPage(50);
        pdf.setFontSize(16);
        pdf.setTextColor(45, 55, 72);
        pdf.text('CROSS-SELLING & PERSONALIZATION', margin, yPosition);
        yPosition += 15;
        
        // Buy the Look / Bundle Suggestions
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Buy the Look / Bundle Suggestions:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        crossSellingData.buyTheLook.forEach(suggestion => {
            checkNewPage(6);
            const suggestionLines = pdf.splitTextToSize(`• ${suggestion}`, contentWidth - 20);
            pdf.text(suggestionLines, margin + 10, yPosition);
            yPosition += suggestionLines.length * 5 + 2;
        });
        yPosition += 8;
        
        // #AsSeenOnMe / #InUseByOthers
        checkNewPage(20);
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('#AsSeenOnMe / #InUseByOthers:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        const socialContentLines = pdf.splitTextToSize(crossSellingData.socialContent, contentWidth - 20);
        pdf.text(socialContentLines, margin + 10, yPosition);
        yPosition += socialContentLines.length * 5 + 8;
        
        // Quick View Feature
        checkNewPage(15);
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Quick View Feature:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        const quickViewLines = pdf.splitTextToSize(crossSellingData.quickView, contentWidth - 20);
        pdf.text(quickViewLines, margin + 10, yPosition);
        yPosition += quickViewLines.length * 5 + 15;
        
        // Customer Engagement Section
        const engagementData = getCustomerEngagementData();
        checkNewPage(50);
        pdf.setFontSize(16);
        pdf.setTextColor(45, 55, 72);
        pdf.text('CUSTOMER ENGAGEMENT', margin, yPosition);
        yPosition += 15;
        
        // Reviews & Ratings
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Reviews & Ratings:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        
        // Star rating and average
        const ratingText = `${engagementData.starRating} (${engagementData.averageRating}/5 average)`;
        pdf.text(ratingText, margin + 10, yPosition);
        yPosition += 6;
        
        // Pros and Cons
        const prosText = `Pros: ${engagementData.pros.join(', ')}`;
        const prosLines = pdf.splitTextToSize(prosText, contentWidth - 20);
        pdf.text(prosLines, margin + 10, yPosition);
        yPosition += prosLines.length * 5 + 2;
        
        const consText = `Cons: ${engagementData.cons.join(', ')}`;
        const consLines = pdf.splitTextToSize(consText, contentWidth - 20);
        pdf.text(consLines, margin + 10, yPosition);
        yPosition += consLines.length * 5 + 2;
        
        // Sentiment analysis
        const sentimentText = `Sentiment analysis: ${engagementData.sentimentScore}% positive`;
        pdf.text(sentimentText, margin + 10, yPosition);
        yPosition += 8;
        
        // Share Feature
        checkNewPage(20);
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Share Feature:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        
        // Social sharing platforms
        const socialText = `Social sharing: ${engagementData.socialPlatforms.join(', ')} buttons`;
        const socialLines = pdf.splitTextToSize(socialText, contentWidth - 20);
        pdf.text(socialLines, margin + 10, yPosition);
        yPosition += socialLines.length * 5 + 2;
        
        // Influencer features
        const influencerText = `Integration: ${engagementData.influencerFeatures}`;
        const influencerLines = pdf.splitTextToSize(influencerText, contentWidth - 20);
        pdf.text(influencerLines, margin + 10, yPosition);
        yPosition += influencerLines.length * 5 + 15;
        
        // Discoverability & Shelf Placement Section
        const shelfData = getDiscoverabilityShelfPlacementData();
        checkNewPage(50);
        pdf.setFontSize(16);
        pdf.setTextColor(45, 55, 72);
        pdf.text('DISCOVERABILITY & SHELF PLACEMENT', margin, yPosition);
        yPosition += 15;
        
        // Facets
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Facets:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        const facetsText = `Filterable attributes: ${shelfData.facets.join(', ')}`;
        const facetsLines = pdf.splitTextToSize(facetsText, contentWidth - 20);
        pdf.text(facetsLines, margin + 10, yPosition);
        yPosition += facetsLines.length * 5 + 8;
        
        // Shelf Description Guidelines
        checkNewPage(20);
        pdf.setFontSize(12);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Shelf Description Guidelines:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(113, 128, 150);
        shelfData.shelfGuidelines.forEach(guideline => {
            checkNewPage(6);
            const guidelineLines = pdf.splitTextToSize(`• ${guideline}`, contentWidth - 20);
            pdf.text(guidelineLines, margin + 10, yPosition);
            yPosition += guidelineLines.length * 5 + 2;
        });
        yPosition += 5;
        
        // Curated Collections (if any)
        if (shelfData.curatedCollections.length > 0) {
            checkNewPage(15);
            pdf.setFontSize(11);
            pdf.setTextColor(45, 55, 72);
            pdf.text('Curated Collections:', margin + 10, yPosition);
            yPosition += 6;
            pdf.setFontSize(10);
            pdf.setTextColor(113, 128, 150);
            shelfData.curatedCollections.forEach(collection => {
                checkNewPage(5);
                const collectionLines = pdf.splitTextToSize(`• "${collection}"`, contentWidth - 30);
                pdf.text(collectionLines, margin + 20, yPosition);
                yPosition += collectionLines.length * 5 + 1;
            });
            yPosition += 10;
        }
        
        yPosition += 5;
        
        // Google Product Category Section
        checkNewPage(40);
        pdf.setFontSize(16);
        pdf.setTextColor(45, 55, 72);
        pdf.text('GOOGLE PRODUCT CATEGORY', margin, yPosition);
        yPosition += 15;
        
        const categoryDetails = [
            ['Full Path', getCurrentPath()],
            ['Department (Level 1)', currentSelection.department || 'Not specified'],
            ['Category (Level 2)', currentSelection.category || 'Not specified'],
            ['Sub-category (Level 3)', currentSelection.subcategory || 'Not specified'],
            ['Product Type (Level 4)', currentSelection.producttype || 'Not specified']
        ];
        
        pdf.setFontSize(10);
        categoryDetails.forEach(([label, value]) => {
            checkNewPage(8);
            pdf.setTextColor(45, 55, 72);
            pdf.text(`${label}:`, margin, yPosition);
            pdf.setTextColor(113, 128, 150);
            const valueLines = pdf.splitTextToSize(value, contentWidth - 50);
            pdf.text(valueLines, margin + 50, yPosition);
            yPosition += Math.max(8, valueLines.length * 5);
        });
        
        yPosition += 10;
        
        // SEO Metadata Section
        checkNewPage(50);
        pdf.setFontSize(16);
        pdf.setTextColor(45, 55, 72);
        pdf.text('SEO METADATA & RECOMMENDATIONS', margin, yPosition);
        yPosition += 15;
        
        const seoScore = calculateEnhancedSEOScore(productData);
        const seoDetails = [
            ['SEO Score', `${seoScore}%`],
            ['Recommended Title Format', `${productData.title} - ${currentSelection.producttype || currentSelection.subcategory || 'Product'}`],
            ['Primary Keywords', getCurrentPathKeywords()],
            ['Meta Description', `${productData.description?.substring(0, 150) || 'Description needed'}...`],
            ['Breadcrumb Path', getCurrentPath()]
        ];
        
        pdf.setFontSize(10);
        seoDetails.forEach(([label, value]) => {
            checkNewPage(12);
            pdf.setTextColor(45, 55, 72);
            pdf.text(`${label}:`, margin, yPosition);
            pdf.setTextColor(113, 128, 150);
            const valueLines = pdf.splitTextToSize(value, contentWidth - 50);
            pdf.text(valueLines, margin + 50, yPosition);
            yPosition += Math.max(8, valueLines.length * 5);
        });
        
        yPosition += 15;
        
        // Add Enhanced Product Overview Section (from modal)
        try {
            console.log('Getting overview data...');
            const overviewData = getProductOverviewData();
            console.log('Overview data retrieved:', overviewData);
            
            checkNewPage(60);
            pdf.setFontSize(16);
            pdf.setTextColor(45, 55, 72);
            pdf.text('ENHANCED PRODUCT OVERVIEW', margin, yPosition);
            yPosition += 15;
            
            // Title Example
            pdf.setFontSize(12);
            pdf.setTextColor(45, 55, 72);
            pdf.text('Title Example:', margin, yPosition);
            yPosition += 8;
            pdf.setFontSize(10);
            pdf.setTextColor(113, 128, 150);
            const titleLines = pdf.splitTextToSize(overviewData.title || 'Sample Product Title', contentWidth - 20);
            pdf.text(titleLines, margin + 10, yPosition);
            yPosition += titleLines.length * 5 + 8;
        } catch (error) {
            console.error('Error in Product Overview section:', error);
            // Continue with basic title
            checkNewPage(30);
            pdf.setFontSize(16);
            pdf.setTextColor(45, 55, 72);
            pdf.text('PRODUCT OVERVIEW', margin, yPosition);
            yPosition += 15;
            pdf.setFontSize(10);
            pdf.text('Product overview section encountered an error.', margin, yPosition);
            yPosition += 15;
        }
        
        // Additional Product Information (Simplified and Safe)
        try {
            checkNewPage(40);
            pdf.setFontSize(16);
            pdf.setTextColor(45, 55, 72);
            pdf.text('ADDITIONAL PRODUCT INFORMATION', margin, yPosition);
            yPosition += 15;
            
            // Key Features
            pdf.setFontSize(12);
            pdf.setTextColor(45, 55, 72);
            pdf.text('Key Features:', margin, yPosition);
            yPosition += 8;
            pdf.setFontSize(10);
            pdf.setTextColor(113, 128, 150);
            
            const features = [
                'Premium quality construction',
                'Modern design aesthetic', 
                'Durable and reliable materials',
                'User-friendly features',
                'Excellent value for money'
            ];
            
            features.forEach(feature => {
                checkNewPage(6);
                pdf.text(`• ${feature}`, margin + 10, yPosition);
                yPosition += 6;
            });
            yPosition += 10;
            
        } catch (error) {
            console.error('Error in Additional Information section:', error);
            yPosition += 30;
        }
        
        // Product Specifications (Simplified)
        try {
            checkNewPage(40);
            pdf.setFontSize(16);
            pdf.setTextColor(45, 55, 72);
            pdf.text('PRODUCT SPECIFICATIONS', margin, yPosition);
            yPosition += 15;
            
            const specs = [
                ['Category', getCurrentPath() || 'General Product'],
                ['Brand', 'Premium Brand'],
                ['Quality', 'High-Quality Materials'],
                ['Usage', 'Follow manufacturer guidelines'],
                ['Warranty', 'Standard manufacturer warranty']
            ];
            
            pdf.setFontSize(10);
            specs.forEach(([label, value]) => {
                checkNewPage(8);
                pdf.setTextColor(45, 55, 72);
                pdf.text(`${label}:`, margin, yPosition);
                pdf.setTextColor(113, 128, 150);
                const valueLines = pdf.splitTextToSize(value, contentWidth - 50);
                pdf.text(valueLines, margin + 40, yPosition);
                yPosition += Math.max(8, valueLines.length * 5);
            });
            yPosition += 15;
            
        } catch (error) {
            console.error('Error in Product Specifications section:', error);
            yPosition += 30;
        }
        
        // Marketing & SEO Guidelines (Simplified)
        try {
            checkNewPage(40);
            pdf.setFontSize(16);
            pdf.setTextColor(45, 55, 72);
            pdf.text('MARKETING & SEO GUIDELINES', margin, yPosition);
            yPosition += 15;
            
            pdf.setFontSize(12);
            pdf.setTextColor(45, 55, 72);
            pdf.text('SEO Recommendations:', margin, yPosition);
            yPosition += 8;
            pdf.setFontSize(10);
            pdf.setTextColor(113, 128, 150);
            
            const seoGuidelines = [
                'Use descriptive product titles with key features',
                'Include relevant category keywords in descriptions',
                'Optimize images with alt text and proper naming',
                'Maintain consistent product information across channels',
                'Use structured data markup for better search visibility'
            ];
            
            seoGuidelines.forEach(guideline => {
                checkNewPage(6);
                pdf.text(`• ${guideline}`, margin + 10, yPosition);
                yPosition += 6;
            });
            yPosition += 15;
            
        } catch (error) {
            console.error('Error in Marketing section:', error);
            yPosition += 30;
        }
        
        console.log('PDF generation completed successfully - jumping to footer');
        
        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(160, 174, 192);
        pdf.text('Generated by Retail Style Guide Generator | Powered by Google Product Taxonomy', margin, pageHeight - 10);
        
        // Save PDF
        const filename = `comprehensive-style-guide-${productData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;
        pdf.save(filename);
        
        showPDFStatus('Style guide PDF generated successfully!', 'success');
        
        // Hide status after 3 seconds
        setTimeout(() => {
            hidePDFStatus();
        }, 3000);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showPDFStatus('Error generating PDF. Please try again.', 'error');
        
        setTimeout(() => {
            hidePDFStatus();
        }, 5000);
    }
}

// Collect product data from form
function collectProductData() {
    return {
        title: document.getElementById('product-title').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        price: document.getElementById('product-price').value.trim(),
        brand: document.getElementById('product-brand').value.trim(),
        material: document.getElementById('product-material').value.trim(),
        color: document.getElementById('product-color').value.trim(),
        size: document.getElementById('product-size').value.trim(),
        image: document.getElementById('product-image').value.trim()
    };
}

// Show PDF generation status
function showPDFStatus(message, type) {
    let statusDiv = document.getElementById('pdf-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'pdf-status';
        statusDiv.className = 'pdf-status';
        document.body.appendChild(statusDiv);
    }
    
    const iconMap = {
        info: 'fas fa-info-circle',
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle'
    };
    
    statusDiv.innerHTML = `
        <i class="${iconMap[type] || 'fas fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    statusDiv.classList.add('show');
}

// Hide PDF status
function hidePDFStatus() {
    const statusDiv = document.getElementById('pdf-status');
    if (statusDiv) {
        statusDiv.classList.remove('show');
    }
}

// Auto-suggestions with debounce
function showAutoSuggestions() {
    // This will be called when user types in fields
    // For now, we'll keep it simple and trigger on validation
}

// Utility functions
function isValidImageUrl(url) {
    try {
        new URL(url);
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    } catch {
        return false;
    }
}

// Handle taxonomy-based style guide generation
function handleGenerateTaxonomyStyleGuide() {
    if (!hasValidSelection() || !allTaxonomyLevelsSelected()) {
        showValidationMessage('Please select all taxonomy levels first.', 'error');
        return;
    }
    
    // Generate and show style guide in modal
    const styleGuideContent = generateTaxonomyStyleGuide();
    showStyleGuideModal(styleGuideContent);
}

// Check if all available taxonomy levels are selected
function allTaxonomyLevelsSelected() {
    const availableLevels = getAvailableTaxonomyLevels();
    return isSelectionComplete(availableLevels);
}

// Generate style guide content based on taxonomy selection
function generateTaxonomyStyleGuide() {
    const currentDate = new Date().toLocaleDateString();
    const currentPath = getCurrentPath();
    const keywords = getCurrentPathKeywords();
    
    return `
        <div class="styleguide-section">
            <h3><i class="fas fa-info-circle"></i> Style Guide Overview</h3>
            <div class="detail-grid">
                <div class="detail-label">Generated:</div>
                <div class="detail-value">${currentDate}</div>
                <div class="detail-label">Taxonomy Version:</div>
                <div class="detail-value">Google Product Taxonomy 2021-09-21</div>
                <div class="detail-label">Total Categories:</div>
                <div class="detail-value">5,595</div>
            </div>
        </div>

        <div class="styleguide-section">
            <h3><i class="fas fa-info-circle"></i> Product Overview</h3>
            ${generateProductOverviewForModal()}
        </div>

        <div class="styleguide-section">
            <h3><i class="fas fa-images"></i> Visual & Rich Media Assets</h3>
            ${generateVisualMediaAssetsForModal()}
        </div>

        <div class="styleguide-section">
            <h3><i class="fas fa-ruler"></i> Size & Fit Guidance</h3>
            ${generateSizeFitGuidanceForModal()}
        </div>

        <div class="styleguide-section">
            <h3><i class="fas fa-tags"></i> Product Attributes</h3>
            ${generateProductAttributesForModal()}
        </div>

        ${generateCrossSellingPersonalizationForModal()}

        ${generateCustomerEngagementForModal()}

        ${generateDiscoverabilityShelfPlacementForModal()}

        <div class="styleguide-section">
            <h3><i class="fas fa-sitemap"></i> Product Classification</h3>
            <h4>Full Taxonomy Path</h4>
            <div class="detail-value" style="font-size: 1rem; padding: 1rem; margin-bottom: 1rem;">
                ${currentPath}
            </div>
            
                         <div class="detail-grid">
                 <div class="detail-label">Department:</div>
                 <div class="detail-value">${currentSelection.department}</div>
                 ${currentSelection.category ? `
                 <div class="detail-label">Category:</div>
                 <div class="detail-value">${currentSelection.category}</div>
                 ` : ''}
                 ${currentSelection.subcategory ? `
                 <div class="detail-label">Sub-category:</div>
                 <div class="detail-value">${currentSelection.subcategory}</div>
                 ` : ''}
                 ${currentSelection.producttype ? `
                 <div class="detail-label">Product Type:</div>
                 <div class="detail-value">${currentSelection.producttype}</div>
                 ` : ''}
             </div>
        </div>

        <div class="styleguide-section">
            <h3><i class="fas fa-search"></i> SEO Recommendations</h3>
                         <h4>Recommended Product Title Format</h4>
             <div class="detail-value" style="margin-bottom: 1rem;">
                 [Product Name] - ${getDeepestLevelValue()}
             </div>
            
            <h4>Primary Keywords</h4>
            <div class="detail-value" style="margin-bottom: 1rem;">
                ${keywords}
            </div>
            
                         <h4>Meta Description Template</h4>
             <div class="detail-value" style="margin-bottom: 1rem;">
                 Shop [Product Name] - ${getDeepestLevelValue()}. [Brief description highlighting key features]. Free shipping available. Browse our ${(currentSelection.category || currentSelection.department).toLowerCase()} collection.
             </div>
            
                         <h4>Breadcrumb Navigation</h4>
             <div class="detail-value">
                 ${generateBreadcrumbNavigation()}
             </div>
                </div>
    `;
}

// Get category-specific guidelines
function getCategorySpecificGuidelines() {
    const department = currentSelection.department;
    
    if (department?.includes('Apparel') || department?.includes('Clothing')) {
        return `
            <div class="styleguide-section">
                <h3><i class="fas fa-tshirt"></i> Apparel-Specific Guidelines</h3>
                <h4>Required Attributes</h4>
                <ul class="guidelines-list">
                    <li>Material composition (e.g., "100% Cotton", "50% Polyester, 50% Cotton")</li>
                    <li>Available sizes (XS, S, M, L, XL, XXL)</li>
                    <li>Color options</li>
                    <li>Care instructions</li>
                    <li>Fit type (Regular, Slim, Relaxed, etc.)</li>
                </ul>
                
                <h4>Standard Size Chart</h4>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                        <tr style="background: #f7fafc;">
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Size</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Chest (inches)</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Waist (inches)</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Length (inches)</th>
                        </tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XS</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">32-34</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">26-28</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">26</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">S</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">28-30</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">27</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">M</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36-38</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">30-32</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">28</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">L</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">38-40</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">32-34</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">29</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XL</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">40-42</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">30</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XXL</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">42-44</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36-38</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">31</td></tr>
                    </table>
                </div>
            </div>
        `;
    } else if (department?.includes('Electronics')) {
        return `
            <div class="styleguide-section">
                <h3><i class="fas fa-microchip"></i> Electronics-Specific Guidelines</h3>
                <h4>Required Attributes</h4>
                <ul class="guidelines-list">
                    <li>Brand name (essential for electronics)</li>
                    <li>Model number</li>
                    <li>Technical specifications</li>
                    <li>Warranty information</li>
                    <li>Compatibility details</li>
                    <li>Power requirements</li>
                </ul>
            </div>
        `;
    } else if (department?.includes('Home') || department?.includes('Furniture')) {
        return `
            <div class="styleguide-section">
                <h3><i class="fas fa-home"></i> Home & Furniture Guidelines</h3>
                <h4>Required Attributes</h4>
                <ul class="guidelines-list">
                    <li>Material composition</li>
                    <li>Dimensions (length, width, height)</li>
                    <li>Weight capacity (if applicable)</li>
                    <li>Assembly requirements</li>
                    <li>Care and maintenance instructions</li>
                    <li>Room compatibility</li>
                </ul>
            </div>
        `;
    }
    
    return '';
}

// Show style guide modal
function showStyleGuideModal(content) {
    const modal = document.getElementById('styleguide-modal');
    const contentDiv = document.getElementById('styleguide-content');
    
    contentDiv.innerHTML = content;
    modal.classList.add('show');
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

// Close style guide modal
function closeStyleGuideModal() {
    const modal = document.getElementById('styleguide-modal');
    modal.classList.remove('show');
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
}

// Download style guide as PDF
function downloadStyleGuidePDF() {
    try {
        console.log('PDF download button clicked!');
        const deepestLevel = getDeepestLevelValue() || 'Product';
        const categoryLevel = currentSelection.category || currentSelection.department || 'General';
        
        console.log('Generating PDF with data:', { deepestLevel, categoryLevel });
        
        const basicProductData = {
            title: `Sample ${deepestLevel}`,
            description: `High-quality ${deepestLevel.toLowerCase()} from our ${categoryLevel.toLowerCase()} collection.`,
            price: '$0.00',
            brand: 'Sample Brand',
            material: 'Sample Material',
            color: 'Sample Color',
            size: 'One Size',
            image: ''
        };
        
        showPDFStatus('Generating PDF from style guide...', 'info');
        generateComprehensivePDF(basicProductData);
    } catch (error) {
        console.error('Error in downloadStyleGuidePDF:', error);
        showPDFStatus('Error generating PDF. Please try again.', 'error');
        setTimeout(() => {
            hidePDFStatus();
        }, 5000);
    }
}

// Copy style guide content to clipboard
function copyStyleGuideContent() {
    const content = document.getElementById('styleguide-content');
    const textContent = content.innerText;
    
    navigator.clipboard.writeText(textContent).then(() => {
        showTemporaryMessage('Style guide content copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showTemporaryMessage('Style guide content copied to clipboard!');
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update style guide output
function updateStyleGuide() {
    const outputDiv = document.getElementById('style-guide-output');
    
    if (!hasValidSelection()) {
        outputDiv.innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-arrow-up"></i>
                <p>Select a product category above to generate your style guide</p>
            </div>
        `;
        disableExportButtons();
        return;
    }
    
    const styleGuide = generateStyleGuide();
    outputDiv.innerHTML = styleGuide;
    enableExportButtons();
}

// Generate style guide content
function generateStyleGuide() {
    const path = getCurrentPath();
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `
        <div class="style-guide-content">
            <div class="style-guide-header">
                <h3><i class="fas fa-file-alt"></i> Product Style Guide</h3>
                <div class="metadata">
                    <span class="date">Generated: ${timestamp}</span>
                    <span class="taxonomy">Google Product Taxonomy 2021-09-21</span>
                </div>
            </div>
            
            ${generateProductOverview()}
            
            ${generateVisualMediaAssets()}
            
            ${generateProductSpecifications()}
            
            ${generateSizeFitGuidance()}
            
            ${generateCrossSellingPersonalization()}
            
            ${generateCustomerEngagement()}
            
            ${generateDiscoverabilityShelfPlacement()}
            
            <div class="category-info">
                <h4>Category Classification</h4>
                <div class="classification-path">
                    <strong>Full Path:</strong> ${path}
                </div>
                <div class="classification-details">
                    <div class="detail-item">
                        <label>Department (Level 1):</label>
                        <span>${currentSelection.department || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Category (Level 2):</label>
                        <span>${currentSelection.category || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Sub-category (Level 3):</label>
                        <span>${currentSelection.subcategory || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Product Type (Level 4):</label>
                        <span>${currentSelection.producttype || 'Not specified'}</span>
                    </div>
                </div>
            </div>
            
            <div class="seo-guidelines">
                <h4>SEO Guidelines</h4>
                <ul>
                    <li><strong>Product Title:</strong> Include "${currentSelection.producttype || currentSelection.subcategory || currentSelection.category}" for optimal search visibility</li>
                    <li><strong>Meta Description:</strong> Reference the category path for better categorization</li>
                    <li><strong>Keywords:</strong> Use variations of "${getCurrentPathKeywords()}"</li>
                    <li><strong>Category Breadcrumbs:</strong> Implement hierarchical navigation matching this taxonomy</li>
                </ul>
            </div>
        </div>
    `;
}

// Generate product overview section
function generateProductOverview() {
    const productType = getDeepestLevelValue();
    const category = currentSelection.category || currentSelection.department;
    const overviewData = getProductOverviewData();
    
    return `
        <div class="product-overview">
            <h4><i class="fas fa-info-circle"></i> Product Overview</h4>
            
            <div class="overview-section">
                <h5>Title</h5>
                <div class="overview-content">
                    <strong>Example:</strong> ${overviewData.title}
                </div>
            </div>
            
            <div class="overview-section">
                <h5>Short Description</h5>
                <div class="overview-content">
                    ${overviewData.shortDescription}
                </div>
            </div>
            
            <div class="overview-section">
                <h5>Long Description</h5>
                <div class="overview-content">
                    ${overviewData.longDescription}
                </div>
            </div>
            
            <div class="overview-section">
                <h5>Key Features</h5>
                <ul class="feature-list">
                    ${overviewData.keyFeatures.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            
            <div class="overview-section">
                <h5>Certifications & Compliance</h5>
                <ul class="compliance-list">
                    <li><strong>Google Category ID:</strong> ${overviewData.categoryId}</li>
                    ${overviewData.certifications.map(cert => `<li>${cert}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Generate Category Manager instruction manual for modal
function generateProductOverviewForModal() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    const overviewData = getProductOverviewData();
    
    // Generate intelligent instructions based on product type
    const instructions = generateCategoryManagerInstructions(productType, department, category, subcategory);
    
    return `
        <div class="instruction-manual" style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="color: #1e40af; margin-bottom: 1rem;">📋 Category Manager Instructions</h4>
            <p style="color: #64748b; margin-bottom: 1rem;">Follow these AI-generated guidelines to create compelling product content for <strong>${productType}</strong>:</p>
        </div>

        <div class="instruction-section">
            <h4>1. Product Title Guidelines</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${instructions.titleGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                </ul>
            </div>
            <div class="example-box" style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <strong>✅ Example for ${productType}:</strong><br>
                <span style="font-size: 1.1em; color: #0369a1;">${overviewData.title}</span>
            </div>
        </div>

        <div class="instruction-section">
            <h4>2. Short Description Guidelines</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${instructions.descriptionGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                </ul>
            </div>
            <div class="example-box" style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <strong>✅ Example for ${productType}:</strong><br>
                <span style="color: #0369a1;">${overviewData.shortDescription}</span>
            </div>
        </div>

        <div class="instruction-section">
            <h4>3. Key Features Guidelines</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${instructions.featuresGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                </ul>
            </div>
            <div class="example-box" style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <strong>✅ Example Features for ${productType}:</strong>
                <ul class="guidelines-list" style="margin-top: 0.5rem;">
                    ${overviewData.keyFeatures.slice(0, 8).map(feature => `<li style="color: #0369a1;">${feature}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="instruction-section">
            <h4>4. Category-Specific Tips</h4>
            <div class="tips-content" style="background: #f0f9ff; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${instructions.categoryTips.map(tip => `<li style="color: #0c4a6e;">${tip}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="compliance-section">
            <h4>5. Certifications & Compliance</h4>
            <div class="detail-value" style="background: #f0fdf4; padding: 1rem; border-radius: 6px;">
                <ul class="guidelines-list">
                    <li><strong>Google Category ID:</strong> ${overviewData.categoryId}</li>
                    ${overviewData.certifications.map(cert => `<li>${cert}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Generate intelligent Category Manager instructions based on product type
function generateCategoryManagerInstructions(productType, department, category, subcategory) {
    const normalizedProductType = productType.toLowerCase();
    
    // Default instructions
    let instructions = {
        titleGuidelines: [
            'Start with the brand name for immediate recognition',
            'Include the specific product type clearly',
            'Add model name or style identifier if applicable',
            'Keep it concise yet descriptive (under 70 characters)',
            'Avoid redundant words and marketing fluff'
        ],
        descriptionGuidelines: [
            'Write 2-3 complete, engaging sentences',
            'Mention brand, product type, and primary benefit',
            'Include intended use or target audience',
            'Use natural, informative language',
            'Avoid repeating key features listed below'
        ],
        featuresGuidelines: [
            'List 8-10 features in order of importance',
            'Include technical specifications and measurements',
            'Mention unique selling points and differentiators',
            'Add certifications and compatibility information',
            'Use specific terms, avoid vague descriptions',
            'Include warranty and support information'
        ],
        categoryTips: [
            'Focus on benefits that matter to your target customer',
            'Use industry-standard terminology for better searchability',
            'Consider seasonal or trending keywords when applicable'
        ]
    };
    
    // Customize instructions based on specific product types
    
    // Kitchen Appliances
    if (normalizedProductType.includes('juicer') || normalizedProductType.includes('blender') || normalizedProductType.includes('coffee')) {
        instructions = {
            titleGuidelines: [
                'Start with brand name (e.g., "Philips", "Breville", "Cuisinart")',
                'Include product line/collection name if available',
                'Specify the appliance type and key function',
                'Add model number for professional identification',
                'Include size/capacity if it\'s a key differentiator'
            ],
            descriptionGuidelines: [
                'Highlight the primary function and efficiency',
                'Mention ideal kitchen size or user type',
                'Include standout technology or ease-of-use features',
                'Keep it practical and benefit-focused',
                'Appeal to both functionality and convenience'
            ],
            featuresGuidelines: [
                'Lead with motor power/performance specifications',
                'Include key convenience features (easy cleaning, etc.)',
                'Mention design aspects (compact, space-saving)',
                'Add safety and spill-prevention features',
                'List dishwasher-safe components',
                'Include material safety certifications (BPA-free)',
                'Specify warranty period and coverage',
                'Add any smart/connectivity features'
            ],
            categoryTips: [
                'Kitchen appliance buyers prioritize functionality over aesthetics',
                'Emphasize time-saving and convenience benefits',
                'Include capacity/serving size information for family planning',
                'Mention energy efficiency for eco-conscious consumers'
            ]
        };
    }
    
    // Footwear
    else if (normalizedProductType.includes('shoe') || normalizedProductType.includes('sneaker') || normalizedProductType.includes('boot')) {
        instructions = {
            titleGuidelines: [
                'Start with brand name (e.g., "Nike", "Adidas", "Allbirds")',
                'Include shoe line/model name',
                'Specify gender and intended use',
                'Add color as the final identifier',
                'Keep under 60 characters for mobile display'
            ],
            descriptionGuidelines: [
                'Highlight primary use case (running, casual, work)',
                'Mention key technology or comfort features',
                'Include target activity or lifestyle',
                'Focus on fit, comfort, and performance benefits',
                'Use active, engaging language'
            ],
            featuresGuidelines: [
                'Lead with cushioning/comfort technology',
                'Include upper material and breathability',
                'Mention sole design and traction features',
                'Add fit and sizing information',
                'Include durability and construction details',
                'Mention any special performance features',
                'Add care and maintenance information',
                'Include available size range and widths'
            ],
            categoryTips: [
                'Footwear customers care about fit, comfort, and durability',
                'Use sport/activity-specific terminology for athletic shoes',
                'Mention seasonal appropriateness for outdoor footwear',
                'Include style versatility for fashion-conscious buyers'
            ]
        };
    }
    
    // Electronics
    else if (normalizedProductType.includes('phone') || normalizedProductType.includes('laptop') || normalizedProductType.includes('tablet')) {
        instructions = {
            titleGuidelines: [
                'Start with brand name (e.g., "Apple", "Samsung", "Dell")',
                'Include product line and model',
                'Add key specifications (storage, screen size)',
                'Include color/finish as final identifier',
                'Be precise with technical details'
            ],
            descriptionGuidelines: [
                'Highlight primary use case and target user',
                'Mention standout technology or performance',
                'Include key productivity or entertainment features',
                'Focus on what makes this model unique',
                'Balance technical details with user benefits'
            ],
            featuresGuidelines: [
                'Lead with processor/performance specifications',
                'Include display technology and size',
                'Mention storage capacity and expandability',
                'Add battery life and charging features',
                'Include camera/audio capabilities',
                'Mention connectivity options',
                'Add security and privacy features',
                'Include warranty and support information'
            ],
            categoryTips: [
                'Tech buyers want specific performance metrics',
                'Include compatibility with other devices/services',
                'Mention software features and updates',
                'Consider both professional and personal use cases'
            ]
        };
    }
    
    // Apparel
    else if (department?.includes('Apparel') || category?.includes('Clothing')) {
        instructions = {
            titleGuidelines: [
                'Start with brand name (e.g., "Patagonia", "Levi\'s", "Nike")',
                'Include garment type and style',
                'Add gender specification if applicable',
                'Include size and color as identifiers',
                'Keep fashion-forward and appealing'
            ],
            descriptionGuidelines: [
                'Highlight style, fit, and versatility',
                'Mention fabric technology or special features',
                'Include appropriate occasions or seasons',
                'Focus on comfort, style, and functionality',
                'Appeal to lifestyle and values'
            ],
            featuresGuidelines: [
                'Lead with fabric composition and technology',
                'Include fit type and sizing information',
                'Mention functional features (pockets, zippers)',
                'Add care and maintenance instructions',
                'Include sustainability certifications',
                'Mention seasonal appropriateness',
                'Add style versatility and layering options',
                'Include available colors and sizes'
            ],
            categoryTips: [
                'Apparel buyers care about fit, style, and versatility',
                'Mention fabric feel and comfort for everyday wear',
                'Include sustainability credentials for conscious consumers',
                'Consider both function and fashion in descriptions'
            ]
        };
    }
    
    // Beauty & Personal Care
    else if (normalizedProductType.includes('serum') || normalizedProductType.includes('moisturizer') || normalizedProductType.includes('cream')) {
        instructions = {
            titleGuidelines: [
                'Start with brand name (e.g., "The Ordinary", "CeraVe")',
                'Include active ingredient percentage if applicable',
                'Specify product type and primary benefit',
                'Add size/volume as final identifier',
                'Keep clinical yet accessible'
            ],
            descriptionGuidelines: [
                'Highlight primary skin benefit and active ingredients',
                'Mention suitable skin types or concerns',
                'Include usage frequency and application method',
                'Focus on results and skin health benefits',
                'Use clean, trustworthy language'
            ],
            featuresGuidelines: [
                'Lead with active ingredients and concentrations',
                'Include skin type compatibility',
                'Mention application method and frequency',
                'Add safety and patch test information',
                'Include packaging and hygiene features',
                'Mention fragrance-free or hypoallergenic properties',
                'Add shelf life and storage instructions',
                'Include dermatologist testing or certifications'
            ],
            categoryTips: [
                'Beauty consumers want ingredient transparency',
                'Include skin type recommendations for better matching',
                'Mention routine placement (morning/evening)',
                'Focus on long-term skin health benefits'
            ]
        };
    }
    
    return instructions;
}

// Generate visual media assets section
function generateVisualMediaAssets() {
    const mediaData = getVisualMediaAssetsData();
    
    return `
        <div class="visual-media-assets">
            <h4><i class="fas fa-images"></i> Visual & Rich Media Assets</h4>
            
            <div class="media-section">
                <h5>Primary Image</h5>
                <div class="media-content">
                    ${mediaData.primaryImage}
                </div>
            </div>
            
            <div class="media-section">
                <h5>Additional Views</h5>
                <ul class="media-list">
                    ${mediaData.additionalViews.map(view => `<li>${view}</li>`).join('')}
                </ul>
            </div>
            
            <div class="media-section">
                <h5>Image Types</h5>
                <ul class="media-list">
                    ${mediaData.imageTypes.map(type => `<li><strong>${type.name}:</strong> ${type.description}</li>`).join('')}
                </ul>
            </div>
            
            <div class="media-section">
                <h5>Rich Media</h5>
                <ul class="media-list">
                    ${mediaData.richMedia.map(media => `<li>${media}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Generate Category Manager instruction manual for Visual & Rich Media Assets
function generateVisualMediaAssetsForModal() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Generate intelligent media instructions based on product type
    const mediaInstructions = generateVisualMediaInstructions(productType, department, category, subcategory);
    
    return `
        <div class="instruction-manual" style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="color: #1e40af; margin-bottom: 1rem;">📸 Visual & Rich Media Assets Instructions</h4>
            <p style="color: #64748b; margin-bottom: 1rem;">Follow these AI-generated guidelines to create compelling visual content for <strong>${productType}</strong>:</p>
        </div>

        <div class="instruction-section">
            <h4>1. Required High-Resolution Images (6-7 images)</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${mediaInstructions.imageRequirements.map(requirement => `<li>${requirement}</li>`).join('')}
                </ul>
            </div>
            <div class="example-box" style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <strong>✅ Example Image Set for ${productType}:</strong>
                <ul class="guidelines-list" style="margin-top: 0.5rem;">
                    ${mediaInstructions.exampleImages.map(image => `<li style="color: #0369a1;">${image}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="instruction-section">
            <h4>2. Video Content Guidelines</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${mediaInstructions.videoGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                </ul>
            </div>
            <div class="example-box" style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <strong>✅ Example Video for ${productType}:</strong><br>
                <span style="color: #0369a1;">${mediaInstructions.exampleVideo}</span>
            </div>
        </div>

        <div class="instruction-section">
            <h4>3. Technical Specifications</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${mediaInstructions.technicalSpecs.map(spec => `<li>${spec}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="instruction-section">
            <h4>4. Product-Specific Media Tips</h4>
            <div class="tips-content" style="background: #f0f9ff; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${mediaInstructions.productTips.map(tip => `<li style="color: #0c4a6e;">${tip}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="quality-section">
            <h4>5. Quality Standards</h4>
            <div class="detail-value" style="background: #f0fdf4; padding: 1rem; border-radius: 6px;">
                <ul class="guidelines-list">
                    ${mediaInstructions.qualityStandards.map(standard => `<li>${standard}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Generate intelligent Visual Media instructions based on product type
function generateVisualMediaInstructions(productType, department, category, subcategory) {
    const normalizedProductType = productType.toLowerCase();
    
    // Default media instructions
    let mediaInstructions = {
        imageRequirements: [
            'Include 6-7 high-resolution images (minimum 1200x1200 pixels)',
            'Capture front view as primary hero image',
            'Include back view and side view for complete product visibility',
            'Add close-up shots of key features and details',
            'Include lifestyle/in-use image showing product context',
            'Add packaging image if relevant to customer decision',
            'Ensure consistent lighting and neutral background'
        ],
        exampleImages: [
            'Front view: Clean, centered product shot',
            'Back view: Showing rear features and connections',
            'Side view: Profile highlighting thickness/depth',
            'Close-up: Key features and quality details',
            'Lifestyle: Product in typical use environment',
            'Packaging: Box and included accessories',
            'Detail shots: Texture, materials, craftsmanship'
        ],
        videoGuidelines: [
            'Create a 360° rotation video (30-60 seconds)',
            'Include demonstration video showing product in use',
            'Show assembly/setup process if applicable',
            'Highlight key features through motion',
            'Ensure smooth, professional camera work',
            'Add subtle background music and clear audio'
        ],
        exampleVideo: 'A 360° video showing the product being assembled, used, and key features demonstrated.',
        technicalSpecs: [
            'Use consistent lighting (soft, diffused light preferred)',
            'Maintain neutral background (white or light gray)',
            'Ensure high resolution: minimum 1200x1200 for images',
            'Video resolution: minimum 1080p HD',
            'File formats: JPEG for images, MP4 for videos',
            'Color accuracy: calibrated monitors for editing'
        ],
        productTips: [
            'Focus on benefits that matter to your target customer',
            'Show scale and size context with lifestyle shots',
            'Highlight unique design elements and quality indicators',
            'Consider seasonal or trending visual styles'
        ],
        qualityStandards: [
            'All images must be high-resolution and professionally shot',
            'Consistent brand styling across all visual assets',
            'Accurate color representation of actual product',
            'Clean, distraction-free backgrounds',
            'Proper lighting to show true product details'
        ]
    };
    
    // Customize instructions based on specific product types
    
    // Kitchen Appliances
    if (normalizedProductType.includes('juicer') || normalizedProductType.includes('blender') || normalizedProductType.includes('coffee')) {
        mediaInstructions = {
            imageRequirements: [
                'Include 6-7 high-resolution images showing appliance from all angles',
                'Front view: Main control panel and design visible',
                'Back view: Power cord, ventilation, and connections',
                'Side view: Profile showing counter space requirements',
                'Close-up: Control buttons, display, and key features',
                'Lifestyle: Kitchen setting with ingredients/food prep',
                'Components: Removable parts and accessories laid out',
                'Packaging: Box with included accessories visible'
            ],
            exampleImages: [
                'Front view: Philips juicer centered, showing control dial and spout',
                'Back view: Power cord, motor ventilation, stability features',
                'Side view: Compact profile, pulp container visibility',
                'Close-up: QuickClean technology parts and drip-stop spout',
                'Lifestyle: Kitchen counter with fresh fruits ready for juicing',
                'Components: Juicing cup, pulp container, cleaning brush laid out',
                'Packaging: Retail box showing product and key features'
            ],
            videoGuidelines: [
                'Create 360° rotation showing all sides and features',
                'Demonstrate assembly: attaching components step-by-step',
                'Show juicing process: adding ingredients and extraction',
                'Highlight cleaning process: disassembly and washing',
                'Include before/after shots of ingredients to juice',
                'Show compact storage and counter space efficiency'
            ],
            exampleVideo: 'A 360° video showing the Philips juicer being assembled, fruits being juiced with smooth extraction, and easy disassembly for cleaning with QuickClean technology.',
            technicalSpecs: [
                'Use bright, clean kitchen lighting to show functionality',
                'White/light gray background to emphasize cleanliness',
                'High resolution to show material quality and safety features',
                'Video should be 60-90 seconds for full demonstration',
                'Include close-up shots of safety features and BPA-free materials',
                'Show actual juice extraction and pulp separation'
            ],
            productTips: [
                'Emphasize ease of cleaning and maintenance',
                'Show compact design fitting various kitchen sizes',
                'Highlight quiet operation and efficiency',
                'Include shots of healthy juice results and minimal waste'
            ],
            qualityStandards: [
                'Food-grade material visibility must be clear',
                'Safety features should be prominently displayed',
                'Actual performance demonstration required',
                'Clean, hygienic presentation throughout',
                'Accurate size representation for counter planning'
            ]
        };
    }
    
    // Footwear
    else if (normalizedProductType.includes('shoe') || normalizedProductType.includes('sneaker') || normalizedProductType.includes('boot')) {
        mediaInstructions = {
            imageRequirements: [
                'Include 6-7 high-resolution images showing footwear details',
                'Front view: Toe box design and overall silhouette',
                'Back view: Heel design, logo placement, and support features',
                'Side view: Profile showing arch support and design lines',
                'Close-up: Material texture, stitching, and quality details',
                'Sole view: Tread pattern and cushioning technology',
                'Lifestyle: Person wearing shoes in appropriate activity',
                'Packaging: Shoe box and any included accessories'
            ],
            exampleImages: [
                'Front view: Nike running shoe showing breathable mesh and toe protection',
                'Back view: Heel counter, reflective elements, brand logo',
                'Side view: Midsole cushioning technology and design flow',
                'Close-up: Flyknit upper material and precision stitching',
                'Sole view: Waffle outsole pattern and flex grooves',
                'Lifestyle: Runner on trail showing shoes in natural environment',
                'Packaging: Nike box with tissue paper and shoe care guide'
            ],
            videoGuidelines: [
                'Create 360° rotation highlighting design from all angles',
                'Show flexibility and bend testing of sole',
                'Demonstrate lacing system and fit adjustment',
                'Include walking/running motion to show performance',
                'Highlight breathability and comfort features',
                'Show size range and available colorways'
            ],
            exampleVideo: 'A 360° video showing Nike running shoes with detailed views of Flyknit technology, sole flexibility demonstration, and runner testing the shoes on various terrains.',
            technicalSpecs: [
                'Use natural lighting to show true material colors',
                'Neutral background to highlight shoe design',
                'Macro photography for material and stitching details',
                'Video should show actual foot movement and flexibility',
                'High contrast lighting to show tread patterns clearly',
                'Color accuracy crucial for online shoe shopping'
            ],
            productTips: [
                'Show versatility across different activities and outfits',
                'Highlight comfort technology and support features',
                'Include size and fit guidance through visual cues',
                'Demonstrate durability through material close-ups'
            ],
            qualityStandards: [
                'True-to-life color representation essential',
                'Material texture must be clearly visible',
                'Stitching and construction quality prominently shown',
                'Accurate sizing representation with scale references',
                'Comfort and performance features clearly demonstrated'
            ]
        };
    }
    
    // Electronics
    else if (normalizedProductType.includes('phone') || normalizedProductType.includes('laptop') || normalizedProductType.includes('tablet')) {
        mediaInstructions = {
            imageRequirements: [
                'Include 6-7 high-resolution images showing device details',
                'Front view: Screen and interface in powered-on state',
                'Back view: Camera system, logo, and design elements',
                'Side view: Ports, buttons, and thickness profile',
                'Close-up: Premium materials, finish, and build quality',
                'Screen detail: Display quality and interface elements',
                'Lifestyle: Device in typical use scenarios',
                'Accessories: Charger, case, and included items'
            ],
            exampleImages: [
                'Front view: iPhone displaying home screen with vibrant colors',
                'Back view: Camera module, Apple logo, premium finish',
                'Side view: Lightning port, volume buttons, power button',
                'Close-up: Aerospace-grade aluminum frame and glass back',
                'Screen detail: Super Retina display showing sharp text and images',
                'Lifestyle: Professional using phone for photography and work',
                'Accessories: Lightning cable, adapter, and documentation'
            ],
            videoGuidelines: [
                'Create 360° rotation showing premium build quality',
                'Demonstrate key features: camera, display, performance',
                'Show user interface responsiveness and speed',
                'Highlight unique features like Face ID or fingerprint',
                'Include size comparison with common objects',
                'Demonstrate battery life and charging capabilities'
            ],
            exampleVideo: 'A 360° video showing iPhone with detailed camera demonstration, Face ID setup, display quality tests, and performance benchmarks in real-world usage.',
            technicalSpecs: [
                'Use controlled lighting to prevent screen glare',
                'High-resolution photography to show pixel density',
                'Accurate color representation for display quality',
                'Video should demonstrate actual performance speeds',
                'Clean, tech-focused background (white or black)',
                'Macro photography for premium material details'
            ],
            productTips: [
                'Emphasize premium build quality and materials',
                'Show performance capabilities through demonstrations',
                'Highlight ecosystem integration and compatibility',
                'Include productivity and entertainment use cases'
            ],
            qualityStandards: [
                'Display quality must be accurately represented',
                'Premium materials and finish clearly visible',
                'Performance demonstrations must be authentic',
                'Size and weight context provided through comparisons',
                'Technical specifications visually supported'
            ]
        };
    }
    
    // Apparel
    else if (department?.includes('Apparel') || category?.includes('Clothing')) {
        mediaInstructions = {
            imageRequirements: [
                'Include 6-7 high-resolution images showing garment details',
                'Front view: Full garment on model or flat lay',
                'Back view: Design details, fit, and styling',
                'Side view: Silhouette and fit profile',
                'Close-up: Fabric texture, stitching, and quality details',
                'Detail shots: Buttons, zippers, pockets, and hardware',
                'Lifestyle: Model wearing garment in appropriate setting',
                'Care label: Fabric composition and care instructions'
            ],
            exampleImages: [
                'Front view: Patagonia jacket on model, zipped and styled',
                'Back view: Ventilation panels and reflective details',
                'Side view: Fitted silhouette and length proportions',
                'Close-up: DWR-treated fabric texture and water repellency',
                'Detail shots: YKK zippers, adjustable hood, and pocket design',
                'Lifestyle: Hiker wearing jacket in mountain environment',
                'Care label: Recycled polyester content and washing instructions'
            ],
            videoGuidelines: [
                'Show garment movement and drape on model',
                'Demonstrate functional features: zippers, adjustments',
                'Include fabric feel and texture close-ups',
                'Show versatility in different styling options',
                'Highlight weather resistance or special properties',
                'Include size range representation on different body types'
            ],
            exampleVideo: 'A video showing Patagonia jacket worn in various weather conditions, demonstrating water resistance, breathability, and versatile styling from outdoor to urban settings.',
            technicalSpecs: [
                'Use natural lighting to show true fabric colors',
                'High resolution to capture fabric weave and texture',
                'Consistent model poses for size comparison',
                'Color-accurate photography for online shopping',
                'Detail photography for quality assessment',
                'Video should show natural movement and drape'
            ],
            productTips: [
                'Show versatility across seasons and occasions',
                'Highlight sustainable and ethical production features',
                'Include fit guidance through model representation',
                'Demonstrate care and longevity through quality details'
            ],
            qualityStandards: [
                'Accurate color representation crucial for apparel',
                'Fabric texture and quality clearly visible',
                'Fit and sizing accurately represented',
                'Construction details prominently displayed',
                'Sustainability credentials visually supported'
            ]
        };
    }
    
    // Beauty & Personal Care
    else if (normalizedProductType.includes('serum') || normalizedProductType.includes('moisturizer') || normalizedProductType.includes('cream')) {
        mediaInstructions = {
            imageRequirements: [
                'Include 6-7 high-resolution images showing product details',
                'Front view: Product packaging with clear labeling',
                'Back view: Ingredients list and usage instructions',
                'Side view: Product size and volume indication',
                'Close-up: Texture, consistency, and application view',
                'Pump/dispenser: Application method and portion control',
                'Lifestyle: Product in bathroom/skincare routine setting',
                'Before/after: Skin improvement results (if applicable)'
            ],
            exampleImages: [
                'Front view: The Ordinary Hyaluronic Acid serum with clear labeling',
                'Back view: Complete ingredients list and concentration details',
                'Side view: 30ml dropper bottle showing volume and size',
                'Close-up: Clear serum texture and dropper application',
                'Application: Serum being applied to clean skin',
                'Lifestyle: Product arranged with other skincare essentials',
                'Packaging: Minimalist box with product information'
            ],
            videoGuidelines: [
                'Show product texture and consistency through application',
                'Demonstrate proper application technique and amount',
                'Include absorption rate and skin feel demonstration',
                'Show integration into skincare routine sequence',
                'Highlight key ingredients through visual elements',
                'Include packaging sustainability features'
            ],
            exampleVideo: 'A video showing The Ordinary serum application technique, demonstrating lightweight texture, quick absorption, and integration into morning skincare routine.',
            technicalSpecs: [
                'Use clean, bright lighting for clinical appearance',
                'White background to emphasize product purity',
                'Macro photography for texture and consistency details',
                'Color-accurate representation of product and packaging',
                'High resolution to show ingredient transparency',
                'Clean, hygienic presentation throughout'
            ],
            productTips: [
                'Emphasize ingredient transparency and clinical efficacy',
                'Show product integration into existing routines',
                'Highlight gentle formulation and skin compatibility',
                'Include education about active ingredients and benefits'
            ],
            qualityStandards: [
                'Ingredient transparency must be clearly visible',
                'Clinical, trustworthy presentation required',
                'Texture and consistency accurately represented',
                'Hygienic, clean aesthetic throughout',
                'Educational value in visual presentation'
            ]
        };
    }
    
    return mediaInstructions;
}

// Generate product specifications section
function generateProductSpecifications() {
    const specsData = getProductSpecificationsData();
    
    return `
        <div class="product-specifications">
            <h4><i class="fas fa-cogs"></i> Product Specifications</h4>
            
            <div class="specs-section">
                <h5>Variants</h5>
                <div class="specs-grid">
                    ${Object.entries(specsData.variants).map(([key, values]) => `
                        <div class="spec-item">
                            <strong>${key}:</strong> ${Array.isArray(values) ? values.join(', ') : values}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="specs-section">
                <h5>Attributes</h5>
                <div class="specs-grid">
                    ${Object.entries(specsData.attributes).map(([key, value]) => `
                        <div class="spec-item">
                            <strong>${key}:</strong> ${value}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Generate Product Attributes with standardized values for modal
function generateProductAttributesForModal() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Get standardized product attributes
    const attributeData = getStandardizedProductAttributes(productType, department, category, subcategory);
    
    return `
        <div class="instruction-manual" style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="color: #1e40af; margin-bottom: 1rem;">🏷️ Product Attributes Instructions</h4>
            <p style="color: #64748b; margin-bottom: 1rem;">Use standardized attribute values for <strong>${productType}</strong> to ensure proper filtering, search, and personalization:</p>
        </div>

        <div class="attributes-section">
            <h4>High Priority Attributes (Required)</h4>
            <div class="attributes-grid" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <div class="detail-grid">
                    ${attributeData.highPriority.map(attr => `
                        <div class="detail-label" style="font-weight: bold; color: #92400e;">${attr.attribute}:</div>
                        <div class="detail-value" style="color: #451a03;">${attr.value}</div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="attributes-section">
            <h4>Medium Priority Attributes (Important)</h4>
            <div class="attributes-grid" style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <div class="detail-grid">
                    ${attributeData.mediumPriority.map(attr => `
                        <div class="detail-label" style="font-weight: bold; color: #0369a1;">${attr.attribute}:</div>
                        <div class="detail-value" style="color: #0c4a6e;">${attr.value}</div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="attributes-section">
            <h4>Low Priority Attributes (Additional)</h4>
            <div class="attributes-grid" style="background: #f0f9ff; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <div class="detail-grid">
                    ${attributeData.lowPriority.map(attr => `
                        <div class="detail-label" style="font-weight: bold; color: #1e40af;">${attr.attribute}:</div>
                        <div class="detail-value" style="color: #1e3a8a;">${attr.value}</div>
                    `).join('')}
                </div>
            </div>
        </div>

        ${attributeData.conditional.length > 0 ? `
            <div class="attributes-section">
                <h4>Conditional Attributes (Product-Specific)</h4>
                <div class="attributes-grid" style="background: #f0fdf4; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                    <div class="detail-grid">
                        ${attributeData.conditional.map(attr => `
                            <div class="detail-label" style="font-weight: bold; color: #166534;">${attr.attribute}:</div>
                            <div class="detail-value" style="color: #14532d;">${attr.value}</div>
                        `).join('')}
                    </div>
                </div>
            </div>
        ` : ''}

        <div class="quality-standards" style="background: #fef7ff; padding: 1rem; border-radius: 6px;">
            <h5 style="color: #7c2d12; margin-bottom: 0.5rem;">📋 Quality Standards:</h5>
            <ul class="guidelines-list" style="margin: 0; color: #7c2d12;">
                <li>All values follow Google Product Taxonomy standards</li>
                <li>Attributes ensure optimal filtering and search functionality</li>
                <li>Values support personalization algorithms</li>
                <li>Consistent with internal schema and controlled vocabulary</li>
            </ul>
        </div>
    `;
}

// Generate intelligent Product Attribute instructions based on product type
function generateProductAttributeInstructions(productType, department, category, subcategory) {
    const normalizedProductType = productType.toLowerCase();
    
    // Default attribute instructions
    let attributeInstructions = {
        highPriority: [
            { name: 'Brand', description: 'Manufacturer or brand name (required for all products)' },
            { name: 'Type', description: 'Product category or type classification' },
            { name: 'Color', description: 'Primary color or color family' },
            { name: 'Size', description: 'Size designation or dimension category' },
            { name: 'Material', description: 'Primary material composition' },
            { name: 'Style', description: 'Design style or aesthetic category' }
        ],
        highPriorityExample: [
            { attribute: 'Brand', value: 'Premium Brand' },
            { attribute: 'Type', value: 'Product Type' },
            { attribute: 'Color', value: 'White' },
            { attribute: 'Size', value: 'Standard' },
            { attribute: 'Material', value: 'Premium Material' },
            { attribute: 'Style', value: 'Modern' }
        ],
        mediumPriority: [
            { name: 'Fit', description: 'How the product fits or sizing characteristics' },
            { name: 'Functionality', description: 'Primary function or use case' },
            { name: 'Seasonality', description: 'Seasonal appropriateness or usage' }
        ],
        mediumPriorityExample: [
            { attribute: 'Fit', value: 'Regular' },
            { attribute: 'Functionality', value: 'Multi-purpose' },
            { attribute: 'Seasonality', value: 'All Season' }
        ],
        lowPriority: [
            { name: 'Pattern', description: 'Design pattern or texture details' },
            { name: 'Country of Origin', description: 'Manufacturing country' },
            { name: 'Manufacturer', description: 'Manufacturing company details' }
        ],
        lowPriorityExample: [
            { attribute: 'Pattern', value: 'Solid' },
            { attribute: 'Country of Origin', value: 'Various' },
            { attribute: 'Manufacturer', value: 'OEM Manufacturer' }
        ],
        conditionalGuidelines: [
            'Include Designer attribute for luxury or designer products',
            'Add Sports Team for sports merchandise',
            'Include Animal Type for pet products',
            'Add specific technical attributes for electronics'
        ],
        conditionalExample: [],
        qualityStandards: [
            'Use standardized values from Google Product Taxonomy',
            'Ensure all high-priority attributes are complete',
            'Maintain consistency across similar products',
            'Validate attribute values against internal schema',
            'Review completeness for filtering and search functionality'
        ]
    };
    
    // Customize instructions based on specific product types
    
    // Kitchen Appliances
    if (normalizedProductType.includes('juicer') || normalizedProductType.includes('blender') || normalizedProductType.includes('coffee')) {
        attributeInstructions = {
            highPriority: [
                { name: 'Brand', description: 'Appliance manufacturer (e.g., Philips, Breville, Cuisinart)' },
                { name: 'Type', description: 'Appliance category (Juicer, Blender, Coffee Maker)' },
                { name: 'Color', description: 'Primary exterior color' },
                { name: 'Material', description: 'Primary construction material (BPA-free plastic, stainless steel)' },
                { name: 'Size', description: 'Size category (Compact, Standard, Large)' },
                { name: 'Style', description: 'Appliance design type (Centrifugal, Masticating, etc.)' }
            ],
            highPriorityExample: [
                { attribute: 'Brand', value: 'Philips' },
                { attribute: 'Type', value: 'Juicer' },
                { attribute: 'Color', value: 'White' },
                { attribute: 'Material', value: 'BPA-free plastic' },
                { attribute: 'Size', value: 'Compact' },
                { attribute: 'Style', value: 'Centrifugal' }
            ],
            mediumPriority: [
                { name: 'Functionality', description: 'Primary function and special features' },
                { name: 'Power', description: 'Motor power rating in watts' },
                { name: 'Capacity', description: 'Processing capacity or container size' }
            ],
            mediumPriorityExample: [
                { attribute: 'Functionality', value: 'Juice Extraction with QuickClean' },
                { attribute: 'Power', value: '500W' },
                { attribute: 'Capacity', value: '1.5L' }
            ],
            lowPriority: [
                { name: 'Pattern', description: 'Surface finish or texture' },
                { name: 'Country of Origin', description: 'Manufacturing country' },
                { name: 'Manufacturer', description: 'OEM or manufacturing partner' }
            ],
            lowPriorityExample: [
                { attribute: 'Pattern', value: 'Smooth finish' },
                { attribute: 'Country of Origin', value: 'Netherlands' },
                { attribute: 'Manufacturer', value: 'Philips Consumer Lifestyle' }
            ],
            conditionalGuidelines: [
                'Include Speed Settings for variable speed appliances',
                'Add Dishwasher Safe attribute for easy-clean products',
                'Include Warranty Period for customer confidence',
                'Add Energy Rating for eco-conscious consumers'
            ],
            conditionalExample: [
                { attribute: 'Speed Settings', value: '2-speed control' },
                { attribute: 'Dishwasher Safe', value: 'Yes (removable parts)' },
                { attribute: 'Warranty', value: '2 years' }
            ],
            qualityStandards: [
                'Use manufacturer specifications for technical attributes',
                'Ensure safety certifications are included',
                'Validate power ratings and capacity measurements',
                'Include all relevant kitchen appliance categories',
                'Maintain consistency with appliance standards'
            ]
        };
    }
    
    // Footwear
    else if (normalizedProductType.includes('shoe') || normalizedProductType.includes('sneaker') || normalizedProductType.includes('boot')) {
        attributeInstructions = {
            highPriority: [
                { name: 'Brand', description: 'Footwear brand (e.g., Nike, Adidas, Allbirds)' },
                { name: 'Type', description: 'Shoe category (Running Shoes, Sneakers, Boots)' },
                { name: 'Color', description: 'Primary colorway or color combination' },
                { name: 'Size', description: 'Size range and sizing system (US, EU, UK)' },
                { name: 'Material', description: 'Upper material (Leather, Mesh, Knit, Synthetic)' },
                { name: 'Style', description: 'Design style (Athletic, Casual, Formal, Outdoor)' }
            ],
            highPriorityExample: [
                { attribute: 'Brand', value: 'Nike' },
                { attribute: 'Type', value: 'Running Shoes' },
                { attribute: 'Color', value: 'Black/White' },
                { attribute: 'Size', value: 'US 6-13' },
                { attribute: 'Material', value: 'Flyknit Mesh' },
                { attribute: 'Style', value: 'Athletic Performance' }
            ],
            mediumPriority: [
                { name: 'Fit', description: 'Fit type and width options' },
                { name: 'Functionality', description: 'Intended use and performance features' },
                { name: 'Seasonality', description: 'Seasonal appropriateness' }
            ],
            mediumPriorityExample: [
                { attribute: 'Fit', value: 'True to size, Regular width' },
                { attribute: 'Functionality', value: 'Running and Training' },
                { attribute: 'Seasonality', value: 'All Season' }
            ],
            lowPriority: [
                { name: 'Pattern', description: 'Design pattern or colorway details' },
                { name: 'Country of Origin', description: 'Manufacturing location' },
                { name: 'Manufacturer', description: 'Production facility details' }
            ],
            lowPriorityExample: [
                { attribute: 'Pattern', value: 'Solid with accent colors' },
                { attribute: 'Country of Origin', value: 'Vietnam' },
                { attribute: 'Manufacturer', value: 'Nike Inc.' }
            ],
            conditionalGuidelines: [
                'Include Gender for gender-specific designs',
                'Add Sports Type for sport-specific shoes',
                'Include Width Options for fit variations',
                'Add Technology Features for performance shoes'
            ],
            conditionalExample: [
                { attribute: 'Gender', value: 'Unisex' },
                { attribute: 'Sports Type', value: 'Running' },
                { attribute: 'Width Options', value: 'Regular, Wide' }
            ],
            qualityStandards: [
                'Use standard shoe sizing conventions',
                'Include all available colorways',
                'Specify material composition accurately',
                'Maintain consistency with footwear categories',
                'Include performance and comfort attributes'
            ]
        };
    }
    
    // Electronics
    else if (normalizedProductType.includes('phone') || normalizedProductType.includes('laptop') || normalizedProductType.includes('tablet')) {
        attributeInstructions = {
            highPriority: [
                { name: 'Brand', description: 'Device manufacturer (Apple, Samsung, Dell, etc.)' },
                { name: 'Type', description: 'Device category (Smartphone, Laptop, Tablet)' },
                { name: 'Color', description: 'Device color option' },
                { name: 'Size', description: 'Screen size or form factor' },
                { name: 'Material', description: 'Build materials (Aluminum, Glass, Plastic)' },
                { name: 'Style', description: 'Design aesthetic (Premium, Business, Consumer)' }
            ],
            highPriorityExample: [
                { attribute: 'Brand', value: 'Apple' },
                { attribute: 'Type', value: 'Smartphone' },
                { attribute: 'Color', value: 'Space Gray' },
                { attribute: 'Size', value: '6.1-inch' },
                { attribute: 'Material', value: 'Aluminum and Glass' },
                { attribute: 'Style', value: 'Premium' }
            ],
            mediumPriority: [
                { name: 'Functionality', description: 'Primary use case and key features' },
                { name: 'Storage', description: 'Storage capacity options' },
                { name: 'Connectivity', description: 'Connection types and wireless capabilities' }
            ],
            mediumPriorityExample: [
                { attribute: 'Functionality', value: 'Photography and Communication' },
                { attribute: 'Storage', value: '128GB, 256GB, 512GB' },
                { attribute: 'Connectivity', value: '5G, WiFi 6, Bluetooth 5.0' }
            ],
            lowPriority: [
                { name: 'Pattern', description: 'Surface finish or texture' },
                { name: 'Country of Origin', description: 'Assembly location' },
                { name: 'Manufacturer', description: 'Manufacturing details' }
            ],
            lowPriorityExample: [
                { attribute: 'Pattern', value: 'Matte finish' },
                { attribute: 'Country of Origin', value: 'China' },
                { attribute: 'Manufacturer', value: 'Apple Inc.' }
            ],
            conditionalGuidelines: [
                'Include Processor Type for performance specifications',
                'Add Operating System for software compatibility',
                'Include Camera Specifications for photography features',
                'Add Battery Life for usage planning'
            ],
            conditionalExample: [
                { attribute: 'Processor', value: 'A15 Bionic chip' },
                { attribute: 'Operating System', value: 'iOS 15' },
                { attribute: 'Camera', value: '12MP Dual Camera System' }
            ],
            qualityStandards: [
                'Use official manufacturer specifications',
                'Include all storage and color variants',
                'Specify technical capabilities accurately',
                'Maintain consistency with tech product standards',
                'Include compatibility and system requirements'
            ]
        };
    }
    
    // Apparel
    else if (department?.includes('Apparel') || category?.includes('Clothing')) {
        attributeInstructions = {
            highPriority: [
                { name: 'Brand', description: 'Clothing brand or designer label' },
                { name: 'Type', description: 'Garment category (Jacket, Shirt, Pants, Dress)' },
                { name: 'Color', description: 'Primary color or color combination' },
                { name: 'Size', description: 'Size range available (XS-XXL, numerical)' },
                { name: 'Material', description: 'Fabric composition (Cotton, Polyester, Wool)' },
                { name: 'Style', description: 'Design style (Casual, Formal, Athletic, Trendy)' }
            ],
            highPriorityExample: [
                { attribute: 'Brand', value: 'Patagonia' },
                { attribute: 'Type', value: 'Jacket' },
                { attribute: 'Color', value: 'Navy Blue' },
                { attribute: 'Size', value: 'XS-XXL' },
                { attribute: 'Material', value: 'Recycled Polyester' },
                { attribute: 'Style', value: 'Outdoor Performance' }
            ],
            mediumPriority: [
                { name: 'Fit', description: 'Fit type and silhouette' },
                { name: 'Functionality', description: 'Performance features and use case' },
                { name: 'Seasonality', description: 'Seasonal appropriateness' }
            ],
            mediumPriorityExample: [
                { attribute: 'Fit', value: 'Regular fit' },
                { attribute: 'Functionality', value: 'Weather protection and breathability' },
                { attribute: 'Seasonality', value: 'Fall/Winter' }
            ],
            lowPriority: [
                { name: 'Pattern', description: 'Design pattern or texture details' },
                { name: 'Country of Origin', description: 'Manufacturing country' },
                { name: 'Manufacturer', description: 'Production company' }
            ],
            lowPriorityExample: [
                { attribute: 'Pattern', value: 'Solid color' },
                { attribute: 'Country of Origin', value: 'Vietnam' },
                { attribute: 'Manufacturer', value: 'Patagonia Inc.' }
            ],
            conditionalGuidelines: [
                'Include Gender for gender-specific clothing',
                'Add Designer for luxury or designer pieces',
                'Include Care Instructions for maintenance',
                'Add Sustainability Features for eco-conscious products'
            ],
            conditionalExample: [
                { attribute: 'Gender', value: 'Unisex' },
                { attribute: 'Care Instructions', value: 'Machine wash cold' },
                { attribute: 'Sustainability', value: 'Made from recycled materials' }
            ],
            qualityStandards: [
                'Use standard apparel sizing conventions',
                'Include complete fabric composition',
                'Specify care instructions accurately',
                'Maintain consistency with clothing categories',
                'Include fit and style characteristics'
            ]
        };
    }
    
    return attributeInstructions;
}

// Get product specifications data based on selected category
function getProductSpecificationsData() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Default data structure
    let specsData = {
        variants: {
            'Color': ['Black', 'White', 'Gray'],
            'Size': ['Standard'],
            'Configuration': ['Standard Model']
        },
        attributes: {
            'Brand': 'Premium Brand',
            'Usage Instructions': 'Follow manufacturer guidelines',
            'Shelf Life': 'N/A',
            'Safety Warnings': 'Use as directed'
        }
    };
    
    // Customize based on department/category
    if (department?.includes('Apparel') || category?.includes('Clothing')) {
        specsData = {
            variants: {
                'Colors': ['Beige', 'Navy', 'Black', 'White', 'Gray'],
                'Sizes': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                'Styles': ['Regular Fit', 'Slim Fit', 'Relaxed Fit'],
                'Material': ['Cotton', 'Cotton Blend', 'Linen Blend']
            },
            attributes: {
                'Brand': 'Fashion Forward',
                'Gender': 'Unisex',
                'Seasonality': 'All Season',
                'Material/Fabric': '100% Premium Cotton',
                'Size & Fit': 'True to size with tailored fit',
                'Style Type': 'Casual/Smart Casual',
                'Usage Instructions': 'Machine wash cold, tumble dry low',
                'Care Instructions': 'Iron on medium heat if needed',
                'Safety Warnings': 'Keep away from fire and heat sources'
            }
        };
    } else if (department?.includes('Electronics')) {
        specsData = {
            variants: {
                'Models': ['Basic', 'Pro', 'Advanced'],
                'Colors': ['Black', 'Silver', 'White'],
                'Storage': ['64GB', '128GB', '256GB'],
                'Connectivity': ['Wi-Fi', 'Bluetooth', 'USB-C']
            },
            attributes: {
                'Brand': 'TechPro',
                'Power Source': 'Rechargeable Lithium Battery',
                'Connectivity': 'Wi-Fi 6, Bluetooth 5.0, USB-C',
                'Operating System': 'Latest Version Compatible',
                'Processor': 'High-Performance Chipset',
                'Display': 'HD/4K Compatible',
                'Usage Instructions': 'Charge fully before first use',
                'Warranty': '1-2 years manufacturer warranty',
                'Safety Warnings': 'Do not expose to water, use certified chargers only'
            }
        };
    } else if (department?.includes('Home') || department?.includes('Furniture')) {
        specsData = {
            variants: {
                'Finishes': ['Oak', 'Walnut', 'Cherry', 'White'],
                'Sizes': ['Small', 'Medium', 'Large'],
                'Styles': ['Modern', 'Traditional', 'Contemporary'],
                'Materials': ['Solid Wood', 'Engineered Wood', 'Metal']
            },
            attributes: {
                'Brand': 'HomeStyle',
                'Material': 'Premium Solid Wood with Protective Finish',
                'Dimensions': 'Various sizes available',
                'Weight Capacity': 'Heavy-duty construction',
                'Assembly': 'Some assembly required',
                'Room Type': 'Living Room, Bedroom, Office',
                'Usage Instructions': 'Clean with damp cloth, avoid harsh chemicals',
                'Care Instructions': 'Polish periodically with wood care products',
                'Safety Warnings': 'Ensure proper assembly, check weight limits'
            }
        };
    } else if (department?.includes('Health') || department?.includes('Beauty')) {
        specsData = {
            variants: {
                'Formulations': ['Normal', 'Sensitive', 'Oily', 'Dry'],
                'Sizes': ['15ml', '30ml', '50ml', '100ml'],
                'Scents': ['Unscented', 'Light Fragrance', 'Natural'],
                'SPF Levels': ['SPF 15', 'SPF 30', 'SPF 50']
            },
            attributes: {
                'Brand': 'BeautyPro',
                'Skin Type': 'All skin types',
                'Key Ingredients': 'Natural and clinically proven actives',
                'Dermatologist Tested': 'Yes',
                'Cruelty-Free': 'Certified cruelty-free',
                'Usage Instructions': 'Apply to clean skin as directed',
                'Shelf Life': '12-24 months after opening',
                'Storage': 'Store in cool, dry place',
                'Safety Warnings': 'For external use only, patch test recommended'
            }
        };
    } else if (department?.includes('Sports') || department?.includes('Sporting')) {
        specsData = {
            variants: {
                'Sizes': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                'Colors': ['Black', 'Navy', 'Red', 'Blue', 'White'],
                'Performance Levels': ['Beginner', 'Intermediate', 'Professional'],
                'Materials': ['Moisture-Wicking', 'Breathable', 'Compression']
            },
            attributes: {
                'Brand': 'SportsPro',
                'Gender': 'Unisex',
                'Activity Type': 'Multi-sport compatible',
                'Performance Features': 'Moisture-wicking, Quick-dry technology',
                'Material': 'High-performance synthetic blend',
                'Fit Type': 'Athletic fit designed for movement',
                'Seasonality': 'All-season performance',
                'Usage Instructions': 'Machine wash cold, air dry recommended',
                'Care Instructions': 'Do not use fabric softener',
                'Safety Warnings': 'Check fit before intense activity'
            }
        };
    } else if (department?.includes('Food') || department?.includes('Beverages')) {
        specsData = {
            variants: {
                'Flavors': ['Original', 'Vanilla', 'Chocolate', 'Berry'],
                'Sizes': ['8oz', '16oz', '32oz', '64oz'],
                'Types': ['Regular', 'Sugar-Free', 'Organic', 'Premium'],
                'Packaging': ['Bottle', 'Can', 'Pouch', 'Box']
            },
            attributes: {
                'Brand': 'NutriPro',
                'Nutritional Info': 'See packaging for detailed nutrition facts',
                'Ingredients': 'Natural and premium quality ingredients',
                'Allergens': 'May contain nuts, dairy, soy - see label',
                'Organic Certified': 'USDA Organic certified',
                'Dietary Info': 'Gluten-free, Non-GMO',
                'Usage Instructions': 'Consume as part of balanced diet',
                'Shelf Life': '12-18 months unopened',
                'Storage': 'Store in cool, dry place',
                'Safety Warnings': 'Check allergen information before consumption'
            }
        };
    }
    
    return specsData;
}

// Generate size & fit guidance section
function generateSizeFitGuidance() {
    if (!shouldShowSizeFitGuidance()) {
        return ''; // Don't show for non-applicable product types
    }
    
    const sizeData = getSizeFitGuidanceData();
    
    return `
        <div class="size-fit-guidance">
            <h4><i class="fas fa-ruler"></i> Size & Fit Guidance</h4>
            
            <div class="size-section">
                <h5>Model Information</h5>
                <div class="model-info">
                    ${sizeData.modelInfo}
                </div>
            </div>
            
            <div class="size-section">
                <h5>Size Guide</h5>
                <ul class="size-list">
                    ${sizeData.sizeGuide.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            ${sizeData.sizeChart ? `
                <div class="size-section">
                    <h5>Size Chart</h5>
                    <div class="size-chart">
                        ${sizeData.sizeChart}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Generate Category Manager instruction manual for Size & Fit Guidance
function generateSizeFitGuidanceForModal() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Check if this product type is relevant for size guidance
    if (!shouldShowSizeFitGuidance()) {
        return ''; // Don't show for non-applicable product types
    }
    
    // Generate intelligent size & fit instructions based on product type
    const sizeInstructions = generateSizeFitInstructions(productType, department, category, subcategory);
    
    return `
        <div class="instruction-manual" style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="color: #1e40af; margin-bottom: 1rem;">📏 Size & Fit Guidance Instructions</h4>
            <p style="color: #64748b; margin-bottom: 1rem;">Follow these AI-generated guidelines to create accurate size and fit information for <strong>${productType}</strong>:</p>
        </div>

        <div class="instruction-section">
            <h4>1. ${sizeInstructions.isApparel ? 'Model & Fit Information' : 'Product Dimensions'}</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${sizeInstructions.primaryGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                </ul>
            </div>
            <div class="example-box" style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <strong>✅ Example for ${productType}:</strong><br>
                <span style="color: #0369a1;">${sizeInstructions.primaryExample}</span>
            </div>
        </div>

        <div class="instruction-section">
            <h4>2. ${sizeInstructions.isApparel ? 'Sizing Advice & Charts' : 'Capacity & Weight Specifications'}</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${sizeInstructions.secondaryGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                </ul>
            </div>
            <div class="example-box" style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <strong>✅ Example for ${productType}:</strong><br>
                <span style="color: #0369a1;">${sizeInstructions.secondaryExample}</span>
            </div>
        </div>

        <div class="instruction-section">
            <h4>3. Measurement Standards</h4>
            <div class="instruction-content" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${sizeInstructions.measurementStandards.map(standard => `<li>${standard}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="instruction-section">
            <h4>4. Product-Specific Size Tips</h4>
            <div class="tips-content" style="background: #f0f9ff; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <ul class="guidelines-list">
                    ${sizeInstructions.productTips.map(tip => `<li style="color: #0c4a6e;">${tip}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="quality-section">
            <h4>5. Accuracy Requirements</h4>
            <div class="detail-value" style="background: #f0fdf4; padding: 1rem; border-radius: 6px;">
                <ul class="guidelines-list">
                    ${sizeInstructions.accuracyRequirements.map(requirement => `<li>${requirement}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Check if current product type should show size & fit guidance
function shouldShowSizeFitGuidance() {
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    const productType = getDeepestLevelValue()?.toLowerCase() || '';
    
    // Show for apparel, shoes, accessories, and other size-dependent items
    return department?.includes('Apparel') || 
           category?.includes('Clothing') ||
           category?.includes('Shoes') ||
           category?.includes('Footwear') ||
           subcategory?.includes('Shoes') ||
           subcategory?.includes('Footwear') ||
           subcategory?.includes('Accessories') ||
           department?.includes('Sporting Goods') && 
           (subcategory?.includes('Clothing') || subcategory?.includes('Footwear')) ||
           // Include appliances and electronics that need dimensions
           productType.includes('juicer') ||
           productType.includes('blender') ||
           productType.includes('coffee') ||
           productType.includes('phone') ||
           productType.includes('laptop') ||
           productType.includes('tablet') ||
           department?.includes('Home & Garden') ||
           department?.includes('Electronics');
}

// Generate intelligent Size & Fit instructions based on product type
function generateSizeFitInstructions(productType, department, category, subcategory) {
    const normalizedProductType = productType.toLowerCase();
    const isApparel = department?.includes('Apparel') || category?.includes('Clothing') || 
                     category?.includes('Shoes') || category?.includes('Footwear') ||
                     subcategory?.includes('Shoes') || subcategory?.includes('Footwear');
    
    // Default size instructions
    let sizeInstructions = {
        isApparel: isApparel,
        primaryGuidelines: isApparel ? [
            'Include model height and body measurements',
            'Specify fit type (slim, regular, relaxed, oversized)',
            'Provide size worn by model for reference',
            'Include brand-specific sizing notes',
            'Mention any fit variations by style'
        ] : [
            'Provide exact dimensions in L × W × H format',
            'Include weight in kilograms and pounds',
            'Specify capacity where applicable (liters/gallons)',
            'Use both metric and imperial units',
            'Include packaging dimensions if significantly different'
        ],
        primaryExample: isApparel ? 
            'Model is 175cm (5\'9") tall, wearing size M. Regular fit with tailored silhouette.' :
            'Dimensions: 23 cm × 42 cm × 19 cm. Weight: 2.5 kg. Capacity: 1.5 liters.',
        secondaryGuidelines: isApparel ? [
            'Create comprehensive size charts with measurements',
            'Include fit advice for different body types',
            'Mention any shrinkage or stretch considerations',
            'Provide comparison to standard sizing',
            'Include care instructions affecting fit'
        ] : [
            'Specify capacity in relevant units (liters, cups, servings)',
            'Include power consumption and cord length',
            'Mention space requirements for operation',
            'Include any assembly dimensions',
            'Specify weight limits or capacity constraints'
        ],
        secondaryExample: isApparel ?
            'Size M: Chest 102cm, Length 71cm. True to size fit. Pre-shrunk fabric.' :
            'Operating capacity: 1.5 liters. Power consumption: 500W. Includes 1.2m power cord.',
        measurementStandards: [
            'Use standard metric units (cm, kg, liters) as primary',
            'Include imperial equivalents in parentheses',
            'Round measurements to practical precision',
            'Use consistent decimal places throughout',
            'Follow international measurement standards'
        ],
        productTips: [
            'Focus on measurements that affect customer purchase decisions',
            'Include context for size comparisons when helpful',
            'Mention any size variations between different models',
            'Consider storage and shipping dimensions if relevant'
        ],
        accuracyRequirements: [
            'All measurements must be verified and accurate',
            'Use official manufacturer specifications',
            'Include tolerance ranges where applicable',
            'Update measurements if product design changes',
            'Cross-reference with actual product samples'
        ]
    };
    
    // Customize instructions based on specific product types
    
    // Kitchen Appliances
    if (normalizedProductType.includes('juicer') || normalizedProductType.includes('blender') || normalizedProductType.includes('coffee')) {
        sizeInstructions = {
            isApparel: false,
            primaryGuidelines: [
                'Provide exact appliance dimensions (L × W × H)',
                'Include weight for portability assessment',
                'Specify counter space requirements',
                'Include cord length and storage needs',
                'Mention any parts that extend during use'
            ],
            primaryExample: 'Dimensions: 23 cm × 42 cm × 19 cm. Weight: 2.5 kg. Capacity: 1.5 liters.',
            secondaryGuidelines: [
                'Specify processing capacity (liters, cups, servings)',
                'Include ingredient capacity limits',
                'Mention pulp container or waste capacity',
                'Provide power specifications and cord length',
                'Include clearance requirements for operation'
            ],
            secondaryExample: 'Juice capacity: 1.5 liters. Pulp container: 2 liters. Power consumption: 500W. Cord length: 1.2m.',
            measurementStandards: [
                'Use centimeters for dimensions, kilograms for weight',
                'Include imperial equivalents (inches, pounds)',
                'Specify capacity in liters and fluid ounces',
                'Round to nearest 0.5 cm for dimensions',
                'Use one decimal place for weight (kg)'
            ],
            productTips: [
                'Emphasize compact design for small kitchens',
                'Include capacity relative to family size or usage',
                'Mention ease of storage and portability',
                'Compare size to common kitchen appliances for context'
            ],
            accuracyRequirements: [
                'Verify dimensions with actual product measurements',
                'Ensure capacity specifications match performance',
                'Include assembled dimensions with all parts attached',
                'Check weight includes all standard components',
                'Validate power requirements and cord specifications'
            ]
        };
    }
    
    // Footwear
    else if (normalizedProductType.includes('shoe') || normalizedProductType.includes('sneaker') || normalizedProductType.includes('boot')) {
        sizeInstructions = {
            isApparel: true,
            primaryGuidelines: [
                'Include model foot size and shoe size worn',
                'Specify fit type (narrow, regular, wide)',
                'Mention arch support level and foot type',
                'Include sizing relative to other brands',
                'Provide width options available'
            ],
            primaryExample: 'Model wears US size 9 (EU 42.5, UK 8). Regular width fit. True to size with Nike sizing.',
            secondaryGuidelines: [
                'Create comprehensive size conversion charts',
                'Include foot measurement guide (length/width)',
                'Mention break-in period and stretch considerations',
                'Provide fit advice for different foot shapes',
                'Include half-size and width availability'
            ],
            secondaryExample: 'Available in US 6-13, half sizes included. Width options: B (narrow), D (regular), 2E (wide). Runs true to size.',
            measurementStandards: [
                'Use standard shoe sizing systems (US, EU, UK)',
                'Include foot length measurements in cm/inches',
                'Specify width measurements and categories',
                'Use consistent sizing notation throughout',
                'Include children\'s sizing if applicable'
            ],
            productTips: [
                'Address common fit concerns for the shoe type',
                'Mention seasonal sizing considerations (thick socks)',
                'Include activity-specific fit recommendations',
                'Compare fit to popular competitor models when helpful'
            ],
            accuracyRequirements: [
                'Verify sizing with actual wear testing',
                'Ensure size charts match brand standards',
                'Test fit across multiple foot shapes and sizes',
                'Validate width options and availability',
                'Confirm sizing consistency across colorways'
            ]
        };
    }
    
    // Electronics
    else if (normalizedProductType.includes('phone') || normalizedProductType.includes('laptop') || normalizedProductType.includes('tablet')) {
        sizeInstructions = {
            isApparel: false,
            primaryGuidelines: [
                'Provide exact device dimensions (L × W × H)',
                'Include weight for portability assessment',
                'Specify screen size and bezels',
                'Include thickness for pocket/bag fit',
                'Mention any protruding elements (cameras, ports)'
            ],
            primaryExample: 'Dimensions: 146.7 × 71.5 × 7.65 mm (5.78" × 2.81" × 0.30"). Weight: 174g (6.14 oz). 6.1" display.',
            secondaryGuidelines: [
                'Specify storage capacity options available',
                'Include battery capacity and life estimates',
                'Mention connectivity and port specifications',
                'Provide comparison to common objects for scale',
                'Include case and accessory compatibility'
            ],
            secondaryExample: 'Storage: 128GB, 256GB, 512GB options. Battery: 3095mAh, 15+ hours usage. Lightning port, wireless charging.',
            measurementStandards: [
                'Use millimeters for device dimensions',
                'Include inches in parentheses for US market',
                'Specify weight in grams and ounces',
                'Use diagonal inches for screen measurements',
                'Include precise thickness measurements'
            ],
            productTips: [
                'Emphasize portability and pocket-friendliness',
                'Compare size to previous generations or competitors',
                'Mention one-handed usability considerations',
                'Include durability and build quality context'
            ],
            accuracyRequirements: [
                'Verify dimensions with official specifications',
                'Ensure measurements include all standard components',
                'Check weight without packaging or accessories',
                'Validate screen size and resolution specifications',
                'Confirm storage and battery capacity accuracy'
            ]
        };
    }
    
    // Apparel (General)
    else if (isApparel) {
        sizeInstructions = {
            isApparel: true,
            primaryGuidelines: [
                'Include model height, weight, and measurements',
                'Specify fit type (slim, regular, relaxed, oversized)',
                'Provide size worn by model for reference',
                'Include brand-specific sizing notes',
                'Mention any fit variations by style or color'
            ],
            primaryExample: 'Model is 175cm (5\'9"), 70kg, wearing size M. Regular fit with tailored silhouette.',
            secondaryGuidelines: [
                'Create comprehensive size charts with body measurements',
                'Include fit advice for different body types',
                'Mention any shrinkage or stretch considerations',
                'Provide care instructions affecting fit',
                'Include size range and availability'
            ],
            secondaryExample: 'Size M: Chest 102cm, Waist 86cm, Length 71cm. True to size fit. Pre-shrunk cotton, minimal stretch.',
            measurementStandards: [
                'Use centimeters for body and garment measurements',
                'Include inches in parentheses for international customers',
                'Specify measurements for chest, waist, length, sleeve',
                'Use standard garment measurement points',
                'Include size chart with all available sizes'
            ],
            productTips: [
                'Address common fit concerns for the garment type',
                'Mention layering considerations for outerwear',
                'Include seasonal fit adjustments if applicable',
                'Compare fit to other popular brands when helpful'
            ],
            accuracyRequirements: [
                'Verify sizing with actual garment measurements',
                'Test fit on models of various body types',
                'Ensure size charts match production specifications',
                'Validate fit consistency across different colors/materials',
                'Update measurements if manufacturing changes'
            ]
        };
    }
    
    return sizeInstructions;
}

// Get size & fit guidance data based on selected category
function getSizeFitGuidanceData() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Default data structure
    let sizeData = {
        modelInfo: `Model wearing size M for reference`,
        sizeGuide: [
            'Brand-specific sizing chart available',
            'Fit predictor based on purchase history',
            'Multi-brand sizing support included'
        ],
        sizeChart: null
    };
    
    // Customize based on department/category
    if (department?.includes('Apparel') || category?.includes('Clothing')) {
        if (subcategory?.includes('Outerwear') || productType?.toLowerCase().includes('blazer')) {
            sizeData = {
                modelInfo: `Height: 5'8", Wearing Size: M, Fits true to size with tailored cut`,
                sizeGuide: [
                    'Brand-specific chart included for accurate sizing',
                    'Fit predictor based on user purchase history',
                    'Multi-brand sizing support available',
                    'Size up for looser fit, size down for fitted look',
                    'Consider shoulder width as primary fit indicator'
                ],
                sizeChart: `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                        <tr style="background: #f7fafc;">
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Size</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Bust (inches)</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Waist (inches)</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Length (inches)</th>
                        </tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XS</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">32-34</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">26-28</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">24</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">S</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">28-30</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">25</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">M</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36-38</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">30-32</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">26</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">L</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">38-40</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">32-34</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">27</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XL</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">40-42</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">28</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XXL</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">42-44</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36-38</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">29</td></tr>
                    </table>
                `
            };
        } else if (subcategory?.includes('Tops') || subcategory?.includes('Shirts')) {
            sizeData = {
                modelInfo: `Height: 5'6", Wearing Size: S, Regular fit with comfortable room`,
                sizeGuide: [
                    'Brand-specific sizing chart for accurate fit',
                    'Fit predictor recommends based on body measurements',
                    'Cross-brand sizing comparison available',
                    'Consider fabric stretch when selecting size',
                    'Length varies by style - check individual measurements'
                ],
                sizeChart: `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                        <tr style="background: #f7fafc;">
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Size</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Chest (inches)</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Length (inches)</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Sleeve (inches)</th>
                        </tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XS</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">32-34</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">26</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">23</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">S</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">27</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">24</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">M</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36-38</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">28</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">25</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">L</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">38-40</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">29</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">26</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XL</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">40-42</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">30</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">27</td></tr>
                    </table>
                `
            };
        } else {
            // Generic apparel
            sizeData = {
                modelInfo: `Height: 5'7", Wearing Size: M, True to size fit`,
                sizeGuide: [
                    'Comprehensive brand sizing chart included',
                    'AI-powered fit predictor based on measurements',
                    'Multi-brand size conversion available',
                    'Customer review-based fit insights',
                    'Virtual try-on technology compatible'
                ],
                sizeChart: `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                        <tr style="background: #f7fafc;">
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Size</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Chest/Bust (inches)</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Waist (inches)</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Hip (inches)</th>
                        </tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XS</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">32-34</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">26-28</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">S</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">28-30</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36-38</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">M</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36-38</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">30-32</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">38-40</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">L</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">38-40</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">32-34</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">40-42</td></tr>
                        <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XL</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">40-42</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">42-44</td></tr>
                    </table>
                `
            };
        }
    } else if (category?.includes('Shoes') || category?.includes('Footwear') || subcategory?.includes('Shoes') || subcategory?.includes('Footwear')) {
        sizeData = {
            modelInfo: `Model wearing size 8 US (fits true to size)`,
            sizeGuide: [
                'Brand-specific shoe sizing chart included',
                'International size conversion (US/UK/EU)',
                'Width options available (Narrow, Medium, Wide)',
                'Fit predictor based on foot measurements',
                'Customer fit feedback integration'
            ],
            sizeChart: `
                <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                    <tr style="background: #f7fafc;">
                        <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">US Size</th>
                        <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">UK Size</th>
                        <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">EU Size</th>
                        <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Length (inches)</th>
                    </tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">6</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">3.5</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">9.25</td></tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">7</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">4.5</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">37</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">9.5</td></tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">8</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">5.5</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">38</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">9.75</td></tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">9</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">6.5</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">39</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">10</td></tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">10</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">7.5</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">40</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">10.25</td></tr>
                </table>
            `
        };
    } else if (department?.includes('Sporting Goods') && (subcategory?.includes('Clothing') || subcategory?.includes('Footwear'))) {
        sizeData = {
            modelInfo: `Athletic model wearing size L for optimal performance fit`,
            sizeGuide: [
                'Performance-oriented sizing chart',
                'Athletic fit predictor based on sport type',
                'Compression level indicators',
                'Movement-tested size recommendations',
                'Multi-sport size compatibility'
            ],
            sizeChart: `
                <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                    <tr style="background: #f7fafc;">
                        <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Size</th>
                        <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Chest (inches)</th>
                        <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Waist (inches)</th>
                        <th style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">Fit Type</th>
                    </tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">S</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">28-30</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">Athletic</td></tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">M</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">36-38</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">30-32</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">Athletic</td></tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">L</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">38-40</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">32-34</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">Athletic</td></tr>
                    <tr><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">XL</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">40-42</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">34-36</td><td style="padding: 0.5rem; border: 1px solid #e2e8f0;">Athletic</td></tr>
                </table>
            `
        };
    }
    
    return sizeData;
}

// Generate cross-selling & personalization section
function generateCrossSellingPersonalization() {
    const crossSellingData = getCrossSellingPersonalizationData();
    
    return `
        <div class="cross-selling-personalization">
            <h4><i class="fas fa-shopping-cart"></i> Cross-Selling & Personalization</h4>
            
            <div class="cross-selling-section">
                <h5>Buy the Look / Bundle Suggestions</h5>
                <ul class="cross-selling-list">
                    ${crossSellingData.buyTheLook.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="cross-selling-section">
                <h5>#AsSeenOnMe / #InUseByOthers</h5>
                <div class="social-content">
                    ${crossSellingData.socialContent}
                </div>
            </div>
            
            <div class="cross-selling-section">
                <h5>Quick View Feature</h5>
                <div class="quick-view-content">
                    ${crossSellingData.quickView}
                </div>
            </div>
        </div>
    `;
}

// Generate Cross-Selling & Personalization with intelligent product recommendations
function generateCrossSellingPersonalizationForModal() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Get intelligent cross-selling recommendations
    const recommendations = getIntelligentCrossSellingRecommendations(productType, department, category, subcategory);
    
    return `
        <div class="instruction-manual" style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="color: #1e40af; margin-bottom: 1rem;">🛒 Cross-Selling & Personalization Instructions</h4>
            <p style="color: #64748b; margin-bottom: 1rem;">Use AI-powered recommendations to suggest complementary products for <strong>${productType}</strong>:</p>
        </div>

        <div class="recommendations-section">
            <h4>Complementary Product Recommendations</h4>
            <div class="recommendations-intro" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                <p style="margin: 0; color: #92400e; font-style: italic;">${recommendations.introText}</p>
            </div>
        </div>

        <div class="recommendations-grid">
            <h4>Recommended Products</h4>
            <div class="recommendations-table" style="background: #e0f2fe; padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <div class="table-header" style="display: grid; grid-template-columns: 2fr 3fr; gap: 1rem; font-weight: bold; color: #0369a1; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #0369a1;">
                    <div>Recommended Product</div>
                    <div>Why It Works</div>
                </div>
                ${recommendations.products.map(product => `
                    <div class="table-row" style="display: grid; grid-template-columns: 2fr 3fr; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid #bae6fd; color: #0c4a6e;">
                        <div style="font-weight: 600;">${product.name}</div>
                        <div>${product.reason}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="personalization-section">
            <h4>Personalization Strategy</h4>
            <div class="personalization-grid" style="background: #f0f9ff; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <ul class="guidelines-list">
                    ${recommendations.personalizationTips.map(tip => `<li style="color: #1e40af;">${tip}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="display-recommendations">
            <h4>Display Guidelines</h4>
            <div class="display-grid" style="background: #f0fdf4; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <ul class="guidelines-list">
                    ${recommendations.displayGuidelines.map(guideline => `<li style="color: #166534;">${guideline}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="implementation-standards" style="background: #fef7ff; padding: 1rem; border-radius: 6px;">
            <h5 style="color: #7c2d12; margin-bottom: 0.5rem;">🎯 Implementation Standards:</h5>
            <ul class="guidelines-list" style="margin: 0; color: #7c2d12;">
                <li>Use carousel or grid format for product display</li>
                <li>Ensure recommendations are relevant and curated</li>
                <li>Maintain consistent brand tone and category logic</li>
                <li>Base suggestions on styling logic, usage context, and purchase data</li>
                <li>Update recommendations based on seasonal trends and inventory</li>
            </ul>
        </div>
    `;
}

// Get cross-selling & personalization data based on selected category
function getCrossSellingPersonalizationData() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Default data structure
    let crossSellingData = {
        buyTheLook: [
            'Complementary products from the same brand',
            'Coordinating accessories and add-ons',
            'Complete the look suggestions'
        ],
        socialContent: 'User-generated content showcasing real customers using the product',
        quickView: 'Preview product details without leaving the browsing experience'
    };
    
    // Customize based on department/category
    if (department?.includes('Apparel') || category?.includes('Clothing')) {
        if (subcategory?.includes('Outerwear') || productType?.toLowerCase().includes('blazer')) {
            crossSellingData = {
                buyTheLook: [
                    'Pair with matching trousers and a silk blouse',
                    'Complete the professional look with leather pumps',
                    'Add sophisticated accessories: watch, belt, and handbag',
                    'Layer with fitted turtleneck for versatile styling',
                    'Bundle with coordinating pencil skirt for office ensemble'
                ],
                socialContent: 'User-generated content from Instagram and Pinterest showing real styling inspiration. Features #AsSeenOnMe posts from fashion influencers and everyday customers showcasing how they style their blazer for work, weekend, and special occasions.',
                quickView: 'Preview product details, available sizes, colors, and styling suggestions without leaving the product grid. Quick access to size chart, material details, and customer reviews.'
            };
        } else if (subcategory?.includes('Tops') || subcategory?.includes('Shirts')) {
            crossSellingData = {
                buyTheLook: [
                    'Style with high-waisted jeans or tailored trousers',
                    'Layer under cardigans or blazers for professional looks',
                    'Pair with statement jewelry and accessories',
                    'Complete casual looks with denim jackets or scarves',
                    'Bundle with coordinating bottoms in seasonal colors'
                ],
                socialContent: 'Customer styling posts on social media featuring #OOTD (Outfit of the Day) content. Real customers share their creative ways of styling tops for different occasions, seasons, and personal styles.',
                quickView: 'Instant preview of fit details, fabric composition, care instructions, and styling recommendations. Browse color variations and see customer photos without page navigation.'
            };
        } else if (subcategory?.includes('Dresses')) {
            crossSellingData = {
                buyTheLook: [
                    'Accessorize with statement jewelry and elegant shoes',
                    'Add a blazer or cardigan for office-appropriate styling',
                    'Complete evening looks with clutch bags and heels',
                    'Layer with tights and boots for seasonal versatility',
                    'Bundle with coordinating wrap or shawl'
                ],
                socialContent: 'Fashion community content showcasing dress styling for weddings, work events, casual outings, and special occasions. Features real customer photos and professional styling inspiration.',
                quickView: 'Quick access to dress measurements, occasion suitability, available accessories, and customer styling photos. Preview fabric drape and color accuracy.'
            };
        } else {
            // Generic apparel
            crossSellingData = {
                buyTheLook: [
                    'Mix and match with coordinating pieces',
                    'Complete outfits with seasonal accessories',
                    'Bundle with complementary colors and textures',
                    'Add layering pieces for versatile styling',
                    'Coordinate with trending footwear and bags'
                ],
                socialContent: 'Style inspiration from the fashion community featuring real customers and influencers. Discover new ways to wear and style your pieces through authentic user-generated content.',
                quickView: 'Preview styling options, size availability, and customer reviews instantly. Quick access to care instructions and coordination suggestions.'
            };
        }
    } else if (department?.includes('Electronics')) {
        crossSellingData = {
            buyTheLook: [
                'Essential accessories: cases, screen protectors, charging cables',
                'Complete your tech setup with compatible peripherals',
                'Bundle with extended warranty and protection plans',
                'Add productivity accessories: stands, keyboards, mice',
                'Enhance with audio accessories: headphones, speakers'
            ],
            socialContent: 'Tech community reviews and unboxing videos from real users. See how customers integrate products into their daily workflows and creative projects through authentic user content.',
            quickView: 'Instant access to technical specifications, compatibility information, and customer setup examples. Preview included accessories and optional add-ons.'
        };
    } else if (department?.includes('Home') || department?.includes('Furniture')) {
        crossSellingData = {
            buyTheLook: [
                'Complete room sets with matching furniture pieces',
                'Coordinate with complementary home décor accessories',
                'Add functional storage and organization solutions',
                'Bundle with coordinating textiles: pillows, throws, rugs',
                'Enhance with lighting and decorative elements'
            ],
            socialContent: 'Home décor inspiration from real customers showing their styled spaces. Features room tours, styling tips, and creative ways to incorporate furniture pieces into different interior design styles.',
            quickView: 'Preview room visualization, dimension compatibility, and styling suggestions. Quick access to assembly requirements and coordination options.'
        };
    } else if (department?.includes('Health') || department?.includes('Beauty')) {
        crossSellingData = {
            buyTheLook: [
                'Complete skincare routine with complementary products',
                'Bundle with matching products from the same line',
                'Add essential tools: brushes, applicators, accessories',
                'Create beauty sets for gifting or personal use',
                'Coordinate with seasonal or occasion-specific products'
            ],
            socialContent: 'Beauty community content featuring tutorials, before/after photos, and real customer results. Discover application techniques and product combinations through authentic user experiences.',
            quickView: 'Instant preview of ingredients, skin type compatibility, and application instructions. Quick access to customer results and expert recommendations.'
        };
    } else if (department?.includes('Sports') || department?.includes('Sporting')) {
        crossSellingData = {
            buyTheLook: [
                'Complete athletic outfits with coordinating pieces',
                'Essential gear and accessories for your sport',
                'Performance enhancement products and supplements',
                'Recovery and maintenance accessories',
                'Bundle with seasonal or activity-specific items'
            ],
            socialContent: 'Athletic community content featuring workout videos, performance reviews, and real athlete testimonials. See how products perform in actual training and competition scenarios.',
            quickView: 'Preview performance specifications, size and fit guidance, and sport-specific features. Quick access to athlete reviews and training tips.'
        };
    } else if (department?.includes('Food') || department?.includes('Beverages')) {
        crossSellingData = {
            buyTheLook: [
                'Recipe ingredients and complementary food products',
                'Pairing suggestions for complete meal planning',
                'Seasonal and occasion-specific product bundles',
                'Nutritional supplements and health-focused combinations',
                'Bundle with preparation tools and serving accessories'
            ],
            socialContent: 'Food community content featuring recipes, meal prep ideas, and customer cooking experiences. Discover new ways to use products through authentic culinary inspiration.',
            quickView: 'Instant preview of nutritional information, recipe suggestions, and preparation instructions. Quick access to customer cooking tips and pairing ideas.'
        };
    }
    
    return crossSellingData;
}

// Generate customer engagement section
function generateCustomerEngagement() {
    const engagementData = getCustomerEngagementData();
    
    return `
        <div class="customer-engagement">
            <h4><i class="fas fa-users"></i> Customer Engagement</h4>
            
            <div class="engagement-section">
                <h5>Reviews & Ratings</h5>
                <div class="reviews-content">
                    <div class="rating-display">
                        ${engagementData.starRating} <span class="rating-text">(${engagementData.averageRating}/5 average)</span>
                    </div>
                    <div class="feedback-summary">
                        <div class="pros-cons">
                            <div class="pros">
                                <strong>Pros:</strong> ${engagementData.pros.join(', ')}
                            </div>
                            <div class="cons">
                                <strong>Cons:</strong> ${engagementData.cons.join(', ')}
                            </div>
                        </div>
                        <div class="sentiment-analysis">
                            <strong>Sentiment analysis:</strong> ${engagementData.sentimentScore}% positive
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="engagement-section">
                <h5>Share Feature</h5>
                <div class="share-content">
                    <div class="social-buttons">
                        <strong>Social sharing:</strong> ${engagementData.socialPlatforms.join(', ')} buttons
                    </div>
                    <div class="influencer-links">
                        <strong>Integration:</strong> ${engagementData.influencerFeatures}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate Customer Engagement with intelligent review and rating data
function generateCustomerEngagementForModal() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Get intelligent customer engagement data
    const engagementData = getIntelligentCustomerEngagementData(productType, department, category, subcategory);
    
    return `
        <div class="instruction-manual" style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="color: #1e40af; margin-bottom: 1rem;">👥 Customer Engagement Instructions</h4>
            <p style="color: #64748b; margin-bottom: 1rem;">Use AI-powered customer feedback analysis to showcase authentic reviews and ratings for <strong>${productType}</strong>:</p>
        </div>

        <div class="overall-rating-section">
            <h4>Overall Customer Rating</h4>
            <div class="rating-display" style="background: #fef3c7; padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem; text-align: center;">
                <div class="star-rating" style="font-size: 2rem; color: #f59e0b; margin-bottom: 0.5rem;">
                    ${engagementData.starDisplay}
                </div>
                <div class="rating-text" style="font-size: 1.25rem; font-weight: bold; color: #92400e; margin-bottom: 0.5rem;">
                    ${engagementData.averageRating}/5 from ${engagementData.totalReviews} reviews
                </div>
                <div class="verified-badge" style="color: #059669; font-weight: 600;">
                    ✓ ${engagementData.verifiedPercentage}% Verified Buyer Reviews
                </div>
            </div>
        </div>

        <div class="featured-review-section">
            <h4>Featured Customer Review</h4>
            <div class="featured-review" style="background: #e0f2fe; padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem; border-left: 4px solid #0369a1;">
                <div class="review-rating" style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 0.5rem;">
                    ${engagementData.featuredReview.stars}
                </div>
                <div class="review-text" style="font-style: italic; color: #0c4a6e; margin-bottom: 1rem; line-height: 1.6;">
                    "${engagementData.featuredReview.text}"
                </div>
                <div class="reviewer-info" style="color: #0369a1; font-weight: 600;">
                    – ${engagementData.featuredReview.reviewer}
                </div>
            </div>
        </div>

        <div class="rating-breakdown-section">
            <h4>Rating Breakdown</h4>
            <div class="breakdown-grid" style="background: #f0f9ff; padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
                ${engagementData.ratingBreakdown.map(item => `
                    <div class="breakdown-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #bae6fd;">
                        <span style="font-weight: 600; color: #0c4a6e;">${item.aspect}:</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: #f59e0b;">${item.stars}</span>
                            <span style="color: #0369a1; font-weight: 600;">${item.rating}/5</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="user-content-section">
            <h4>User-Generated Content</h4>
            <div class="user-content-grid" style="background: #f0fdf4; padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <div class="content-summary" style="color: #166534; margin-bottom: 1rem;">
                    <strong>📸 Customer Photos & Videos:</strong> ${engagementData.userContent.totalMedia} submissions
                </div>
                <div class="content-highlights">
                    <ul class="guidelines-list">
                        ${engagementData.userContent.highlights.map(highlight => `<li style="color: #166534;">${highlight}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="engagement-insights-section">
            <h4>Customer Engagement Insights</h4>
            <div class="insights-grid" style="background: #fef7ff; padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
                <div class="insights-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                    <div class="stat-item" style="text-align: center; padding: 1rem; background: #fdf4ff; border-radius: 4px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #7c2d12;">${engagementData.insights.repeatPurchase}%</div>
                        <div style="color: #7c2d12; font-size: 0.9rem;">Repeat Purchase Rate</div>
                    </div>
                    <div class="stat-item" style="text-align: center; padding: 1rem; background: #fdf4ff; border-radius: 4px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #7c2d12;">${engagementData.insights.recommendation}%</div>
                        <div style="color: #7c2d12; font-size: 0.9rem;">Would Recommend</div>
                    </div>
                    <div class="stat-item" style="text-align: center; padding: 1rem; background: #fdf4ff; border-radius: 4px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #7c2d12;">${engagementData.insights.satisfaction}%</div>
                        <div style="color: #7c2d12; font-size: 0.9rem;">Customer Satisfaction</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="implementation-guidelines" style="background: #ecfdf5; padding: 1rem; border-radius: 6px;">
            <h5 style="color: #166534; margin-bottom: 0.5rem;">🎯 Implementation Guidelines:</h5>
            <ul class="guidelines-list" style="margin: 0; color: #166534;">
                <li>Display authentic and verified buyer feedback prominently</li>
                <li>Include rating breakdowns for key product parameters</li>
                <li>Showcase user-generated images and videos when available</li>
                <li>Highlight both positive aspects and areas for improvement</li>
                <li>Use engagement data to inform product improvements and marketing</li>
                <li>Ensure reviews are representative of the overall product experience</li>
            </ul>
        </div>
    `;
}

// Get customer engagement data based on selected category
function getCustomerEngagementData() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Default data structure
    let engagementData = {
        starRating: '⭐️⭐️⭐️⭐️☆',
        averageRating: '4.2',
        pros: ['Quality', 'Design', 'Value'],
        cons: ['Limited options', 'Sizing'],
        sentimentScore: 78,
        socialPlatforms: ['Pinterest', 'Instagram', 'WhatsApp'],
        influencerFeatures: 'Shoppable influencer links and partnerships'
    };
    
    // Customize based on department/category
    if (department?.includes('Apparel') || category?.includes('Clothing')) {
        if (subcategory?.includes('Outerwear') || productType?.toLowerCase().includes('blazer')) {
            engagementData = {
                starRating: '⭐️⭐️⭐️⭐️☆',
                averageRating: '4.5',
                pros: ['Fit', 'Fabric quality', 'Professional appearance'],
                cons: ['Limited color options', 'Price point'],
                sentimentScore: 85,
                socialPlatforms: ['Pinterest', 'Instagram', 'WhatsApp'],
                influencerFeatures: 'Shoppable influencer links and professional styling content'
            };
        } else if (subcategory?.includes('Tops') || subcategory?.includes('Shirts')) {
            engagementData = {
                starRating: '⭐️⭐️⭐️⭐️⭐️',
                averageRating: '4.7',
                pros: ['Comfort', 'Versatility', 'Easy care'],
                cons: ['Wrinkles easily', 'Color fading'],
                sentimentScore: 89,
                socialPlatforms: ['Pinterest', 'Instagram', 'TikTok'],
                influencerFeatures: 'Style challenge campaigns and outfit inspiration links'
            };
        } else if (subcategory?.includes('Dresses')) {
            engagementData = {
                starRating: '⭐️⭐️⭐️⭐️⭐️',
                averageRating: '4.6',
                pros: ['Elegant design', 'Flattering fit', 'Occasion versatility'],
                cons: ['Requires dry cleaning', 'Limited seasonal wear'],
                sentimentScore: 87,
                socialPlatforms: ['Pinterest', 'Instagram', 'Facebook'],
                influencerFeatures: 'Wedding and event styling partnerships with influencers'
            };
        } else {
            // Generic apparel
            engagementData = {
                starRating: '⭐️⭐️⭐️⭐️☆',
                averageRating: '4.3',
                pros: ['Style', 'Comfort', 'Quality materials'],
                cons: ['Sizing inconsistency', 'Care requirements'],
                sentimentScore: 82,
                socialPlatforms: ['Pinterest', 'Instagram', 'WhatsApp'],
                influencerFeatures: 'Fashion blogger collaborations and style guides'
            };
        }
    } else if (department?.includes('Electronics')) {
        engagementData = {
            starRating: '⭐️⭐️⭐️⭐️☆',
            averageRating: '4.4',
            pros: ['Performance', 'Build quality', 'Features'],
            cons: ['Battery life', 'Price', 'Learning curve'],
            sentimentScore: 81,
            socialPlatforms: ['Twitter', 'Reddit', 'WhatsApp'],
            influencerFeatures: 'Tech reviewer partnerships and unboxing collaborations'
        };
    } else if (department?.includes('Home') || department?.includes('Furniture')) {
        engagementData = {
            starRating: '⭐️⭐️⭐️⭐️☆',
            averageRating: '4.3',
            pros: ['Design', 'Durability', 'Space efficiency'],
            cons: ['Assembly difficulty', 'Delivery time', 'Color matching'],
            sentimentScore: 79,
            socialPlatforms: ['Pinterest', 'Instagram', 'Houzz'],
            influencerFeatures: 'Home décor influencer room makeovers and styling tips'
        };
    } else if (department?.includes('Health') || department?.includes('Beauty')) {
        engagementData = {
            starRating: '⭐️⭐️⭐️⭐️⭐️',
            averageRating: '4.6',
            pros: ['Effectiveness', 'Gentle formula', 'Quick results'],
            cons: ['Price', 'Packaging', 'Availability'],
            sentimentScore: 88,
            socialPlatforms: ['Instagram', 'TikTok', 'Pinterest'],
            influencerFeatures: 'Beauty guru tutorials and before/after collaborations'
        };
    } else if (department?.includes('Sports') || department?.includes('Sporting')) {
        engagementData = {
            starRating: '⭐️⭐️⭐️⭐️☆',
            averageRating: '4.4',
            pros: ['Performance', 'Durability', 'Comfort during activity'],
            cons: ['Price', 'Limited color options', 'Care instructions'],
            sentimentScore: 83,
            socialPlatforms: ['Instagram', 'TikTok', 'Strava'],
            influencerFeatures: 'Athlete endorsements and workout performance showcases'
        };
    } else if (department?.includes('Food') || department?.includes('Beverages')) {
        engagementData = {
            starRating: '⭐️⭐️⭐️⭐️☆',
            averageRating: '4.2',
            pros: ['Taste', 'Quality ingredients', 'Nutritional value'],
            cons: ['Price', 'Availability', 'Packaging size'],
            sentimentScore: 80,
            socialPlatforms: ['Instagram', 'Pinterest', 'Facebook'],
            influencerFeatures: 'Food blogger recipe collaborations and cooking demonstrations'
        };
    }
    
    return engagementData;
}

// Generate discoverability & shelf placement section
function generateDiscoverabilityShelfPlacement() {
    const shelfData = getDiscoverabilityShelfPlacementData();
    
    return `
        <div class="discoverability-shelf-placement">
            <h4><i class="fas fa-search"></i> Discoverability & Shelf Placement</h4>
            
            <div class="shelf-section">
                <h5>Facets</h5>
                <div class="facets-content">
                    <strong>Filterable attributes:</strong> ${shelfData.facets.join(', ')}
                </div>
            </div>
            
            <div class="shelf-section">
                <h5>Shelf Description Guidelines</h5>
                <ul class="shelf-list">
                    ${shelfData.shelfGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                </ul>
                
                ${shelfData.curatedCollections.length > 0 ? `
                    <div class="curated-collections">
                        <strong>Curated Collections:</strong>
                        <ul class="collection-list">
                            ${shelfData.curatedCollections.map(collection => `<li>"${collection}"</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Generate discoverability & shelf placement for modal (different formatting)
function generateDiscoverabilityShelfPlacementForModal() {
    const shelfData = getDiscoverabilityShelfPlacementData();
    
    return `
        <div class="styleguide-section">
            <h3><i class="fas fa-search"></i> Discoverability & Shelf Placement</h3>
            
            <h4>Facets</h4>
            <div class="detail-value" style="margin-bottom: 1rem;">
                <strong>Filterable attributes:</strong> ${shelfData.facets.join(', ')}
            </div>
            
            <h4>Shelf Description Guidelines</h4>
            <ul class="guidelines-list" style="margin-bottom: 1rem;">
                ${shelfData.shelfGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
            </ul>
            
            ${shelfData.curatedCollections.length > 0 ? `
                <h4>Curated Collections</h4>
                <ul class="guidelines-list">
                    ${shelfData.curatedCollections.map(collection => `<li>"${collection}"</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `;
}

// Get discoverability & shelf placement data based on selected category
function getDiscoverabilityShelfPlacementData() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Default data structure
    let shelfData = {
        facets: ['Brand', 'Price Range', 'Customer Rating', 'Availability'],
        shelfGuidelines: [
            'Featured in category landing pages',
            'Placement in seasonal promotional modules',
            'Support for themed collections'
        ],
        curatedCollections: ['Featured Products', 'Popular Items']
    };
    
    // Customize based on department/category
    if (department?.includes('Apparel') || category?.includes('Clothing')) {
        if (subcategory?.includes('Outerwear') || productType?.toLowerCase().includes('blazer')) {
            shelfData = {
                facets: ['Brand', 'Color', 'Size', 'Seasonality', 'Price Range', 'Material'],
                shelfGuidelines: [
                    'Featured in "Spring Office Essentials" collection',
                    'Placement in professional wear category pages',
                    'Seasonal shelf placement for spring/fall collections',
                    'Cross-promotion with business casual collections',
                    'Premium placement in workwear sections'
                ],
                curatedCollections: [
                    'Spring Office Essentials',
                    'Professional Wardrobe',
                    'Work-to-Weekend',
                    'Executive Style',
                    'Business Casual Staples'
                ]
            };
        } else if (subcategory?.includes('Tops') || subcategory?.includes('Shirts')) {
            shelfData = {
                facets: ['Brand', 'Color', 'Size', 'Sleeve Length', 'Fit Type', 'Price Range'],
                shelfGuidelines: [
                    'Featured in casual wear category pages',
                    'Cross-merchandised with bottoms and accessories',
                    'Seasonal rotation for trending colors and styles',
                    'Placement in layering essentials collections',
                    'Featured in mix-and-match style guides'
                ],
                curatedCollections: [
                    'Everyday Essentials',
                    'Layering Basics',
                    'Color Coordination Sets',
                    'Casual Friday',
                    'Weekend Comfort'
                ]
            };
        } else if (subcategory?.includes('Dresses')) {
            shelfData = {
                facets: ['Brand', 'Color', 'Size', 'Occasion', 'Dress Length', 'Seasonality'],
                shelfGuidelines: [
                    'Featured in occasion-specific collections',
                    'Seasonal placement for events and holidays',
                    'Cross-promotion with accessories and shoes',
                    'Premium placement in formal wear sections',
                    'Featured in styling guides for different occasions'
                ],
                curatedCollections: [
                    'Wedding Guest',
                    'Date Night',
                    'Office Appropriate',
                    'Summer Essentials',
                    'Holiday Party'
                ]
            };
        } else {
            // Generic apparel
            shelfData = {
                facets: ['Brand', 'Color', 'Size', 'Style', 'Price Range', 'Material'],
                shelfGuidelines: [
                    'Featured in trending fashion collections',
                    'Seasonal shelf rotation for style trends',
                    'Cross-merchandised with coordinating pieces',
                    'Placement in lifestyle-based collections',
                    'Featured in new arrivals sections'
                ],
                curatedCollections: [
                    'New Arrivals',
                    'Trending Now',
                    'Style Essentials',
                    'Mix & Match',
                    'Seasonal Favorites'
                ]
            };
        }
    } else if (department?.includes('Electronics')) {
        shelfData = {
            facets: ['Brand', 'Price Range', 'Features', 'Connectivity', 'Operating System', 'Storage'],
            shelfGuidelines: [
                'Featured in tech essentials collections',
                'Placement in compatibility-based shelves',
                'Cross-promotion with accessories and peripherals',
                'Premium placement in latest technology sections',
                'Featured in solution-based collections'
            ],
            curatedCollections: [
                'Smart Home Essentials',
                'Work From Home',
                'Gaming Setup',
                'Tech Upgrades',
                'Latest Innovation'
            ]
        };
    } else if (department?.includes('Home') || department?.includes('Furniture')) {
        shelfData = {
            facets: ['Brand', 'Material', 'Color', 'Size', 'Style', 'Room Type'],
            shelfGuidelines: [
                'Featured in room-specific collections',
                'Placement in style-based home décor shelves',
                'Cross-merchandised with complementary furniture',
                'Seasonal placement for home refresh campaigns',
                'Featured in complete room solution guides'
            ],
            curatedCollections: [
                'Living Room Essentials',
                'Modern Minimalist',
                'Cozy Comfort',
                'Small Space Solutions',
                'Home Office Setup'
            ]
        };
    } else if (department?.includes('Health') || department?.includes('Beauty')) {
        shelfData = {
            facets: ['Brand', 'Skin Type', 'Concern', 'Ingredient', 'Price Range', 'Cruelty-Free'],
            shelfGuidelines: [
                'Featured in skincare routine collections',
                'Placement in concern-specific beauty shelves',
                'Cross-promotion with complementary beauty products',
                'Seasonal placement for beauty trends',
                'Featured in expert-curated beauty sets'
            ],
            curatedCollections: [
                'Skincare Essentials',
                'Beauty Routine',
                'Clean Beauty',
                'Anti-Aging',
                'Sensitive Skin'
            ]
        };
    } else if (department?.includes('Sports') || department?.includes('Sporting')) {
        shelfData = {
            facets: ['Brand', 'Sport Type', 'Size', 'Performance Level', 'Gender', 'Price Range'],
            shelfGuidelines: [
                'Featured in sport-specific collections',
                'Placement in performance level categories',
                'Cross-merchandised with athletic accessories',
                'Seasonal placement for sports seasons',
                'Featured in complete athletic outfit guides'
            ],
            curatedCollections: [
                'Workout Essentials',
                'Running Gear',
                'Team Sports',
                'Outdoor Adventure',
                'Fitness Goals'
            ]
        };
    } else if (department?.includes('Food') || department?.includes('Beverages')) {
        shelfData = {
            facets: ['Brand', 'Dietary Tags', 'Flavor', 'Package Size', 'Organic', 'Price Range'],
            shelfGuidelines: [
                'Featured in dietary preference collections',
                'Placement in meal solution shelves',
                'Cross-promotion with complementary food items',
                'Seasonal placement for holiday and occasion foods',
                'Featured in recipe-based collections'
            ],
            curatedCollections: [
                'Healthy Choices',
                'Quick Meals',
                'Organic Selection',
                'Pantry Staples',
                'Gourmet Collection'
            ]
        };
    }
    
    return shelfData;
}

// Get product overview data based on selected category
function getProductOverviewData() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Generate a mock category ID (in real implementation, this would be from taxonomy data)
    const categoryId = Math.floor(Math.random() * 9000) + 1000;
    
    // Generate product-specific content using AI-powered customization
    let overviewData = generateProductSpecificContent(productType, department, category, subcategory, categoryId);
    
    return overviewData;
}

// Generate product-specific content based on product type
function generateProductSpecificContent(productType, department, category, subcategory, categoryId) {
    // Normalize product type for matching
    const normalizedProductType = productType.toLowerCase();
    
    // Default structure
    let overviewData = {
        title: `Premium Brand ${productType} - Model ABC123`,
        shortDescription: `A high-quality ${normalizedProductType} designed for modern consumers with advanced features and reliable performance.`,
        keyFeatures: [
            'Premium quality construction',
            'Modern design aesthetic',
            'Durable materials',
            'User-friendly features',
            'Comprehensive warranty',
            'Energy-efficient operation',
            'Easy maintenance',
            '2-year manufacturer warranty'
        ],
        categoryId: categoryId,
        certifications: [
            'Google Product Category Certified',
            'Quality Assurance Standards Met'
        ]
    };
    
    // Customize content based on specific product types following the guidelines
    
    // Kitchen Appliances - Juicer Example (like Philips Viva Collection)
    if (normalizedProductType.includes('juicer') || normalizedProductType.includes('juice')) {
        overviewData = {
            title: `Philips Viva Collection HR1832/00 Juicer – Compact Centrifugal Juicer`,
            shortDescription: `The Philips Viva Collection Juicer is a compact and efficient centrifugal juicer designed for quick and easy juice extraction. Ideal for small kitchens, it features quick-clean technology and a powerful motor for smooth operation.`,
            keyFeatures: [
                '500W motor for powerful juicing',
                'QuickClean technology for easy cleaning',
                'Compact design with integrated pulp container',
                'Drip-stop feature prevents spills',
                'Dishwasher-safe parts',
                'Transparent pulp container',
                'Non-slip feet for stability',
                'BPA-free plastic components',
                '2-year warranty',
                'Energy-efficient operation'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'CE marking compliance',
                'RoHS compliant'
            ]
        };
    }
    // Footwear - Running Shoes Example
    else if (normalizedProductType.includes('shoe') || normalizedProductType.includes('sneaker') || normalizedProductType.includes('running')) {
        overviewData = {
            title: `Nike Air Max 270 React – Men's Running Shoes`,
            shortDescription: `The Nike Air Max 270 React combines innovative cushioning technology with lightweight design for superior comfort during runs. Engineered with React foam and Max Air unit, these shoes deliver responsive energy return and all-day comfort.`,
            keyFeatures: [
                'React foam midsole for responsive cushioning',
                'Max Air 270 unit in heel for superior impact protection',
                'Lightweight mesh upper for breathability',
                'Rubber outsole with waffle pattern for traction',
                'Pull tabs for easy on/off',
                'Available in multiple colorways',
                'Durable construction for long-lasting wear',
                'Reflective elements for visibility',
                'Padded collar and tongue for comfort',
                '1-year manufacturer warranty'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'Sustainable materials initiative',
                'Quality performance standards'
            ]
        };
    }
    // Electronics - Smartphone Example
    else if (normalizedProductType.includes('phone') || normalizedProductType.includes('smartphone') || normalizedProductType.includes('mobile')) {
        overviewData = {
            title: `Samsung Galaxy S24 Ultra – 256GB Titanium Black Smartphone`,
            shortDescription: `The Samsung Galaxy S24 Ultra delivers flagship performance with advanced AI capabilities and professional-grade camera system. Built with titanium frame and featuring S Pen integration, it's designed for productivity and creativity.`,
            keyFeatures: [
                'Snapdragon 8 Gen 3 processor for flagship performance',
                '200MP main camera with AI-enhanced photography',
                '6.8-inch Dynamic AMOLED 2X display with 120Hz refresh rate',
                'Built-in S Pen for productivity and creativity',
                '5000mAh battery with 45W fast charging',
                'Titanium frame construction for durability',
                'IP68 water and dust resistance',
                '256GB storage with microSD expansion',
                '5G connectivity support',
                '2-year manufacturer warranty'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'FCC certified',
                'CE marking compliance',
                'RoHS compliant'
            ]
        };
    }
    // Home & Garden - Coffee Maker Example
    else if (normalizedProductType.includes('coffee') || normalizedProductType.includes('espresso') || normalizedProductType.includes('brew')) {
        overviewData = {
            title: `Breville Bambino Plus BES500BSS – Compact Espresso Machine`,
            shortDescription: `The Breville Bambino Plus is a compact espresso machine that delivers café-quality coffee with automatic milk texturing. Perfect for small kitchens, it features rapid heating technology and intuitive operation for consistent results.`,
            keyFeatures: [
                '15-bar Italian pump for optimal extraction pressure',
                'ThermoJet heating system with 3-second heat-up',
                'Automatic milk texturing with temperature control',
                'Pre-infusion function for enhanced flavor',
                'Compact footprint ideal for small spaces',
                'Stainless steel construction',
                'Removable water tank and drip tray',
                'Compatible with ESE pods and ground coffee',
                'Easy-clean maintenance cycle',
                '2-year manufacturer warranty'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'UL safety certified',
                'Energy Star qualified'
            ]
        };
    }
    // Apparel - Jacket Example
    else if (department?.includes('Apparel') || category?.includes('Clothing') || normalizedProductType.includes('jacket') || normalizedProductType.includes('coat')) {
        overviewData = {
            title: `Patagonia Better Sweater Fleece Jacket – Women's Medium Navy`,
            shortDescription: `The Patagonia Better Sweater Fleece Jacket combines warmth and versatility with sustainable materials for outdoor adventures and everyday wear. Made from recycled polyester fleece, it offers superior comfort with classic styling that transitions from trail to town.`,
            keyFeatures: [
                '100% recycled polyester fleece construction',
                'Full-zip design with stand-up collar',
                'Two zippered handwarmer pockets',
                'Feminine fit with princess seaming',
                'Machine washable for easy care',
                'Fair Trade Certified™ sewing',
                'Durable water repellent (DWR) finish',
                'Available in multiple colors and sizes',
                'Lifetime repair guarantee',
                'bluesign® approved fabric'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'Fair Trade Certified™',
                'bluesign® approved',
                '1% for the Planet member'
            ]
        };
    }
    // Electronics - Laptop Example
    else if (normalizedProductType.includes('laptop') || normalizedProductType.includes('notebook') || normalizedProductType.includes('computer')) {
        overviewData = {
            title: `Apple MacBook Pro 14-inch M3 Pro – 512GB Space Black Laptop`,
            shortDescription: `The MacBook Pro 14-inch with M3 Pro chip delivers exceptional performance for creative professionals and power users. Featuring advanced display technology and all-day battery life, it's designed for demanding workflows and professional applications.`,
            keyFeatures: [
                'Apple M3 Pro chip with 12-core CPU',
                '14.2-inch Liquid Retina XDR display',
                '512GB SSD storage with unified memory',
                'Up to 18 hours of battery life',
                'Advanced camera system with Center Stage',
                'Six-speaker sound system with spatial audio',
                'MagSafe 3 charging with fast-charge capability',
                'Thunderbolt 4 ports for connectivity',
                'Backlit Magic Keyboard with Touch ID',
                '1-year limited warranty with AppleCare eligible'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'FCC certified',
                'ENERGY STAR qualified',
                'EPEAT Gold rating'
            ]
        };
    }
    // Beauty & Personal Care - Skincare Example
    else if (normalizedProductType.includes('serum') || normalizedProductType.includes('moisturizer') || normalizedProductType.includes('skincare')) {
        overviewData = {
            title: `The Ordinary Hyaluronic Acid 2% + B5 – 30ml Hydrating Serum`,
            shortDescription: `The Ordinary Hyaluronic Acid 2% + B5 is a water-based serum that provides intense hydration to the skin. This multi-molecular weight hyaluronic acid formula attracts moisture and helps maintain skin plumpness throughout the day.`,
            keyFeatures: [
                'Multi-molecular weight hyaluronic acid complex',
                'Added Vitamin B5 for enhanced hydration',
                'Suitable for all skin types',
                'Fragrance-free and oil-free formula',
                'Vegan and cruelty-free',
                '30ml glass dropper bottle',
                'pH balanced for optimal skin compatibility',
                'Can be used morning and evening',
                'Dermatologist tested',
                '12-month shelf life after opening'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'Cruelty-free certified',
                'Vegan Society approved'
            ]
        };
    }
    // Sports & Outdoors - Fitness Equipment Example
    else if (normalizedProductType.includes('dumbbell') || normalizedProductType.includes('weight') || normalizedProductType.includes('fitness')) {
        overviewData = {
            title: `Bowflex SelectTech 552 Adjustable Dumbbells – Set of 2`,
            shortDescription: `The Bowflex SelectTech 552 Adjustable Dumbbells replace 15 sets of weights with their innovative dial system. Perfect for home gyms, they adjust from 5 to 52.5 pounds per dumbbell with just a turn of the dial.`,
            keyFeatures: [
                'Adjusts from 5 to 52.5 pounds per dumbbell',
                'Replaces 15 sets of traditional weights',
                'Unique dial system for quick weight changes',
                'Durable molding around metal plates',
                'Space-efficient design for home use',
                'Compatible with Bowflex SelectTech app',
                'Ergonomic handle design',
                'Safety tested to 10,000+ weight changes',
                'Includes workout guide and app access',
                '2-year warranty on parts'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'Safety tested and approved',
                'Home fitness equipment standards'
            ]
        };
    }
    // Generic fallback for other electronics
    else if (department?.includes('Electronics')) {
        overviewData = {
            title: `Premium ${productType} – Professional Grade Model`,
            shortDescription: `This professional-grade ${normalizedProductType} incorporates advanced technology to deliver superior performance and reliability. Designed for both professional and personal use, it offers cutting-edge features with intuitive operation.`,
            keyFeatures: [
                'Advanced technology integration',
                'Professional-grade components',
                'Intuitive user interface',
                'Energy-efficient operation',
                'Durable construction',
                'Multiple connectivity options',
                'Easy setup and installation',
                'Comprehensive user manual',
                'Technical support included',
                '2-year manufacturer warranty'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'FCC certified',
                'CE marking compliance',
                'RoHS compliant'
            ]
        };
    }
    // Home & Garden - Furniture Example
    else if (department?.includes('Home') || department?.includes('Furniture') || normalizedProductType.includes('chair') || normalizedProductType.includes('table')) {
        overviewData = {
            title: `Herman Miller Aeron Ergonomic Office Chair – Size B Graphite`,
            shortDescription: `The Herman Miller Aeron Chair is a revolutionary ergonomic office chair designed for all-day comfort and support. Featuring innovative PostureFit SL technology and breathable mesh construction, it adapts to your body and work style.`,
            keyFeatures: [
                'PostureFit SL technology for spine support',
                '8Z Pellicle mesh for breathability',
                'Tilt limiter and seat angle adjustment',
                'Adjustable arms with pivot and width control',
                'Pneumatic height adjustment',
                'Forward tilt mechanism',
                'Available in three sizes (A, B, C)',
                'Recyclable materials construction',
                'GREENGUARD certified for low emissions',
                '12-year warranty coverage'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'GREENGUARD Gold certified',
                'Cradle to Cradle Certified',
                'SCS Indoor Advantage Gold'
            ]
        };
    }
    // Generic fallback for other product types
    else {
        overviewData = {
            title: `Premium ${productType} – Professional Grade Model`,
            shortDescription: `This premium ${normalizedProductType} combines advanced features with reliable performance for exceptional user experience. Designed with quality materials and innovative technology, it delivers outstanding value and functionality.`,
            keyFeatures: [
                'Premium quality construction',
                'Advanced feature integration',
                'User-friendly design',
                'Durable materials and components',
                'Energy-efficient operation',
                'Easy maintenance and care',
                'Multiple size/color options available',
                'Professional-grade performance',
                'Comprehensive user documentation',
                '2-year manufacturer warranty'
            ],
            categoryId: categoryId,
            certifications: [
                'Google Product Category Certified',
                'Quality standards compliance',
                'Safety testing approved'
            ]
        };
    }
    
    return overviewData;
}

// Get visual media assets data based on selected category
function getVisualMediaAssetsData() {
    const productType = getDeepestLevelValue();
    const department = currentSelection.department;
    const category = currentSelection.category;
    const subcategory = currentSelection.subcategory;
    
    // Default data structure
    let mediaData = {
        primaryImage: `Clean, front-facing ${productType.toLowerCase()} on white background`,
        additionalViews: [
            'Side and back angles',
            'Detail shots of key features',
            'Lifestyle image showing product in use'
        ],
        imageTypes: [
            { name: 'Silo', description: 'White background product shots' },
            { name: 'Lifestyle', description: 'In-use or styled context images' },
            { name: 'Graphics', description: 'Technical specifications and labels' }
        ],
        richMedia: [
            '360° spin view for complete product visualization',
            'Product demo video showcasing key features',
            'Interactive hotspots highlighting specifications',
            'PDF user manual or setup guide'
        ]
    };
    
    // Customize based on department/category
    if (department?.includes('Apparel') || category?.includes('Clothing')) {
        mediaData = {
            primaryImage: `Front-facing ${productType.toLowerCase()} on white background with proper lighting`,
            additionalViews: [
                'Side and back angles showing fit and silhouette',
                'Close-up of fabric texture and construction details',
                'Model wearing the garment in various poses',
                'Flat lay styling with accessories'
            ],
            imageTypes: [
                { name: 'Silo', description: 'White background product shots showing true colors' },
                { name: 'Lifestyle', description: 'Styled with complementary pieces and accessories' },
                { name: 'Graphics', description: 'Size chart overlay and care instruction infographics' }
            ],
            richMedia: [
                '360° spin view showing all angles and fit',
                'Styling video demonstrating how to wear and style',
                'Fabric close-up video showing texture and quality',
                'PDF care guide with washing and maintenance instructions',
                'Size guide with measurement charts'
            ]
        };
    } else if (department?.includes('Electronics')) {
        mediaData = {
            primaryImage: `Professional front-facing ${productType.toLowerCase()} with clean lighting and minimal shadows`,
            additionalViews: [
                'Side profiles showing ports and connectivity options',
                'Back view with cable management and ventilation',
                'Close-up shots of interface and control elements',
                'Lifestyle shots showing device in typical use environment'
            ],
            imageTypes: [
                { name: 'Silo', description: 'Clean white background highlighting product design' },
                { name: 'Lifestyle', description: 'Real-world usage scenarios and environments' },
                { name: 'Graphics', description: 'Technical specifications, port diagrams, and feature callouts' }
            ],
            richMedia: [
                '360° product spin showing all interfaces and design details',
                'Product demo video showcasing key features and functionality',
                'Interactive hotspots explaining technical specifications',
                'Setup guide video for initial configuration',
                'PDF user manual with troubleshooting section'
            ]
        };
    } else if (department?.includes('Home') || department?.includes('Furniture')) {
        mediaData = {
            primaryImage: `${productType} photographed in well-lit studio setting showing true colors and textures`,
            additionalViews: [
                'Multiple angle views showing proportions and scale',
                'Detail shots of materials, finishes, and hardware',
                'Room setting images showing product in context',
                'Assembly or construction detail photography'
            ],
            imageTypes: [
                { name: 'Silo', description: 'Clean background focusing on product design and materials' },
                { name: 'Lifestyle', description: 'Styled room settings showing product in home environment' },
                { name: 'Graphics', description: 'Dimension diagrams, material specifications, and assembly guides' }
            ],
            richMedia: [
                '360° view showing all sides and design details',
                'Assembly instruction video with step-by-step guidance',
                'Room visualization tool showing product in different settings',
                'PDF assembly manual with detailed diagrams',
                'Care and maintenance guide for long-term use'
            ]
        };
    } else if (department?.includes('Health') || department?.includes('Beauty')) {
        mediaData = {
            primaryImage: `Clean, well-lit ${productType.toLowerCase()} showing packaging and product clearly`,
            additionalViews: [
                'Product packaging from multiple angles',
                'Close-up of product texture and consistency',
                'Application demonstration on model if appropriate',
                'Before/after comparison images'
            ],
            imageTypes: [
                { name: 'Silo', description: 'Clean white background highlighting product and packaging' },
                { name: 'Lifestyle', description: 'Application scenarios and daily routine integration' },
                { name: 'Graphics', description: 'Ingredient highlights, usage instructions, and benefit callouts' }
            ],
            richMedia: [
                '360° package view showing all product information',
                'Application tutorial video demonstrating proper usage',
                'Ingredient spotlight videos explaining key benefits',
                'PDF ingredient list and usage instructions',
                'Skin type compatibility guide'
            ]
        };
    } else if (department?.includes('Sports') || department?.includes('Sporting')) {
        mediaData = {
            primaryImage: `Action-ready ${productType.toLowerCase()} photographed with dynamic lighting and positioning`,
            additionalViews: [
                'Multiple angles showing design and functionality',
                'Close-up shots of materials and construction quality',
                'Action shots showing product in use during activities',
                'Detail views of performance features'
            ],
            imageTypes: [
                { name: 'Silo', description: 'Clean background highlighting technical design features' },
                { name: 'Lifestyle', description: 'Athletic activity scenarios and performance contexts' },
                { name: 'Graphics', description: 'Performance specifications, size charts, and feature diagrams' }
            ],
            richMedia: [
                '360° product view showing all design and functional elements',
                'Performance demonstration video in real athletic scenarios',
                'Feature explanation video highlighting technical advantages',
                'PDF performance guide and sizing charts',
                'Training tips and usage recommendations'
            ]
        };
    } else if (department?.includes('Food') || department?.includes('Beverages')) {
        mediaData = {
            primaryImage: `Appetizing ${productType.toLowerCase()} photography with natural lighting and attractive presentation`,
            additionalViews: [
                'Package front, back, and side views showing all information',
                'Product out of package showing actual appearance',
                'Serving suggestion and portion size photography',
                'Ingredient or preparation process images'
            ],
            imageTypes: [
                { name: 'Silo', description: 'Clean background focusing on package design and branding' },
                { name: 'Lifestyle', description: 'Meal contexts, serving suggestions, and consumption scenarios' },
                { name: 'Graphics', description: 'Nutritional information, preparation instructions, and ingredient highlights' }
            ],
            richMedia: [
                '360° package view showing all product information and labeling',
                'Preparation or cooking demonstration video',
                'Ingredient sourcing and quality story video',
                'PDF nutritional guide and recipe suggestions',
                'Storage and preparation best practices guide'
            ]
        };
    }
    
    return mediaData;
}

// Get current path as string
function getCurrentPath() {
    const parts = [];
    if (currentSelection.department) parts.push(currentSelection.department);
    if (currentSelection.category) parts.push(currentSelection.category);
    if (currentSelection.subcategory) parts.push(currentSelection.subcategory);
    if (currentSelection.producttype) parts.push(currentSelection.producttype);
    return parts.join(' > ');
}

// Get keywords from current path
function getCurrentPathKeywords() {
    return getCurrentPath().replace(/[>&]/g, ',').split(',').map(s => s.trim()).join(', ');
}

// Get structured data
function getStructuredData() {
    return {
        "@context": "https://schema.org/",
        "@type": "Product",
        "category": getCurrentPath(),
        "taxonomyVersion": "Google Product Taxonomy 2021-09-21",
        "classification": {
            "department": currentSelection.department,
            "category": currentSelection.category,
            "subcategory": currentSelection.subcategory,
            "productType": currentSelection.producttype
        },
        "seoRecommendations": {
            "primaryKeywords": getCurrentPathKeywords(),
            "titleFormat": `[Product Name] - ${currentSelection.producttype || currentSelection.subcategory || currentSelection.category}`,
            "breadcrumbPath": getCurrentPath()
        },
        "generatedDate": new Date().toISOString()
    };
}

// Export data
function exportData(format) {
    const data = getStructuredData();
    const filename = `style-guide-${Date.now()}`;
    
    if (format === 'json') {
        downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json');
    } else if (format === 'csv') {
        const csv = convertToCSV(data);
        downloadFile(csv, `${filename}.csv`, 'text/csv');
    }
}

// Convert data to CSV
function convertToCSV(data) {
    const rows = [
        ['Field', 'Value'],
        ['Department', data.classification.department || ''],
        ['Category', data.classification.category || ''],
        ['Subcategory', data.classification.subcategory || ''],
        ['Product Type', data.classification.productType || ''],
        ['Full Path', data.category],
        ['Primary Keywords', data.seoRecommendations.primaryKeywords],
        ['Title Format', data.seoRecommendations.titleFormat],
        ['Generated Date', data.generatedDate]
    ];
    
    return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

// Download file
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Copy to clipboard
function copyToClipboard() {
    const data = getStructuredData();
    const text = JSON.stringify(data, null, 2);
    
    navigator.clipboard.writeText(text).then(() => {
        showTemporaryMessage('Style guide copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showTemporaryMessage('Style guide copied to clipboard!');
    });
}

// Show temporary message
function showTemporaryMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'temp-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #38a169;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// Enable/disable export buttons
function enableExportButtons() {
    document.getElementById('export-json').disabled = false;
    document.getElementById('export-csv').disabled = false;
    document.getElementById('copy-output').disabled = false;
}

function disableExportButtons() {
    document.getElementById('export-json').disabled = true;
    document.getElementById('export-csv').disabled = true;
    document.getElementById('copy-output').disabled = true;
}

// Update count display
function updateCount(elementId, count) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `${count} option${count !== 1 ? 's' : ''}`;
    }
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// Show error message
function showError(message) {
    const resultsDiv = document.getElementById('validation-results');
    resultsDiv.innerHTML = `<div class="validation-item validation-error">${message}</div>`;
}

// Get standardized product attributes based on product type
function getStandardizedProductAttributes(productType, department, category, subcategory) {
    const normalizedProductType = productType.toLowerCase();
    
    // Default attributes structure
    let attributeData = {
        highPriority: [
            { attribute: 'Brand', value: 'Premium Brand' },
            { attribute: 'Type', value: productType },
            { attribute: 'Color', value: 'White' },
            { attribute: 'Size', value: 'Standard' },
            { attribute: 'Material', value: 'Premium Material' },
            { attribute: 'Style', value: 'Modern' }
        ],
        mediumPriority: [
            { attribute: 'Fit', value: 'Not Applicable' },
            { attribute: 'Functionality', value: 'Multi-purpose' },
            { attribute: 'Seasonality', value: 'All Season' }
        ],
        lowPriority: [
            { attribute: 'Pattern', value: 'Solid' },
            { attribute: 'Country of Origin', value: 'Various' },
            { attribute: 'Manufacturer', value: 'OEM Manufacturer' }
        ],
        conditional: []
    };
    
    // Customize attributes based on specific product types
    
    // Kitchen Appliances - Juicer (matching Philips example used throughout)
    if (normalizedProductType.includes('juicer') || normalizedProductType.includes('blender') || normalizedProductType.includes('coffee')) {
        attributeData = {
            highPriority: [
                { attribute: 'Brand', value: 'Philips' },
                { attribute: 'Type', value: 'Juicer' },
                { attribute: 'Color', value: 'White' },
                { attribute: 'Size', value: '1.5L Capacity' },
                { attribute: 'Material', value: 'BPA-free Plastic' },
                { attribute: 'Style', value: 'Centrifugal' }
            ],
            mediumPriority: [
                { attribute: 'Fit', value: 'Countertop Compatible' },
                { attribute: 'Functionality', value: 'Juice Extraction with QuickClean' },
                { attribute: 'Seasonality', value: 'All Season' }
            ],
            lowPriority: [
                { attribute: 'Pattern', value: 'Smooth Finish' },
                { attribute: 'Country of Origin', value: 'Netherlands' },
                { attribute: 'Manufacturer', value: 'Philips Consumer Lifestyle' }
            ],
            conditional: [
                { attribute: 'Power Rating', value: '500W' },
                { attribute: 'Speed Settings', value: '2-Speed Control' },
                { attribute: 'Warranty', value: '2 Years' },
                { attribute: 'Dishwasher Safe', value: 'Yes (Removable Parts)' }
            ]
        };
    }
    
    // Footwear - Running Shoes (matching Nike example)
    else if (normalizedProductType.includes('shoe') || normalizedProductType.includes('sneaker') || normalizedProductType.includes('boot')) {
        attributeData = {
            highPriority: [
                { attribute: 'Brand', value: 'Nike' },
                { attribute: 'Type', value: 'Running Shoes' },
                { attribute: 'Color', value: 'Black/White' },
                { attribute: 'Size', value: 'US 6-13' },
                { attribute: 'Material', value: 'Flyknit Mesh' },
                { attribute: 'Style', value: 'Athletic Performance' }
            ],
            mediumPriority: [
                { attribute: 'Fit', value: 'True to Size, Regular Width' },
                { attribute: 'Functionality', value: 'Running and Training' },
                { attribute: 'Seasonality', value: 'All Season' }
            ],
            lowPriority: [
                { attribute: 'Pattern', value: 'Solid with Accent Colors' },
                { attribute: 'Country of Origin', value: 'Vietnam' },
                { attribute: 'Manufacturer', value: 'Nike Inc.' }
            ],
            conditional: [
                { attribute: 'Gender', value: 'Unisex' },
                { attribute: 'Sports Type', value: 'Running' },
                { attribute: 'Width Options', value: 'Regular, Wide' },
                { attribute: 'Technology', value: 'Air Cushioning' }
            ]
        };
    }
    
    // Electronics - Smartphone (matching iPhone example)
    else if (normalizedProductType.includes('phone') || normalizedProductType.includes('laptop') || normalizedProductType.includes('tablet')) {
        attributeData = {
            highPriority: [
                { attribute: 'Brand', value: 'Apple' },
                { attribute: 'Type', value: 'Smartphone' },
                { attribute: 'Color', value: 'Space Gray' },
                { attribute: 'Size', value: '6.1-inch Display' },
                { attribute: 'Material', value: 'Aluminum and Glass' },
                { attribute: 'Style', value: 'Premium' }
            ],
            mediumPriority: [
                { attribute: 'Fit', value: 'Pocket-friendly' },
                { attribute: 'Functionality', value: 'Photography and Communication' },
                { attribute: 'Seasonality', value: 'All Season' }
            ],
            lowPriority: [
                { attribute: 'Pattern', value: 'Matte Finish' },
                { attribute: 'Country of Origin', value: 'China' },
                { attribute: 'Manufacturer', value: 'Apple Inc.' }
            ],
            conditional: [
                { attribute: 'Storage Options', value: '128GB, 256GB, 512GB' },
                { attribute: 'Operating System', value: 'iOS 15' },
                { attribute: 'Camera', value: '12MP Dual Camera System' },
                { attribute: 'Connectivity', value: '5G, WiFi 6, Bluetooth 5.0' }
            ]
        };
    }
    
    // Apparel - Jacket (matching Patagonia example)
    else if (department?.includes('Apparel') || category?.includes('Clothing')) {
        attributeData = {
            highPriority: [
                { attribute: 'Brand', value: 'Patagonia' },
                { attribute: 'Type', value: 'Jacket' },
                { attribute: 'Color', value: 'Navy Blue' },
                { attribute: 'Size', value: 'XS-XXL' },
                { attribute: 'Material', value: 'Recycled Polyester' },
                { attribute: 'Style', value: 'Outdoor Performance' }
            ],
            mediumPriority: [
                { attribute: 'Fit', value: 'Regular Fit' },
                { attribute: 'Functionality', value: 'Weather Protection and Breathability' },
                { attribute: 'Seasonality', value: 'Fall/Winter' }
            ],
            lowPriority: [
                { attribute: 'Pattern', value: 'Solid Color' },
                { attribute: 'Country of Origin', value: 'Vietnam' },
                { attribute: 'Manufacturer', value: 'Patagonia Inc.' }
            ],
            conditional: [
                { attribute: 'Gender', value: 'Unisex' },
                { attribute: 'Care Instructions', value: 'Machine Wash Cold' },
                { attribute: 'Sustainability', value: 'Made from Recycled Materials' },
                { attribute: 'Weather Resistance', value: 'DWR Treatment' }
            ]
        };
    }
    
    // Beauty & Personal Care - Serum (matching The Ordinary example)
    else if (normalizedProductType.includes('serum') || normalizedProductType.includes('moisturizer') || normalizedProductType.includes('cream')) {
        attributeData = {
            highPriority: [
                { attribute: 'Brand', value: 'The Ordinary' },
                { attribute: 'Type', value: 'Facial Serum' },
                { attribute: 'Color', value: 'Clear' },
                { attribute: 'Size', value: '30ml' },
                { attribute: 'Material', value: 'Glass Bottle with Dropper' },
                { attribute: 'Style', value: 'Clinical Minimalist' }
            ],
            mediumPriority: [
                { attribute: 'Fit', value: 'All Skin Types' },
                { attribute: 'Functionality', value: 'Hydration and Plumping' },
                { attribute: 'Seasonality', value: 'All Season' }
            ],
            lowPriority: [
                { attribute: 'Pattern', value: 'Minimalist Packaging' },
                { attribute: 'Country of Origin', value: 'Canada' },
                { attribute: 'Manufacturer', value: 'DECIEM Beauty Group' }
            ],
            conditional: [
                { attribute: 'Active Ingredient', value: 'Hyaluronic Acid 2% + B5' },
                { attribute: 'Application Time', value: 'Morning and Evening' },
                { attribute: 'Skin Concerns', value: 'Dehydration and Fine Lines' },
                { attribute: 'Fragrance', value: 'Fragrance-Free' }
            ]
        };
    }
    
    // Beer example (as per your template)
    else if (normalizedProductType.includes('beer') || normalizedProductType.includes('lager') || normalizedProductType.includes('ale')) {
        attributeData = {
            highPriority: [
                { attribute: 'Brand', value: 'Kingfisher' },
                { attribute: 'Type', value: 'Lager' },
                { attribute: 'Color', value: 'Golden' },
                { attribute: 'Size', value: '330ml Bottle' },
                { attribute: 'Material', value: 'Glass Packaging' },
                { attribute: 'Style', value: 'Light-bodied' }
            ],
            mediumPriority: [
                { attribute: 'Fit', value: 'Not Applicable' },
                { attribute: 'Functionality', value: 'Refreshing Beverage' },
                { attribute: 'Seasonality', value: 'Summer Preferred' }
            ],
            lowPriority: [
                { attribute: 'Pattern', value: 'Label Design: Classic' },
                { attribute: 'Country of Origin', value: 'India' },
                { attribute: 'Manufacturer', value: 'United Breweries Ltd.' }
            ],
            conditional: [
                { attribute: 'Alcohol Content', value: '4.8% ABV' },
                { attribute: 'Serving Temperature', value: 'Chilled (4-6°C)' },
                { attribute: 'Pairing', value: 'Spicy Indian Cuisine' }
            ]
        };
    }
    
    return attributeData;
}

// Get intelligent cross-selling recommendations based on product type
function getIntelligentCrossSellingRecommendations(productType, department, category, subcategory) {
    const normalizedProductType = productType.toLowerCase();
    
    // Default recommendations structure
    let recommendations = {
        introText: `Complete your ${productType} experience with these carefully curated complementary products.`,
        products: [
            { name: 'Complementary Product 1', reason: 'Enhances overall experience' },
            { name: 'Complementary Product 2', reason: 'Frequently bought together' },
            { name: 'Complementary Product 3', reason: 'Matches style and functionality' }
        ],
        personalizationTips: [
            'Display recommendations based on customer purchase history',
            'Consider seasonal relevance and trending products',
            'Use customer demographics for targeted suggestions'
        ],
        displayGuidelines: [
            'Show 3-4 complementary products in a carousel format',
            'Include product images and brief descriptions',
            'Highlight the relationship between products'
        ]
    };
    
    // Customize recommendations based on specific product types
    
    // Kitchen Appliances - Juicer (matching Philips example)
    if (normalizedProductType.includes('juicer') || normalizedProductType.includes('blender') || normalizedProductType.includes('coffee')) {
        recommendations = {
            introText: 'Complete your healthy kitchen setup with these perfectly paired accessories for your Philips Viva Collection Juicer.',
            products: [
                { name: 'Philips Glass Juice Cups Set', reason: 'Perfect serving size for fresh juice, dishwasher safe' },
                { name: 'Fresh Produce Storage Containers', reason: 'Keep fruits and vegetables fresh for juicing' },
                { name: 'Philips Citrus Press Attachment', reason: 'Expand juicing capabilities for citrus fruits' },
                { name: 'Kitchen Scale for Portions', reason: 'Measure ingredients for consistent juice recipes' },
                { name: 'Recipe Book: Healthy Juices', reason: 'Discover new juice combinations and health benefits' }
            ],
            personalizationTips: [
                'Recommend seasonal fruit storage solutions during harvest seasons',
                'Suggest recipe books based on health goals (detox, energy, immunity)',
                'Show complementary Philips kitchen appliances for complete setup',
                'Target health-conscious customers with organic produce accessories'
            ],
            displayGuidelines: [
                'Display in kitchen lifestyle setting showing complete juicing station',
                'Use carousel format highlighting "Complete Your Juicing Experience"',
                'Show bundle pricing for multiple accessory purchases',
                'Include customer reviews focusing on convenience and results'
            ]
        };
    }
    
    // Footwear - Running Shoes (matching Nike example)
    else if (normalizedProductType.includes('shoe') || normalizedProductType.includes('sneaker') || normalizedProductType.includes('boot')) {
        recommendations = {
            introText: 'Elevate your running performance with these essential accessories that complement your Nike running shoes.',
            products: [
                { name: 'Nike Dri-FIT Running Socks', reason: 'Moisture-wicking technology prevents blisters and enhances comfort' },
                { name: 'Nike Running Belt with Water Bottle', reason: 'Stay hydrated during long runs without compromising performance' },
                { name: 'Garmin GPS Running Watch', reason: 'Track performance metrics and training progress' },
                { name: 'Nike Reflective Running Vest', reason: 'Safety for early morning or evening runs' },
                { name: 'Shoe Cleaning Kit', reason: 'Maintain shoe performance and extend lifespan' }
            ],
            personalizationTips: [
                'Recommend seasonal gear based on local weather patterns',
                'Suggest performance tracking devices for serious runners',
                'Show style-coordinated accessories for fashion-conscious athletes',
                'Target recommendations based on running frequency and distance'
            ],
            displayGuidelines: [
                'Create "Complete Runner\'s Kit" bundle presentation',
                'Show products in action with running lifestyle imagery',
                'Use grid format with clear category separation (Performance, Safety, Maintenance)',
                'Include size and compatibility information for accessories'
            ]
        };
    }
    
    // Electronics - Smartphone (matching iPhone example)
    else if (normalizedProductType.includes('phone') || normalizedProductType.includes('laptop') || normalizedProductType.includes('tablet')) {
        recommendations = {
            introText: 'Maximize your iPhone experience with these essential accessories designed for seamless integration and protection.',
            products: [
                { name: 'Apple MagSafe Charger', reason: 'Fast wireless charging with perfect magnetic alignment' },
                { name: 'Apple Leather Case with MagSafe', reason: 'Premium protection while maintaining wireless charging capability' },
                { name: 'AirPods Pro (2nd Generation)', reason: 'Seamless audio experience with spatial audio and noise cancellation' },
                { name: 'Apple CarPlay Adapter', reason: 'Enhanced driving experience with hands-free connectivity' },
                { name: 'iCloud+ Storage Plan', reason: 'Secure backup and additional storage for photos and data' }
            ],
            personalizationTips: [
                'Recommend accessories based on customer lifestyle (business, creative, fitness)',
                'Suggest storage plans based on photo and app usage patterns',
                'Show ecosystem products for existing Apple device owners',
                'Target professional accessories for business customers'
            ],
            displayGuidelines: [
                'Display as "Complete Apple Ecosystem" with connectivity highlights',
                'Use clean, minimalist presentation matching Apple aesthetic',
                'Show compatibility badges and seamless integration features',
                'Include trade-in or upgrade paths for existing customers'
            ]
        };
    }
    
    // Apparel - Jacket (matching Patagonia example)
    else if (department?.includes('Apparel') || category?.includes('Clothing')) {
        recommendations = {
            introText: 'Complete your outdoor adventure wardrobe with these sustainable and functional pieces that complement your Patagonia jacket.',
            products: [
                { name: 'Patagonia Merino Wool Base Layer', reason: 'Perfect layering system for temperature regulation' },
                { name: 'Patagonia Hiking Backpack', reason: 'Durable, weather-resistant storage for outdoor adventures' },
                { name: 'Patagonia Beanie Hat', reason: 'Matching sustainable materials and outdoor functionality' },
                { name: 'Merrell Hiking Boots', reason: 'Complete outdoor outfit with reliable footwear' },
                { name: 'Patagonia Buff Neck Gaiter', reason: 'Additional weather protection and versatile styling' }
            ],
            personalizationTips: [
                'Recommend seasonal layering pieces based on local climate',
                'Suggest activity-specific gear (hiking, skiing, camping)',
                'Show sustainable product alternatives for eco-conscious customers',
                'Target color-coordinated pieces for style-conscious buyers'
            ],
            displayGuidelines: [
                'Present as "Complete Outdoor Adventure Kit" with layering guide',
                'Use lifestyle imagery showing products in natural settings',
                'Highlight sustainability credentials and material compatibility',
                'Include size and fit guidance for layering combinations'
            ]
        };
    }
    
    // Beauty & Personal Care - Serum (matching The Ordinary example)
    else if (normalizedProductType.includes('serum') || normalizedProductType.includes('moisturizer') || normalizedProductType.includes('cream')) {
        recommendations = {
            introText: 'Build an effective skincare routine around your The Ordinary Hyaluronic Acid serum with these complementary products.',
            products: [
                { name: 'The Ordinary Niacinamide 10% + Zinc 1%', reason: 'Controls oil production and minimizes pore appearance' },
                { name: 'The Ordinary Natural Moisturizing Factors + HA', reason: 'Seals in hydration and completes the moisture barrier' },
                { name: 'The Ordinary Squalane Cleanser', reason: 'Gentle cleansing that preserves skin barrier before serum application' },
                { name: 'Sunscreen SPF 30+', reason: 'Essential daily protection for healthy skin maintenance' },
                { name: 'Jade Facial Roller', reason: 'Enhances serum absorption and provides lymphatic drainage' }
            ],
            personalizationTips: [
                'Recommend products based on specific skin concerns (acne, aging, sensitivity)',
                'Suggest routine timing (morning vs evening products)',
                'Show ingredient compatibility and layering order',
                'Target recommendations based on skin type assessment'
            ],
            displayGuidelines: [
                'Present as "Complete Skincare Routine" with step-by-step usage',
                'Use clean, clinical presentation matching The Ordinary aesthetic',
                'Include ingredient information and compatibility charts',
                'Show before/after results and routine timeline expectations'
            ]
        };
    }
    
    // Beer example (as per your template)
    else if (normalizedProductType.includes('beer') || normalizedProductType.includes('lager') || normalizedProductType.includes('ale')) {
        recommendations = {
            introText: 'Complete your refreshment setup with these perfectly paired accessories for enjoying Kingfisher beer.',
            products: [
                { name: 'Kingfisher Pint Glasses', reason: 'Enhances drinking experience with proper beer presentation' },
                { name: 'Philips Mini Fridge', reason: 'Keeps beer chilled and ready at optimal serving temperature' },
                { name: 'Bar Snack Combo Pack', reason: 'Complements beer for social settings and enhances flavor' },
                { name: 'Beer Bottle Opener Set', reason: 'Essential tool for easy bottle opening and entertaining' },
                { name: 'Indian Spice Mix Collection', reason: 'Perfect pairing with spicy snacks that complement lager taste' }
            ],
            personalizationTips: [
                'Recommend seasonal snacks and food pairings',
                'Suggest entertaining accessories for social drinkers',
                'Show regional food specialties that pair well with lager',
                'Target premium glassware for beer enthusiasts'
            ],
            displayGuidelines: [
                'Present as "Complete Entertainment Setup" with social context',
                'Use lifestyle imagery showing friends enjoying beer together',
                'Highlight cultural and regional pairing traditions',
                'Include serving temperature and pairing guidance'
            ]
        };
    }
    
    return recommendations;
}

// Get intelligent customer engagement data based on product type
function getIntelligentCustomerEngagementData(productType, department, category, subcategory) {
    const normalizedProductType = productType.toLowerCase();
    
    // Default engagement data structure
    let engagementData = {
        starDisplay: '⭐⭐⭐⭐☆',
        averageRating: '4.2',
        totalReviews: '856',
        verifiedPercentage: '89',
        featuredReview: {
            stars: '⭐⭐⭐⭐⭐',
            text: 'Great product with excellent quality. Highly recommend for anyone looking for reliable performance.',
            reviewer: 'Verified Buyer'
        },
        ratingBreakdown: [
            { aspect: 'Quality', stars: '⭐⭐⭐⭐⭐', rating: '4.6' },
            { aspect: 'Value', stars: '⭐⭐⭐⭐☆', rating: '4.2' },
            { aspect: 'Performance', stars: '⭐⭐⭐⭐⭐', rating: '4.5' }
        ],
        userContent: {
            totalMedia: '234',
            highlights: [
                'Customer photos showing product in use',
                'Unboxing videos with first impressions',
                'Long-term usage reviews with photos'
            ]
        },
        insights: {
            repeatPurchase: '76',
            recommendation: '89',
            satisfaction: '92'
        }
    };
    
    // Customize engagement data based on specific product types
    
    // Kitchen Appliances - Juicer (matching Philips example)
    if (normalizedProductType.includes('juicer') || normalizedProductType.includes('blender') || normalizedProductType.includes('coffee')) {
        engagementData = {
            starDisplay: '⭐⭐⭐⭐⭐',
            averageRating: '4.7',
            totalReviews: '1,342',
            verifiedPercentage: '94',
            featuredReview: {
                stars: '⭐⭐⭐⭐⭐',
                text: 'The Philips Viva Collection Juicer exceeded my expectations! Easy to clean with the QuickClean technology, and the juice quality is fantastic. The compact design fits perfectly in my small kitchen. Worth every penny for daily fresh juice.',
                reviewer: 'Verified Buyer - Sarah M.'
            },
            ratingBreakdown: [
                { aspect: 'Juice Quality', stars: '⭐⭐⭐⭐⭐', rating: '4.8' },
                { aspect: 'Easy to Clean', stars: '⭐⭐⭐⭐⭐', rating: '4.7' },
                { aspect: 'Compact Design', stars: '⭐⭐⭐⭐⭐', rating: '4.6' },
                { aspect: 'Motor Power', stars: '⭐⭐⭐⭐⭐', rating: '4.5' },
                { aspect: 'Value for Money', stars: '⭐⭐⭐⭐☆', rating: '4.3' },
                { aspect: 'Durability', stars: '⭐⭐⭐⭐⭐', rating: '4.6' }
            ],
            userContent: {
                totalMedia: '487',
                highlights: [
                    '✓ Fresh juice preparation videos showing smooth operation',
                    '✓ Before/after cleaning photos demonstrating QuickClean technology',
                    '✓ Kitchen setup photos showing compact countertop placement',
                    '✓ Juice recipe videos with different fruit combinations',
                    '✓ Long-term usage reviews after 6+ months of daily use'
                ]
            },
            insights: {
                repeatPurchase: '82',
                recommendation: '94',
                satisfaction: '96'
            }
        };
    }
    
    // Footwear - Running Shoes (matching Nike example)
    else if (normalizedProductType.includes('shoe') || normalizedProductType.includes('sneaker') || normalizedProductType.includes('boot')) {
        engagementData = {
            starDisplay: '⭐⭐⭐⭐☆',
            averageRating: '4.5',
            totalReviews: '2,847',
            verifiedPercentage: '91',
            featuredReview: {
                stars: '⭐⭐⭐⭐⭐',
                text: 'Perfect running shoes! Great cushioning for long runs, excellent grip on various surfaces. The breathable material keeps feet comfortable even during intense workouts. Sizing is accurate and the design looks fantastic.',
                reviewer: 'Verified Buyer - Marathon Runner Mike'
            },
            ratingBreakdown: [
                { aspect: 'Comfort', stars: '⭐⭐⭐⭐⭐', rating: '4.7' },
                { aspect: 'Durability', stars: '⭐⭐⭐⭐☆', rating: '4.4' },
                { aspect: 'Style/Design', stars: '⭐⭐⭐⭐⭐', rating: '4.6' },
                { aspect: 'Fit/Sizing', stars: '⭐⭐⭐⭐⭐', rating: '4.5' },
                { aspect: 'Performance', stars: '⭐⭐⭐⭐⭐', rating: '4.6' },
                { aspect: 'Value for Money', stars: '⭐⭐⭐⭐☆', rating: '4.2' }
            ],
            userContent: {
                totalMedia: '1,156',
                highlights: [
                    '✓ Running action videos showing performance on different terrains',
                    '✓ Fit and sizing photos with detailed measurements',
                    '✓ Before/after wear photos showing durability over time',
                    '✓ Style coordination photos with athletic wear',
                    '✓ Marathon and race completion posts featuring the shoes'
                ]
            },
            insights: {
                repeatPurchase: '78',
                recommendation: '91',
                satisfaction: '93'
            }
        };
    }
    
    // Electronics - Smartphone (matching iPhone example)
    else if (normalizedProductType.includes('phone') || normalizedProductType.includes('laptop') || normalizedProductType.includes('tablet')) {
        engagementData = {
            starDisplay: '⭐⭐⭐⭐⭐',
            averageRating: '4.8',
            totalReviews: '8,924',
            verifiedPercentage: '96',
            featuredReview: {
                stars: '⭐⭐⭐⭐⭐',
                text: 'Outstanding iPhone performance! The camera quality is incredible, battery life lasts all day, and the seamless integration with other Apple devices makes everything so convenient. Face ID works flawlessly and the build quality is premium.',
                reviewer: 'Verified Buyer - Tech Professional Alex'
            },
            ratingBreakdown: [
                { aspect: 'Camera Quality', stars: '⭐⭐⭐⭐⭐', rating: '4.9' },
                { aspect: 'Battery Life', stars: '⭐⭐⭐⭐⭐', rating: '4.7' },
                { aspect: 'Performance', stars: '⭐⭐⭐⭐⭐', rating: '4.9' },
                { aspect: 'Build Quality', stars: '⭐⭐⭐⭐⭐', rating: '4.8' },
                { aspect: 'User Interface', stars: '⭐⭐⭐⭐⭐', rating: '4.8' },
                { aspect: 'Value for Money', stars: '⭐⭐⭐⭐☆', rating: '4.3' }
            ],
            userContent: {
                totalMedia: '3,247',
                highlights: [
                    '✓ Professional photo samples showcasing camera capabilities',
                    '✓ Unboxing videos with first impressions and setup',
                    '✓ Performance benchmark videos and gaming footage',
                    '✓ Ecosystem integration demos with other Apple devices',
                    '✓ Long-term usage reviews after iOS updates and daily use'
                ]
            },
            insights: {
                repeatPurchase: '85',
                recommendation: '96',
                satisfaction: '97'
            }
        };
    }
    
    // Apparel - Jacket (matching Patagonia example)
    else if (department?.includes('Apparel') || category?.includes('Clothing')) {
        engagementData = {
            starDisplay: '⭐⭐⭐⭐⭐',
            averageRating: '4.6',
            totalReviews: '1,789',
            verifiedPercentage: '92',
            featuredReview: {
                stars: '⭐⭐⭐⭐⭐',
                text: 'Excellent Patagonia jacket! Perfect for hiking and outdoor activities. The weather resistance is impressive, and the sustainable materials make me feel good about the purchase. Fit is true to size and the quality is outstanding.',
                reviewer: 'Verified Buyer - Outdoor Enthusiast Emma'
            },
            ratingBreakdown: [
                { aspect: 'Weather Protection', stars: '⭐⭐⭐⭐⭐', rating: '4.8' },
                { aspect: 'Comfort/Fit', stars: '⭐⭐⭐⭐⭐', rating: '4.6' },
                { aspect: 'Durability', stars: '⭐⭐⭐⭐⭐', rating: '4.7' },
                { aspect: 'Style/Design', stars: '⭐⭐⭐⭐☆', rating: '4.4' },
                { aspect: 'Sustainability', stars: '⭐⭐⭐⭐⭐', rating: '4.9' },
                { aspect: 'Value for Money', stars: '⭐⭐⭐⭐☆', rating: '4.2' }
            ],
            userContent: {
                totalMedia: '623',
                                 highlights: [
                     '✓ Outdoor adventure photos showing jacket in various weather conditions',
                     '✓ Fit and layering photos with different outfit combinations',
                     '✓ Durability tests and long-term wear documentation',
                     '✓ Sustainability feature highlights and material close-ups',
                     '✓ Activity-specific usage photos (hiking, camping, urban wear)'
                 ]
             },
             insights: {
                 repeatPurchase: '79',
                 recommendation: '92',
                 satisfaction: '94'
             }
         };
     }
     
     // Beauty & Personal Care - Serum (matching The Ordinary example)
     else if (normalizedProductType.includes('serum') || normalizedProductType.includes('moisturizer') || normalizedProductType.includes('cream')) {
         engagementData = {
             starDisplay: '⭐⭐⭐⭐⭐',
             averageRating: '4.4',
             totalReviews: '3,156',
             verifiedPercentage: '88',
             featuredReview: {
                 stars: '⭐⭐⭐⭐⭐',
                 text: 'The Ordinary Hyaluronic Acid serum is amazing! Noticed significant improvement in skin hydration within a week. The lightweight formula absorbs quickly and works well under makeup. Great value for such effective results.',
                 reviewer: 'Verified Buyer - Skincare Enthusiast Lisa'
             },
             ratingBreakdown: [
                 { aspect: 'Effectiveness', stars: '⭐⭐⭐⭐⭐', rating: '4.6' },
                 { aspect: 'Texture/Feel', stars: '⭐⭐⭐⭐☆', rating: '4.3' },
                 { aspect: 'Absorption', stars: '⭐⭐⭐⭐⭐', rating: '4.5' },
                 { aspect: 'Value for Money', stars: '⭐⭐⭐⭐⭐', rating: '4.8' },
                 { aspect: 'Packaging', stars: '⭐⭐⭐⭐☆', rating: '4.1' },
                 { aspect: 'Skin Compatibility', stars: '⭐⭐⭐⭐☆', rating: '4.2' }
             ],
             userContent: {
                 totalMedia: '892',
                 highlights: [
                     '✓ Before/after skin transformation photos over 30-60 days',
                     '✓ Application technique videos showing proper usage',
                     '✓ Skin routine integration photos with other products',
                     '✓ Texture and consistency demonstration videos',
                     '✓ Long-term results documentation with progress tracking'
                 ]
             },
             insights: {
                 repeatPurchase: '91',
                 recommendation: '88',
                 satisfaction: '89'
             }
         };
     }
     
     // Beer example (as per your template)
     else if (normalizedProductType.includes('beer') || normalizedProductType.includes('lager') || normalizedProductType.includes('ale')) {
         engagementData = {
             starDisplay: '⭐⭐⭐⭐☆',
             averageRating: '4.5',
             totalReviews: '1,248',
             verifiedPercentage: '87',
             featuredReview: {
                 stars: '⭐⭐⭐⭐⭐',
                 text: 'Crisp and refreshing Kingfisher Lager. Perfect for summer evenings and social gatherings. The packaging is sturdy and the bottle design is classic. Great taste that pairs well with spicy Indian food.',
                 reviewer: 'Verified Buyer - Beer Connoisseur Raj'
             },
             ratingBreakdown: [
                 { aspect: 'Taste', stars: '⭐⭐⭐⭐⭐', rating: '4.7' },
                 { aspect: 'Packaging', stars: '⭐⭐⭐⭐☆', rating: '4.5' },
                 { aspect: 'Value for Money', stars: '⭐⭐⭐⭐☆', rating: '4.4' },
                 { aspect: 'Availability', stars: '⭐⭐⭐⭐☆', rating: '4.2' },
                 { aspect: 'Freshness', stars: '⭐⭐⭐⭐⭐', rating: '4.6' },
                 { aspect: 'Overall Experience', stars: '⭐⭐⭐⭐⭐', rating: '4.5' }
             ],
             userContent: {
                 totalMedia: '334',
                 highlights: [
                     '✓ Pint glass with Kingfisher Lager in perfect pour',
                     '✓ Chilled bottle setup in mini fridge with temperature display',
                     '✓ Social gathering photos with branded coasters and snacks',
                     '✓ Food pairing photos with Indian cuisine and appetizers',
                     '✓ Outdoor party and barbecue settings with friends'
                 ]
             },
             insights: {
                 repeatPurchase: '73',
                 recommendation: '85',
                 satisfaction: '88'
             }
         };
     }
     
     return engagementData;
}