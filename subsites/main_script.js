// main_script.js BCK

// Not finished yet //

document.querySelectorAll('.dropdown').forEach(dropdown => {
    dropdown.addEventListener('mouseenter', () => {
        dropdown.querySelector('.dropdown-content').style.display = 'flex';
    });
    dropdown.addEventListener('mouseleave', () => {
        dropdown.querySelector('.dropdown-content').style.display = 'none';
    });
});


let csvData = [];
let prevClickedCell = null;

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

// Eredmények megjelenítése
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
            styleCell(td, cell); // unique cell styles
            td.addEventListener('click', () => adjustCellHeight(td)); // click event
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}


// cell parameter changin on mouse click
function adjustCellHeight(td) {
    if (prevClickedCell && prevClickedCell !== td) {
        prevClickedCell.style.height = "10px";
        prevClickedCell.style.width = "500px";
        prevClickedCell.style.whiteSpace = "nowrap";
    }

    if (td.style.height === "10px" || td.style.height === "") {
        td.style.height = "";
        td.style.width = "500px";
        td.style.whiteSpace = "pre-wrap";
    } else {
        td.style.height = "100px";
        td.style.width = "500px";
        td.style.whiteSpace = "nowrap";
    }
    prevClickedCell = td; // saving clicked cell
}

// Filter CSV data based on search term
function filterCSV() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filteredData = csvData.filter(row => {
        return row[0].toLowerCase().includes(searchTerm); // searches in the A column
    });
    displayResults(filteredData);
}

// start searching on ENTER
document.getElementById('search').addEventListener('input', function(event) {
    filterCSV(); // searching process
});

// cell styles based on content - example
function styleCell(td, cellValue) {
    if (cellValue.toLowerCase().includes("paprikás")) {
        td.style.backgroundColor = "#f7d702";
        td.style.color = "black";
    } else if (cellValue.toLowerCase().includes("gdpr")) {
        td.style.backgroundColor = "#700000";
        td.style.color = "white";

    } else if (cellValue.toLowerCase().includes("fontos")) {
        td.style.backgroundColor = "#f79102";
        td.style.color = "black";
    } else if (cellValue.toLowerCase().includes("script")) {
        td.style.backgroundColor = "#054101";
        td.style.color = "white";

    }
}


// loading nav links to the main content section
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.profile-info a, .side-nav-links a'); // Navigációs linkek a felső sávban
    const mainContent = document.querySelector('.main'); // target area for the content
  
    links.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault(); // prevent default link activity
  
        if (link.classList.contains('simpleLink')) {
            // if the link class="simpleLink", it shows the hre's content
            const targetUrl = link.getAttribute('href');
            mainContent.innerHTML = `
              <iframe src="${targetUrl}" name="mainFrame" style="width: 100%; height: 100%; border: none;"></iframe>
            `;
            return;
          }

        const targetUrl = link.getAttribute('href'); // getting url
  
        // loading content from csv
        fetch(targetUrl)
          .then(response => {
            if (!response.ok) throw new Error('Failed to load the page');
            return response.text();
          })
          .then(html => {
            mainContent.innerHTML = html; // showing csv content in the html
          })
          .catch(error => {
            mainContent.innerHTML = `<p>Error loading content: ${error.message}</p>`;
          });
      });
    });
  });


