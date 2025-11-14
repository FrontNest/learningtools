const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/Felisha76/portfolio/main/cs_templates/';
const CATEGORIES = { 'en_hu_': 'English - Hungarian' };

let currentState = 1;
let maxState = 0;

// DOM references
const book = document.getElementById('book');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

prevBtn.addEventListener('click', goPrevious);
nextBtn.addEventListener('click', goNext);

function getCategoryForFile(fileName) {
    for (const prefix in CATEGORIES) {
        if (fileName.startsWith(prefix)) return CATEGORIES[prefix];
    }
    return 'Other';
}

async function fetchCSVFileList() {
    try {
        const apiUrl = 'https://api.github.com/repos/Felisha76/portfolio/contents/cs_templates';
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data
            .filter(file => file.name.endsWith('.csv') && !file.name.startsWith('notes_'))
            .map(file => ({
                name: file.name,
                displayName: file.name
                    .replace(/^en_hu_/, '')
                    .replace(/\.csv$/, '')
                    .replace(/_/g, ' ')
            }));
    } catch (e) {
        console.error('Error loading file list:', e);
        return [];
    }
}

async function populateFileDropdown() {
    const files = await fetchCSVFileList();
    const container = document.getElementById('csv-dropdown-container');
    container.innerHTML = '';

    const select = document.createElement('select');
    select.id = 'csv-select';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a CSV file';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file.name;
        option.textContent = file.displayName;
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        loadCSVFromGitHub(select.value);
    });

    container.appendChild(select);
}

async function loadCSVFromGitHub(fileName) {
    try {
        const response = await fetch(GITHUB_RAW_BASE_URL + fileName);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim()).map(r => r.split(',').map(c => c.trim()));
        renderBookPages(rows);
    } catch (e) {
        alert('Failed to load CSV.');
    }
}

function renderBookPages(rows) {
    book.innerHTML = ''; // Clear old pages
    currentState = 1;
    maxState = rows.length + 1;

    rows.forEach((cols, i) => {
        if (cols.length < 2) return;

        const paper = document.createElement('div');
        paper.className = 'paper';
        paper.id = `p${i + 1}`;

        const front = document.createElement('div');
        front.className = 'front';
        front.innerHTML = `<span>${cols[0]}</span>`;

        const back = document.createElement('div');
        back.className = 'back';
        back.innerHTML = `<span>${cols[1]}</span>`;

        paper.appendChild(front);
        paper.appendChild(back);
        book.appendChild(paper);
    });
}

function goNext() {
    if (currentState < maxState) {
        const paper = document.getElementById(`p${currentState}`);
        if (paper) {
            paper.classList.add('flipped');
            paper.style.zIndex = currentState;
        }
        if (currentState === 1) openBook();
        if (currentState === maxState - 1) closeBook(false);
        currentState++;
    }
}

function goPrevious() {
    if (currentState > 1) {
        currentState--;
        const paper = document.getElementById(`p${currentState}`);
        if (paper) {
            paper.classList.remove('flipped');
            paper.style.zIndex = maxState - currentState;
        }
        if (currentState === 1) closeBook(true);
        if (currentState === maxState - 1) openBook();
    }
}

function openBook() {
    book.style.transform = "translateX(50%)";
    prevBtn.style.transform = "translateX(-180px)";
    nextBtn.style.transform = "translateX(180px)";
}

function closeBook(isFirstPage) {
    book.style.transform = isFirstPage ? "translateX(0%)" : "translateX(100%)";
    prevBtn.style.transform = "translateX(0px)";
    nextBtn.style.transform = "translateX(0px)";
}

document.addEventListener('DOMContentLoaded', populateFileDropdown);
