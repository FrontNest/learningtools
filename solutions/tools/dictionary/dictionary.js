document.addEventListener('DOMContentLoaded', function() {
    const fileSelect = document.getElementById('fileSelect');
    const searchInput = document.getElementById('searchInput');
    const tableBody = document.getElementById('tableBody');
    const loadingIndicator = document.getElementById('loadingIndicator');    
    // GitHub repository information
    const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/frontnest/learningtools/main/cs_templates/';
    const GITHUB_API_URL = 'https://api.github.com/repos/frontnest/learningtools/contents/cs_templates/';

    // Current data
    let currentData = [];

    // Initialize the page
    init();

    // Function to initialize the page
    async function init() {
        await loadNoteFiles();

        // Add event listeners
        fileSelect.addEventListener('change', loadSelectedFile);
        searchInput.addEventListener('input', filterNotes);
    }

    // Function to load available note files from GitHub
    async function loadNoteFiles() {
        try {
            const response = await fetch(GITHUB_API_URL);

            if (!response.ok) {
                throw new Error('Failed to fetch file list from GitHub');
            }

            const data = await response.json();

            // Filter only files that start with "notes_" and end with ".csv"
            const noteFiles = data.filter(file => 
                (
                    file.name.startsWith('di_en_') ||
                    file.name.startsWith('di_ge_')
                ) &&
                file.name.endsWith('.csv')
            );

            // Clear the select options
            fileSelect.innerHTML = '';

            // Add a default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a file...';
            fileSelect.appendChild(defaultOption);

            // Add options for each file
            noteFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file.name;
                // Display a more readable name (remove "notes_" prefix and ".csv" suffix)
                option.textContent = file.name.replace('di_en_', '')
                                                .replace('.csv', '')
                                                .replace('di_ge_', '')
                                                .replace('_', ' ')
                                                .replace('to_', 'to ')
                                                .replace('s_', 's '); // replace corrected 2025.09.25
                fileSelect.appendChild(option);
            });

            // Hide loading indicator if there are files
            if (noteFiles.length > 0) {
                loadingIndicator.style.display = 'none';
            } else {
                loadingIndicator.textContent = 'No note files found.';
            }

            console.log('Found note files:', noteFiles.map(f => f.name)); // Debug log

        } catch (error) {
            console.error('Error loading note files:', error);
            loadingIndicator.textContent = 'Error loading files. Please try again later.';
        }
    }

    // Function to load the selected CSV file
    async function loadSelectedFile() {
        const selectedFile = fileSelect.value;

        if (!selectedFile) {
            tableBody.innerHTML = '';
            loadingIndicator.textContent = 'Please select a file.';
            loadingIndicator.style.display = 'block';
            return;
        }

        try {
            loadingIndicator.textContent = 'Loading file...';
            loadingIndicator.style.display = 'block';

            const fileUrl = GITHUB_RAW_BASE_URL + selectedFile;
            const response = await fetch(fileUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch file content');
            }

            const csvText = await response.text();

            // Parse CSV and display data
            parseCSV(csvText);

            // Apply any existing search filter
            filterNotes();

            loadingIndicator.style.display = 'none';

        } catch (error) {
            console.error('Error loading file:', error);
            loadingIndicator.textContent = 'Error loading file. Please try again.';
        }
    }

    // 2025.09.25 added as corrected function not to wait for headers
       function parseCSV(csvText) {
        const parsed = Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
        });

        currentData = parsed.data.map(row => ({
            topic: row[0] || '',
            description: row[1] || '',
            example: row[2] || '',
            notes: row[3] || ''
        }));

        displayData(currentData);
}
    
    
    // Function to display data in the table
    function displayData(data) {
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'No data to display.';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Create cells for each column
            const topicCell = document.createElement('td');
            topicCell.textContent = item.topic;
            row.appendChild(topicCell);
            
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = item.description;
            row.appendChild(descriptionCell);
            
            const exampleCell = document.createElement('td');
            exampleCell.textContent = item.example;
            row.appendChild(exampleCell);

            // Negyedik oszlop: vizualizáció
            const visualizationCell = document.createElement('td');
            visualizationCell.innerHTML = visualizeWord(item.example);
            row.appendChild(visualizationCell);

            tableBody.appendChild(row);
        });
    }
    
    // Function to filter notes based on search input
    function filterNotes() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            // If search is empty, show all data without highlighting
            displayData(currentData);
            return;
        }
        
        // Filter data that contains the search term in any field
        const filteredData = currentData.filter(item => 
            item.topic.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.example.toLowerCase().includes(searchTerm) //||
            // item.notes.toLowerCase().includes(searchTerm)
        );
        
        // Display filtered data with highlighting
        displayFilteredData(filteredData, searchTerm);
    }
    
    // Function to display filtered data with highlighted search terms
    function displayFilteredData(data, searchTerm) {
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'No matching results found.';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Create cells for each column with highlighted search term
            const topicCell = document.createElement('td');
            topicCell.innerHTML = highlightText(item.topic, searchTerm);
            row.appendChild(topicCell);
            
            const descriptionCell = document.createElement('td');
            descriptionCell.innerHTML = highlightText(item.description, searchTerm);
            row.appendChild(descriptionCell);
            
            const exampleCell = document.createElement('td');
            exampleCell.innerHTML = highlightText(item.example, searchTerm);
            row.appendChild(exampleCell);
            
            // Negyedik oszlop: vizualizáció
            const visualizationCell = document.createElement('td');
            visualizationCell.innerHTML = visualizeWord(item.example);
            row.appendChild(visualizationCell);

            tableBody.appendChild(row);
        });
    }
    
    // Function to highlight search term in text
    function highlightText(text, searchTerm) {
        if (!text) return '';
        
        // Escape special characters in the search term for regex
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Create a regex that's case insensitive
        const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
        
        // Replace matches with highlighted version
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Vizualizációs függvény: minden betűhöz egy színes kör
    function visualizeWord(word) {
        if (!word) return '';

        // Magyar digráfok és trigráfok
        const DIGRAPHS = ["dzs", "dz", "cs", "gy", "ly", "ny", "sz", "ty", "zs"];
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

        // Karakterkészlet
        function createCharset() {
            const punct = ['.', ',', '?', '!', "'"];
            const digits = Array.from({ length: 10 }, (_, i) => String(i));
            const base = ['A', 'a', 'Á', 'á', 'B', 'b', 'C', 'c', 'Cs', 'cs', 'D', 'd', 'Dz', 'dz', 'Dzs', 'dzs', 'E', 'e', 'É', 'é', 'F', 'f', 'G', 'g', 'Gy', 'gy', 'H', 'h', 'I', 'i', 'Í', 'í', 'J', 'j', 'K', 'k', 'L', 'l', 'Ly', 'ly', 'M', 'm', 'N', 'n', 'Ny', 'ny', 'O', 'o', 'Ó', 'ó', 'Ö', 'ö', 'Ő', 'ő', 'P', 'p', 'Q', 'q', 'R', 'r', 'S', 's', 'Sz', 'sz', 'T', 't', 'Ty', 'ty', 'U', 'u', 'Ú', 'ú', 'Ü', 'ü', 'Ű', 'ű', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y', 'Z', 'z', 'Zs', 'zs'];
            return [...punct, ...digits, ...base];
        }
        const CHARSET = createCharset();

        // Paletta
        function createPalette(n) {
            const colors = [];
            for (let i = 0; i < n; i++) {
                const hue = Math.round((i / n) * 280);
                colors.push(`hsl(${hue}deg 70% 50%)`);
            }
            return colors;
        }
        const palette = createPalette(CHARSET.length);

        // Tokenizálás
        const tokens = tokenizeText(word);

        // SVG paraméterek
        const dotSize = 8; // Updated default values
        const xSpacing = 12;
        const ySpacing = 1;
        const marginLeft = 10;
        const marginTop = 10;
        const width = Math.max(120, (tokens.length + 2) * xSpacing);
        const height = Math.max(80, (CHARSET.length + 1) * ySpacing + 4);

        // SVG elemek
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#0e1117;display:block;border-radius:8px;">`;

        // Tengelyek
        svg += `<line x1="${marginLeft}" y1="${height - marginTop}" x2="${width - 10}" y2="${height - marginTop}" stroke="rgba(255,255,255,0.15)" />`;
        svg += `<line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${height - marginTop}" stroke="rgba(255,255,255,0.15)" />`;

        // Összekötő vonalak
        for (let i = 0; i < tokens.length - 1; i++) {
            const ci1 = CHARSET.indexOf(tokens[i]);
            const ci2 = CHARSET.indexOf(tokens[i + 1]);
            const x1 = marginLeft + i * xSpacing;
            const y1 = height - marginTop - (ci1 !== -1 ? ci1 : 0) * ySpacing;
            const x2 = marginLeft + (i + 1) * xSpacing;
            const y2 = height - marginTop - (ci2 !== -1 ? ci2 : 0) * ySpacing;
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="gray" stroke-width="1"/>`;
        }

        // Pontok
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

});


