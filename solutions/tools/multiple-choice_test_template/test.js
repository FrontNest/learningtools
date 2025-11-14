// test.js - Interaktív tesztlogika
// Feltételezzük, hogy a CSV fájl elérhető: "../../tesztkerdesek.csv"

const CSV_PATH = "01.csv"; // Nevezd át a file-t és a path-on levő filenevet is.

let questions = [];
let selectedChapters = [];
let testQuestions = [];
let startTime = null;
let timerInterval = null;

function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    return lines.map(line => {
        // Egyszerű CSV split, idézőjelet nem kezel
        let [chapter, question, a, b, c, d, correct, explanation] = line.split(';');
        correct = (correct || '').trim().toUpperCase();
        return { chapter, question, a, b, c, d, correct, explanation };
    });
}

function loadCSV() {
    fetch(CSV_PATH)
        .then(res => res.text())
        .then(text => {
            questions = parseCSV(text);
            fillChapterDropdown();
        })
        .catch(() => alert('Nem sikerült betölteni a tesztkérdéseket!'));
}
// Custom dropdown
function fillChapterDropdown() {
    const customDropdown = document.getElementById('customDropdown');
    const selectedDiv = customDropdown.querySelector('.selected');
    const optionsDiv = customDropdown.querySelector('.options');
    const chapters = [...new Set(questions.map(q => q.chapter))];
    optionsDiv.innerHTML = '';
    chapters.forEach(ch => {
        const opt = document.createElement('div');
        opt.className = 'option';
        opt.textContent = ch;
        opt.dataset.value = ch;
        opt.addEventListener('click', function(e) {
            // Minden kattintás/érintés toggle-olja a kijelölést (mobilbarát)
            opt.classList.toggle('selected');
            // Frissítjük a selectedDiv szövegét
            const selected = Array.from(optionsDiv.querySelectorAll('.option.selected')).map(o => o.textContent);
            selectedDiv.textContent = selected.length ? selected.join(', ') : 'Válassz fejezetet';
            //optionsDiv.style.display = 'none'; // minden választás után visszacsukódik a lista
        });
        optionsDiv.appendChild(opt);
    });
    // Kattintásra lenyit
    selectedDiv.onclick = function() {
        optionsDiv.style.display = optionsDiv.style.display === 'none' ? 'block' : 'none';
    };
    // Kattintás kívülre bezárja
    document.addEventListener('click', function(e) {
        if (!customDropdown.contains(e.target)) {
            optionsDiv.style.display = 'none';
        }
    });
}

function getSelectedChapters() {
    const customDropdown = document.getElementById('customDropdown');
    const optionsDiv = customDropdown.querySelector('.options');
    return Array.from(optionsDiv.querySelectorAll('.option.selected')).map(opt => opt.dataset.value);
}

function pickRandomQuestions(chapters, count) {
    const filtered = questions.filter(q => chapters.includes(q.chapter));
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function renderQuestions() {
    const ol = document.getElementById('questionList');
    ol.innerHTML = '';
    testQuestions.forEach((q, idx) => {
        const li = document.createElement('li');
        li.className = 'question-item';
        li.innerHTML =
            '<div class="qtext">' + q.question + '</div>' +
            '<div class="answers">' +
                '<label><input type="radio" name="q' + idx + '" value="A" /> ' + q.a + '</label><br />' +
                '<label><input type="radio" name="q' + idx + '" value="B" /> ' + q.b + '</label><br />' +
                '<label><input type="radio" name="q' + idx + '" value="C" /> ' + q.c + '</label><br />' +
                '<label><input type="radio" name="q' + idx + '" value="D" /> ' + q.d + '</label>' +
            '</div>' +
            '<div class="explanation" style="display:none;"></div>';
        ol.appendChild(li);
    });
}

function startTest() {
    selectedChapters = getSelectedChapters();
    if (selectedChapters.length === 0) {
        alert('Válassz legalább egy fejezetet!');
        return;
    }
    // Számoljuk meg, hány kérdés van összesen a kiválasztott fejezetekben
    const availableQuestions = questions.filter(q => selectedChapters.includes(q.chapter));
    const count = Math.min(20, availableQuestions.length);
    if (count === 0) {
        alert('Nincs kérdés a kiválasztott fejezet(ek)ben!');
        return;
    }
    testQuestions = pickRandomQuestions(selectedChapters, count);
    renderQuestions();
    document.getElementById('testForm').style.display = '';
    document.getElementById('checkBtn').style.display = '';
    document.getElementById('resultSummary').innerHTML = '';
    // Elrejtjük a leírást
    var desc = document.getElementById('description');
    if (desc) desc.style.display = 'none';
    startTime = Date.now();
    startTimer();
}

function startTimer() {
    const timer = document.getElementById('timer');
    timer.textContent = '00:00';
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const sec = String(elapsed % 60).padStart(2, '0');
        timer.textContent = `${min}:${sec}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function checkAnswers() {
    stopTimer();
    let correctCount = 0;
    let timeBonus = 0;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const ol = document.getElementById('questionList');
    const perQuestionTimes = [];
    // Minden kérdéshez: helyes válasz + időbónusz
    // Feltételezzük, hogy a teszt kitöltése folyamatos, így az egyes kérdések idejét becsüljük: teljes idő / kérdésszám
    const avgTimePerQuestion = testQuestions.length ? elapsed / testQuestions.length : 0;
    testQuestions.forEach((q, idx) => {
        const li = ol.children[idx];
        const radios = li.querySelectorAll('input[type=radio]');
        let selected = null;
        radios.forEach(r => { if (r.checked) selected = r.value; });
        const answerDiv = li.querySelector('.answers');
        const explanationDiv = li.querySelector('.explanation');
        // Letiltjuk a további választást
        radios.forEach(r => { r.disabled = true; });
        // A felhasználó által kiválasztott válasz szövege
        const chosenText = (q[selected ? selected.toLowerCase() : ''] || '').trim().toLowerCase();
        const correctText = (q.correct || '').trim().toLowerCase();
        if (chosenText === correctText && chosenText !== '') {
                answerDiv.classList.add('correct');
                li.classList.add('correct');
            correctCount++;
            // Időbónusz számítása (max 30mp/kérdés, minden megtakarított mp 1 pont)
            const timeForThis = avgTimePerQuestion;
            const bonus = Math.max(0, 30 - timeForThis);
            timeBonus += Math.round(bonus);
        } else {
                answerDiv.classList.add('incorrect');
                li.classList.add('incorrect');
            explanationDiv.style.display = '';
            // Helyes válasz szövegének megjelenítése
            explanationDiv.innerHTML = `Helyes válasz: <b>${q.correct}</b><br />${q.explanation || ''}`;
        }
    });
    document.getElementById('checkBtn').style.display = 'none';
    // Pontszámítás: minden helyes válasz 10 pont + időbónusz
    const score = (correctCount * 10 + timeBonus);
    document.getElementById('resultSummary').innerHTML =
        `<div class="score-summary">Helyes válaszok: ${correctCount}/${testQuestions.length}<br />Idő: ${elapsed} mp<br />Időbónusz: ${timeBonus} pont<br />Összpontszám: ${score}</div>`;
}

document.getElementById('startTestBtn').addEventListener('click', startTest);
document.getElementById('checkBtn').addEventListener('click', checkAnswers);

window.addEventListener('DOMContentLoaded', loadCSV);
// Oldal betöltésekor a description látható legyen
window.addEventListener('DOMContentLoaded', function() {
    loadCSV();
    var desc = document.getElementById('description');
    if (desc) desc.style.display = 'block';
});
