// Global variable to store the base URL for raw GitHub content
const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/frontnest/learningtools/main/cs_templates/';

// Categories configuration - map file prefixes to category names
const CATEGORIES = {
    'en_hu_': 'English - Hungarian',
    'ge_hu_': 'German - Hungarian',
    'math_': 'Math',
    'game_': 'Games',
    // Add more categories as needed
};

// Function to determine the category of a file based on its name
function getCategoryForFile(fileName) {
    for (const prefix in CATEGORIES) {
        if (fileName.startsWith(prefix)) {
            return CATEGORIES[prefix];
        }
    }
    return 'Other'; // Default category for files that don't match any prefix
}

// Function to fetch the list of CSV files from the GitHub repository
async function fetchCSVFileList() {
    try {
        // GitHub API endpoint to get repository contents
        const apiUrl = 'https://api.github.com/repos/frontnest/learningtools/contents/cs_templates';
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch file list from GitHub');
        }
        
        const data = await response.json();
        
        // Filter only CSV files and organize by category
        const categorizedFiles = {};
        
        data
            // Filter files what are CSV files and not notes, dictionaries and tales
            .filter(file => file.name.endsWith('.csv') && !file.name.startsWith('notes_') && !file.name.startsWith('di_') && !file.name.startsWith('tale_'))
            // Filename grouping by category
            .forEach(file => {
                const category = getCategoryForFile(file.name);
                
                if (!categorizedFiles[category]) {
                    categorizedFiles[category] = [];
                }
                
                categorizedFiles[category].push({
                    name: file.name,
                    // You can add a display name by removing the prefix and .csv extension
                    displayName: file.name
                        .replace(/^(en_hu_|ge_hu_|math_|game_)/, '') // Remove prefix
                        .replace(/\.csv$/, '')                // Remove .csv extension
                        .replace(/_/g, ' ')                   // Replace underscores with spaces
                });
            });
        
        return categorizedFiles;
    } catch (error) {
        console.error('Error fetching CSV file list:', error);
        return {};
    }
}

// Function to populate the dropdown with CSV files organized by categories
async function populateFileDropdown() {
    const categorizedFiles = await fetchCSVFileList();
    const dropdownContainer = document.getElementById('csv-dropdown-container');
    
    // Clear existing content
    dropdownContainer.innerHTML = '';
    
    // Create select element
    const select = document.createElement('select');
    select.id = 'csv-file-dropdown';
    select.classList.add('csv-dropdown');
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a file from my repository';
    defaultOption.selected = true;
    defaultOption.disabled = true;
    select.appendChild(defaultOption);
    
    // Add options for each category and its files
    Object.keys(categorizedFiles).sort().forEach(category => {
        // Create optgroup for the category
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        
        // Add files in this category
        categorizedFiles[category].sort((a, b) => a.displayName.localeCompare(b.displayName)).forEach(file => {
            const option = document.createElement('option');
            option.value = file.name;
            option.textContent = file.displayName;
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
    });
    
    // Add change event listener
    select.addEventListener('change', function() {
        loadCSVFromGitHub(this.value);
    });
    
    // Append select to container
    dropdownContainer.appendChild(select);
}

// Function to load CSV content from GitHub
async function loadCSVFromGitHub(fileName) {
    try {
        const fileUrl = GITHUB_RAW_BASE_URL + fileName;
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ${fileName}`);
        }
        
        const contents = await response.text();
        processCSVContent(contents);
        
        // Update page title or header with the current quiz name
        updateQuizTitle(fileName);
    } catch (error) {
        console.error('Error loading CSV from GitHub:', error);
        alert('Failed to load the selected CSV file. Please try again.');
    }
}

// Function to update the page title or header with the current quiz name
function updateQuizTitle(fileName) {
    // Get display name by removing prefix and extension
    let displayName = fileName
        .replace(/^(en_hu_|ge_hu_math_|game_)/, '')
        .replace(/\.csv$/, '')
        .replace(/_/g, ' ');
    
    // Capitalize first letter of each word
    displayName = displayName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // Find a header element to update, or create one if needed
    let titleElement = document.querySelector('.quiz-title');
    if (!titleElement) {
        titleElement = document.createElement('h2');
        titleElement.className = 'quiz-title';
        const container = document.getElementById('csv-dropdown-container');
        container.parentNode.insertBefore(titleElement, container.nextSibling);
    }
    
    titleElement.textContent = displayName;
}

// Function to process CSV content and create cards
function processCSVContent(contents) {
    const rows = contents.split('\n');
    const cardsContainer = document.querySelector('.wrap');
    
    // Clear any existing cards
    cardsContainer.innerHTML = '';
    
    // Loop through the rows in the CSV file
    rows.forEach(row => {
        if (!row.trim()) return; // Skip empty rows
        
        const columns = row.split(',');

        // Ensure we have both A and B column data
        if (columns.length >= 2) {
            const frontText = columns[0].trim();  // A column
            const backText = columns[1].trim();   // B column
            
            // Create a new card for each row
            const card = document.createElement('div');
            card.classList.add('card');

            const front = document.createElement('div');
            front.classList.add('front');
            front.innerHTML = `<span>${frontText}</span>`;
            
            const back = document.createElement('div');
            back.classList.add('back');
            back.innerHTML = `<span>${backText}</span>`;

            // Append the front and back to the card
            card.appendChild(front);
            card.appendChild(back);

            // Append the card to the container
            cardsContainer.appendChild(card);
        }
    });
}

function loadCSV() {
    const fileInput = document.getElementById('quiz_csv');
    const file = fileInput.files[0];
    
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(event) {
        const contents = event.target.result;
        processCSVContent(contents);
    };
    
    // Read the file as text
    reader.readAsText(file);
}

// Initialize the dropdown when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create container for dropdown if it doesn't exist
    if (!document.getElementById('csv-dropdown-container')) {
        const container = document.createElement('div');
        container.id = 'csv-dropdown-container';
        
        // Insert the dropdown container before the existing file input
        const fileInput = document.getElementById('quiz_csv');
        if (fileInput && fileInput.parentNode) {
            fileInput.parentNode.insertBefore(container, fileInput);
        } else {
            // If file input doesn't exist, add to the beginning of the body
            document.body.insertBefore(container, document.body.firstChild);
        }
    }
    
    // Populate the dropdown
    populateFileDropdown();
});
