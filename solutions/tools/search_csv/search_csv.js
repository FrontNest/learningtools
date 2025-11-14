// main_script.js BCK

// Not finished yet //

let csvData = [];

// CSV file loading
function loadCSV() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            Papa.parse(event.target.result, {
                complete: function(results) {
                    csvData = results.data.slice(0, 2000); // loading the first 2000 lines from csv
                    displayResults(csvData);
                },
                header: false
            });
        };
        reader.readAsText(file);
    }
}

// Display results in the table
function displayResults(data) {
    const tbody = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // reset table

    const searchTerm = document.getElementById('search').value.toLowerCase();

    data.forEach(row => {
        const tr = document.createElement('tr');
        row.slice(1, 6).forEach(cell => { // show only B-G columns (1-5)
            const td = document.createElement('td');
            let cellContent = cell;

            // Highlight search term
            if (searchTerm && cell.toLowerCase().includes(searchTerm)) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                cellContent = cell.replace(regex, '<span style="background-color: yellow; font-weight: bold; color: black;">$1</span>');
            }

            td.innerHTML = cellContent; // inserting html with highlighted term
            td.classList.add('cell'); // cell class creation
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// Filter CSV data based on search term
function filterCSV() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filteredData = csvData.filter(row => {
        return row[0].toLowerCase().includes(searchTerm); // searches in the A column
    });
    displayResults(filteredData);
}

// Start searching on input
document.getElementById('search').addEventListener('input', function(event) {
    filterCSV(); // searching process
});



