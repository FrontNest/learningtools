// Global variable to store the base URL for raw GitHub content
const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/Felisha76/portfolio/main/cs_templates/';

// Categories configuration - map file prefixes to category names
const CATEGORIES = {
    'en_hu_': 'English - Hungarian',
    'math_': 'Math',
    'game_': 'Games',
    // Add more categories as needed
};

// References to DOM elements
const prevBtn = document.querySelector('#prev-btn');
const nextBtn = document.querySelector('#next-btn');
const book = document.querySelector('#book');

// Business Logic
let currentState = 1;
let maxState = 1;
let papers = [];

// Event listeners
prevBtn.addEventListener("click", goPrevious);
nextBtn.addEventListener("click", goNext);

// Add keyboard navigation
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowLeft':
            // Left arrow key - go to previous page
            goPrevious();
            break;
        case 'ArrowRight':
            // Right arrow key - go to next page
            goNext();
            break;
    }
});

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
        const apiUrl = 'https://api.github.com/repos/Felisha76/portfolio/contents/cs_templates';
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch file list from GitHub');
        }
        
        const data = await response.json();
        
        // Filter only CSV files and organize by category
        const categorizedFiles = {};
        
        data
            // Filter files what are CSV files and not notes
            .filter(file => file.name.endsWith('.csv') && !file.name.startsWith('notes_'))
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
                        .replace(/^(en_hu_|math_|game_)/, '') // Remove prefix
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
        
        // Update page title or header with the current quiz name
        updateQuizTitle(fileName);
        
        // Process CSV content after updating the title
        processCSVContent(contents);
    } catch (error) {
        console.error('Error loading CSV from GitHub:', error);
        alert('Failed to load the selected CSV file. Please try again.');
    }
}

// Function to update the page title or header with the current quiz name
function updateQuizTitle(fileName) {
    // Get display name by removing prefix and extension
    let displayName = fileName
        .replace(/^(en_hu_|math_|game_)/, '')
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
    
    // Set the title (not append)
    titleElement.textContent = displayName;
}

