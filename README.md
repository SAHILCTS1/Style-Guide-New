# Retail Style Guide Generator

A comprehensive web application for retail category managers to navigate and utilize Google Product Taxonomy for creating style guides and validating product categorization.

## Features

### 🏗️ Complete Google Product Taxonomy Integration
- **5,595 Categories**: Full coverage of Google Product Taxonomy (2021-09-21)
- **4-Level Hierarchy**: Department → Category → Sub-category → Product Type
- **Cascading Dropdowns**: Smart filtering that enables precise navigation through the taxonomy tree

### 🔍 Smart Product Matching
- **Manual Entry**: Enter product types manually for flexible categorization
- **Fuzzy Matching**: Advanced similarity algorithm finds the closest matching categories
- **Interactive Results**: Click on suggested matches to auto-populate the form

### ✅ Product Validation
- **Category Alignment**: Validates products against selected taxonomy categories
- **SEO Scoring**: Calculates SEO optimization scores based on keyword alignment
- **Content Guidelines**: Provides specific recommendations for titles and descriptions

### 📋 Style Guide Generation
- **Automated Creation**: Generates comprehensive style guides based on selections
- **SEO Guidelines**: Includes category-specific SEO recommendations
- **Structured Data**: Provides JSON-LD schema markup for better search visibility
- **Export Options**: Download as JSON or CSV formats

## Setup Instructions

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for CORS compatibility)

### Installation

1. **Download the Files**
   ```
   Style Guide Version 2/
   ├── index.html
   ├── styles.css
   ├── script.js
   ├── taxonomy.txt
   └── README.md
   ```

2. **Start Local Server**
   
   **Option A: Using Python**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Option B: Using Node.js**
   ```bash
   npx http-server
   ```
   
   **Option C: Using PHP**
   ```bash
   php -S localhost:8000
   ```

3. **Access Application**
   Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## How to Use

### 1. Product Category Navigation

#### Cascading Dropdowns
1. **Department (Level 1)**: Select the broadest category (e.g., "Apparel & Accessories")
2. **Category (Level 2)**: Choose a more specific category (e.g., "Clothing")
3. **Sub-category (Level 3)**: Select the sub-category (e.g., "Tops")
4. **Product Type (Level 4)**: Pick the exact product type (e.g., "T-Shirts")

Each selection automatically filters the next level, ensuring accurate categorization.

#### Selected Path Display
The breadcrumb shows your complete selection path:
```
Apparel & Accessories > Clothing > Tops > T-Shirts
```

### 2. Manual Product Type Entry

If you know the product type but need to find its category:

1. **Enter Product Name**: Type in the manual entry field (e.g., "running shoes")
2. **Find Matches**: Click "Find Match" or press Enter
3. **Review Results**: Browse similarity-scored suggestions
4. **Select Match**: Click on the best match to auto-populate dropdowns

### 3. Product Validation

Test your product data against the taxonomy:

1. **Enter Product Info**: Fill in product title and description
2. **Validate**: Click "Validate Product"
3. **Review Results**: Check category alignment and SEO scores
4. **Apply Recommendations**: Use the suggestions to improve your product data

### 4. Style Guide Generation

Once you've selected a category path:

1. **Auto-Generation**: Style guide appears automatically
2. **Review Content**: Check SEO guidelines and recommendations
3. **Export Data**: 
   - **JSON**: Download structured data
   - **CSV**: Export as spreadsheet
   - **Copy**: Copy to clipboard for immediate use

## Understanding the Output

### Style Guide Components

#### Category Classification
- Full taxonomy path
- Level-by-level breakdown
- Google taxonomy version reference

#### SEO Guidelines
- Recommended title formats
- Keyword suggestions
- Meta description guidance
- Breadcrumb navigation patterns

#### Structured Data
```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "category": "Apparel & Accessories > Clothing > Tops > T-Shirts",
  "classification": {
    "department": "Apparel & Accessories",
    "category": "Clothing",
    "subcategory": "Tops",
    "productType": "T-Shirts"
  }
}
```

### Validation Scores

#### SEO Score Calculation
- **25 points**: Department keyword in title/description
- **25 points**: Category keyword present
- **25 points**: Sub-category keyword present
- **25 points**: Product type keyword present

#### Score Interpretation
- **80-100%**: Excellent - optimal category alignment
- **60-79%**: Good - minor improvements needed
- **Below 60%**: Poor - significant optimization required

## Technical Architecture

### File Structure
- **index.html**: Main application interface
- **styles.css**: Modern, responsive styling with glassmorphism effects
- **script.js**: Core functionality and taxonomy processing
- **taxonomy.txt**: Google Product Taxonomy data (5,595 categories)

### Key Technologies
- **Vanilla JavaScript**: No framework dependencies
- **CSS Grid & Flexbox**: Responsive layout
- **Fetch API**: Asynchronous data loading
- **Local Storage**: Session persistence (planned)

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Common Issues

#### "Failed to load taxonomy data"
- **Cause**: CORS restrictions when opening HTML directly
- **Solution**: Use a local web server (see setup instructions)

#### Dropdowns Not Populating
- **Cause**: JavaScript errors or missing taxonomy file
- **Solution**: Check browser console for errors, ensure taxonomy.txt is present

#### Export Not Working
- **Cause**: Browser security restrictions
- **Solution**: Ensure you're using HTTPS or localhost

### Performance Tips
- The application loads 5,595 categories efficiently using hierarchical indexing
- Fuzzy matching processes up to 1,000+ product types in real-time
- Modern browsers handle the taxonomy tree structure without performance issues

## Future Enhancements

### Planned Features
- **Multi-language Support**: Localized taxonomies
- **Custom Taxonomies**: Import your own category structures
- **Bulk Validation**: Process multiple products simultaneously
- **API Integration**: Direct connection to e-commerce platforms
- **Analytics Dashboard**: Track categorization patterns

### Contributing
This is a specialized tool for retail category management. For feature requests or bug reports, please document specific use cases and taxonomy requirements.

## License

This tool is designed for retail professionals and category managers. The Google Product Taxonomy data is publicly available and used in accordance with Google's terms of service.

---

**Last Updated**: 2024-01-20
**Taxonomy Version**: Google Product Taxonomy 2021-09-21
**Total Categories**: 5,595 