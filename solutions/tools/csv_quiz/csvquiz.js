// Global variable to store the base URL for raw GitHub content
const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/frontnest/learningtools/master/cs_templates/';

// Categories configuration - map file prefixes to category names
const CATEGORIES = {
    'en_hu_': 'English - Hungarian',
    'ge_hu_': 'German - Hungarian',
    'math_': 'Math',
    'game_': 'Games',
    // Add more categories as needed
    'full_en_hu_': '01 Full dictionary English',
    'full_ge_hu_': '01 Full dictionary German',
    'oep1_en_hu_': '02 Oxford English Plus 1',
    'oep2_en_hu_': '02 Oxford English Plus 2',
    'dp1_ge_hu_': '03 Die Deutschprofis 1',
    'dp2_ge_hu_': '03 Die Deutschprofis 2',
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
            .filter(file => file.name.endsWith('.csv') && 
                !file.name.startsWith('notes_') && 
                !file.name.startsWith('di_') && 
                !file.name.startsWith('tale_')
                )
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
                        .replace(/^(en_hu_|ge_hu_|math_|game_|full_en_hu_|full_ge_hu_|oep1_en_hu_|oep2_en_hu_|dp1_ge_hu_|dp2_ge_hu_)/, '') // Remove prefix
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
            // Extract text after <br> (magyar és idegen nyelv)
            const frontTextRaw = columns[0].trim();
            const backTextRaw = columns[1].trim();

            // Szöveg kinyerése: az utolsó <br> után
            const frontText = frontTextRaw.split('<br>').pop().trim();
            const backText = backTextRaw.split('<br>').pop().trim();

            // Create a new card for each row
            const card = document.createElement('div');
            card.classList.add('card');

            const front = document.createElement('div');
            front.classList.add('front');
            // Kép generálás kikommentelve
            /*
            front.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;">
                    ${visualizeWord(frontText)}
                    <span>${frontText}</span>
                </div>
            `;
            */
            front.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;">
                    <!-- ${visualizeWord(frontText)} -->
                    <span>${frontText}</span>
                </div>
            `;

            const back = document.createElement('div');
            back.classList.add('back');
            // Kép generálás kikommentelve
            /*
            back.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;">
                    ${visualizeWord(backText)}
                    <span>${backText}</span>
                </div>
            `;
            */
            back.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;">
                    <!-- ${visualizeWord(backText)} -->
                    <span>${backText}</span>
                </div>
            `;

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

// Updated CHARSET and palette generation logic
const DIGRAPHS = ["dzs", "dz", "cs", "gy", "ly", "ny", "sz", "ty", "zs"];
function createCharset() {
  const punct = ['.', ',', '?', '!', "'"];
  const digits = Array.from({ length: 10 }, (_, i) => String(i));
  const base = ['A', 'a', 'Á', 'á', 'B', 'b', 'C', 'c', 'Cs', 'cs', 'D', 'd', 'Dz', 'dz', 'Dzs', 'dzs', 'E', 'e', 'É', 'é', 'F', 'f', 'G', 'g', 'Gy', 'gy', 'H', 'h', 'I', 'i', 'Í', 'í', 'J', 'j', 'K', 'k', 'L', 'l', 'Ly', 'ly', 'M', 'm', 'N', 'n', 'Ny', 'ny', 'O', 'o', 'Ó', 'ó', 'Ö', 'ö', 'Ő', 'ő', 'P', 'p', 'Q', 'q', 'R', 'r', 'S', 's', 'Sz', 'sz', 'T', 't', 'Ty', 'ty', 'U', 'u', 'Ú', 'ú', 'Ü', 'ü', 'Ű', 'ű', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y', 'Z', 'z', 'Zs', 'zs'];
  return [...punct, ...digits, ...base];
}
const CHARSET = createCharset();

function createPalette(n) {
  const colors = [];
  for (let i = 0; i < n; i++) {
    const hue = Math.round((i / n) * 280);
    colors.push(`hsl(${hue}deg 70% 50%)`);
  }
  return colors;
}
const palette = createPalette(CHARSET.length);

function tokenizeText(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i).toLowerCase();
    const digraph = DIGRAPHS.find(d => rest.startsWith(d));
    if (digraph) {
      tokens.push(text.slice(i, i + digraph.length));
      i += digraph.length;
    } else {
      tokens.push(text[i]);
      i++;
    }
  }
  return tokens;
}

// Updated visualizeWord function
function visualizeWord(word) {
  if (!word) return '';
  const tokens = tokenizeText(word);

  const dotSize = 8; // Updated default values
  const xSpacing = 12;
  const ySpacing = 1;
  const marginLeft = 10;
  const marginTop = 10;
  const width = Math.max(120, (tokens.length + 2) * xSpacing);
  const height = Math.max(80, (CHARSET.length + 1) * ySpacing + 4);

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#0e1117;display:block;border-radius:8px;">`;

  // Axes
  svg += `<line x1="${marginLeft}" y1="${height - marginTop}" x2="${width - 10}" y2="${height - marginTop}" stroke="rgba(255,255,255,0.15)" />`;
  svg += `<line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${height - marginTop}" stroke="rgba(255,255,255,0.15)" />`;

  // Connecting lines
  for (let i = 0; i < tokens.length - 1; i++) {
    const ci1 = CHARSET.indexOf(tokens[i]);
    const ci2 = CHARSET.indexOf(tokens[i + 1]);
    const x1 = marginLeft + i * xSpacing;
    const y1 = height - marginTop - (ci1 !== -1 ? ci1 : 0) * ySpacing;
    const x2 = marginLeft + (i + 1) * xSpacing;
    const y2 = height - marginTop - (ci2 !== -1 ? ci2 : 0) * ySpacing;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="gray" stroke-width="1"/>`;
  }

  // Dots
  tokens.forEach((ch, i) => {
    const ci = CHARSET.indexOf(ch);
    const cx = marginLeft + i * xSpacing;
    const cy = height - marginTop - (ci !== -1 ? ci : 0) * ySpacing;
    const color = palette[ci !== -1 ? ci : 0];
    svg += `<circle cx="${cx}" cy="${cy}" r="${dotSize}" fill="${color}" />`;
  });

  svg += `</svg>`;
  return svg;
}

// Példa: kártya generálásnál
function showCard(cardData, side) {
    // cardData: { hu: 'béka', en: 'frog', ... }
    const cardFront = document.getElementById('cardFront');
    const cardBack = document.getElementById('cardBack');
    // Előlap: magyar szó + SVG
        // Kép generálás kikommentelve
        /*
        cardFront.innerHTML = `
            <div>${cardData.hu}</div>
            <div>${visualizeWord(cardData.hu)}</div>
        `;
        */
        cardFront.innerHTML = `
            <div>${cardData.hu}</div>
            <!-- <div>${visualizeWord(cardData.hu)}</div> -->
        `;
    // Hátlap: idegen szó + SVG
        // Kép generálás kikommentelve
        /*
        cardBack.innerHTML = `
            <div>${cardData.en}</div>
            <div>${visualizeWord(cardData.en)}</div>
        `;
        */
        cardBack.innerHTML = `
            <div>${cardData.en}</div>
            <!-- <div>${visualizeWord(cardData.en)}</div> -->
        `;
}