// Function to process CSV content and create book pages
function processCSVContent(contents) {
    const rows = contents.split('\n').filter(row => row.trim());
    
    // Clear the book
    book.innerHTML = '';
    papers = [];
    
    // Get the title from the dropdown
    const titleText = document.querySelector('.quiz-title')?.textContent || 'Flashcards';
    
    // Create a cover page
    const coverPage = document.createElement('div');
    coverPage.id = 'p1';
    coverPage.className = 'paper';
    
    // Check if we have at least one row for the first page
    let firstRowFront = '';
    let firstRowBack = '';
    
    if (rows.length > 0) {
        const columns = rows[0].split(',');
        if (columns.length >= 2) {
            firstRowFront = columns[0].trim();
            firstRowBack = columns[1].trim();
        }
    }
    
    coverPage.innerHTML = `
        <div class="front">
            <div class="front-content">
                <h1 class="book-title">Flashcards</h1>
                <div class="cover-img-placeholder"></div>
            </div>
        </div>
        <div class="back">
            <div class="back-content">
                <div class="content">
                    <h2>${firstRowFront}</h2>
                </div>
            </div>
        </div>
    `;
    
    book.appendChild(coverPage);
    papers.push(coverPage);
    
    // Create pages for each row in the CSV
    for (let i = 0; i < rows.length; i++) {
        const currentRow = rows[i].split(',');
        
        // Skip if this is the first row (already handled in cover page back)
        if (i === 0) {
            // Create the second page with the first row's back content
            const secondPage = document.createElement('div');
            secondPage.id = 'p2';
            secondPage.className = 'paper';
            
            // Get the next row's front content if available
            const nextRowFront = i + 1 < rows.length ? rows[i + 1].split(',')[0].trim() : '';
            
            secondPage.innerHTML = `
                <div class="front">
                    <div class="front-content">
                        <div class="content">
                            <h2>${firstRowBack}</h2>
                        </div>
                    </div>
                </div>
                <div class="back">
                    <div class="back-content">
                        <div class="content">
                            <h2>${nextRowFront}</h2>
                        </div>
                    </div>
                </div>
            `;
            
            book.appendChild(secondPage);
            papers.push(secondPage);
            continue;
        }
        
        // For all other rows
        if (currentRow.length >= 2) {
            const currentBack = currentRow[1].trim();  // B column of current row
            const nextFront = i + 1 < rows.length ? rows[i + 1].split(',')[0].trim() : ''; // A column of next row
            
            // Create a new paper
            const paper = document.createElement('div');
            paper.id = `p${i + 2}`; // +2 because we already have two pages
            paper.className = 'paper';
            
            paper.innerHTML = `
                <div class="front">
                    <div class="front-content">
                        <div class="content">
                            <h2>${currentBack}</h2>
                        </div>
                    </div>
                </div>
                <div class="back">
                    <div class="back-content">
                        <div class="content">
                            <h2>${nextFront}</h2>
                        </div>
                    </div>
                </div>
            `;
            
            book.appendChild(paper);
            papers.push(paper);
        }
    }
    
    // Add a final page if needed (when we have an odd number of rows)
    if (rows.length % 2 === 0) {
        const finalPage = document.createElement('div');
        finalPage.id = `p${papers.length + 1}`;
        finalPage.className = 'paper';
        
        finalPage.innerHTML = `
            <div class="front">
                <div class="front-content">
                    <div class="content">
                        <h2>End of Flashcards</h2>
                        <div class="cover-img-placeholder2"></div>
                    </div>
                </div>
            </div>
            <div class="back">
                <div class="back-content">
                    <div class="content">
                        <h2>Practice makes perfect!</h2>

                    </div>
                </div>
            </div>
        `;
        
        book.appendChild(finalPage);
        papers.push(finalPage);
    }
    
    // Reset state
    currentState = 1;
    maxState = papers.length + 1;
    
    // Reset all papers to initial state
    papers.forEach((paper, index) => {
        paper.classList.remove('flipped');
        paper.style.zIndex = papers.length - index;
    });
    
    // Close the book
    closeBook(true);
}

function openBook() {
    book.style.transform = "translateX(50%)";
    prevBtn.style.transform = "translateX(-180px)";
    nextBtn.style.transform = "translateX(180px)";
}

function closeBook(isFirstPage) {
    if(isFirstPage) {
        book.style.transform = "translateX(0%)";
    } else {
        book.style.transform = "translateX(100%)";
    }
    prevBtn.style.transform = "translateX(0px)";
    nextBtn.style.transform = "translateX(0px)";
}

function goNext() {
    if(currentState < maxState) {
        if(currentState === 1) {
            openBook();
        }
        
        if(currentState === papers.length) {
            closeBook(false);
        }
        
        const paper = papers[currentState - 1];
        paper.classList.add("flipped");
        paper.style.zIndex = currentState;
        
        currentState++;
    }
}

function goPrevious() {
    if(currentState > 1) {
        currentState--;
        
        if(currentState === 1) {
            closeBook(true);
        }
        
        if(currentState === papers.length - 1) {
            openBook();
        }
        
        const paper = papers[currentState - 1];
        paper.classList.remove("flipped");
        paper.style.zIndex = papers.length - currentState + 1;
    }
}

// Initialize the dropdown when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create container for dropdown if it doesn't exist
    if (!document.getElementById('csv-dropdown-container')) {
        const container = document.createElement('div');
        container.id = 'csv-dropdown-container';
        container.style.position = 'absolute';
        container.style.top = '20px';
        container.style.left = '20px';
        container.style.zIndex = '1000';
        
        document.body.insertBefore(container, document.body.firstChild);
    }
    
    // Populate the dropdown
    populateFileDropdown();
});
