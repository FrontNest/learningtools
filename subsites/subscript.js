document.getElementById('searchField').addEventListener('input', function () {
    filterTable();
});

function filterTable() {
    const searchValue = document.getElementById('searchField').value.toLowerCase();
    const table = document.getElementById('subTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let rowVisible = false; // Flag to track if any cell in the row matches

        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            const cellText = cell.textContent.toLowerCase();

            // Reset cell content and add span for highlight
            cell.innerHTML = cell.textContent; //remove existing spans

            if (cellText.includes(searchValue) && searchValue !== "") {
                rowVisible = true; // Mark the row as visible if any cell matches
                const parts = cell.textContent.split(new RegExp(`(${searchValue})`, 'gi'));
                cell.innerHTML = ''; // Clear the cell's content
                for (const part of parts) {
                    const span = document.createElement('span');
                    span.textContent = part;
                    if (part.toLowerCase() === searchValue) {
                        span.style.backgroundColor = "yellow";
                        span.style.color = 'black'; // Highlight the matching text
                    }
                    cell.appendChild(span);
                }
            }
        }

        // Show/hide row based on if any of its cells matched
        row.style.display = rowVisible || searchValue === "" ? '' : 'none';
    }
}