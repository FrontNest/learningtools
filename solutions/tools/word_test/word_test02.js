// Fix the correct answer display issue and ensure the complete sound plays correctly
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const fileSelect = document.getElementById('fileSelect');
    const questionCount = document.getElementById('questionCount');
    const direction = document.getElementById('direction');
    const timerEnabled = document.getElementById('timerEnabled');
    const startBtn = document.getElementById('startBtn');
    const testContainer = document.getElementById('testContainer');
    const questionContainer = document.getElementById('questionContainer');
    const sourceWord = document.getElementById('sourceWord');
    const wordImage = document.getElementById('wordImage');
    const answer = document.getElementById('answer');
    const nextBtn = document.getElementById('nextBtn');
    const feedback = document.getElementById('feedback');
    const timer = document.getElementById('timer');
    const progress = document.getElementById('progress');
    const results = document.getElementById('results');
    const finalScore = document.getElementById('finalScore');
    const timeSpent = document.getElementById('timeSpent');
    const restartBtn = document.getElementById('restartBtn');
    
    // Audio elements
    const correctSound = document.getElementById('correctSound');
    const incorrectSound = document.getElementById('incorrectSound');
    const startSound = document.getElementById('startSound');
    const completeSound = document.getElementById('completeSound');
    
    // Constants
    const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/Felisha76/portfolio/main/cs_templates/';
    
    // Variables
    let vocabularyData = [];
    let currentQuestions = [];
    let incorrectQuestions = [];
    let currentQuestionIndex = 0;
    
    let correctAnswers = 0;
    let startTime;
    let timerInterval;
    let elapsedTime = 0;
    let startTimeStamp;
    let endTimeStamp;
    let testDuration;
    let questionTimeLeft = 15; // Új változó: hány másodperc van hátra az aktuális kérdésre
    let questionTimerInterval; // Új változó: az aktuális kérdés időzítője
    
    // Load available vocabulary files
    loadVocabularyFiles();
    
    // Event listeners
    startBtn.addEventListener('click', startTest);
    nextBtn.addEventListener('click', checkAnswer);
    restartBtn.addEventListener('click', resetTest);
    answer.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    // Categories configuration - map file prefixes to category names
const CATEGORIES = {
    'en_hu_': 'English - Hungarian',
    'ge_hu_': 'German - Hungarian',
    'math_': 'Math',
    'game_': 'Games',
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
    return 'Other';
}

// Load vocabulary files from GitHub repository, categorized
async function loadVocabularyFiles() {
    try {
        const apiUrl = 'https://api.github.com/repos/Felisha76/portfolio/contents/cs_templates';
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch file list from GitHub');
        }

        const files = await response.json();

        // Filter only CSV files and organize by category
        const categorizedFiles = {};

        files
            .filter(file => file.name.endsWith('.csv') &&
                !file.name.startsWith('notes_') &&
                !file.name.startsWith('di_') &&
                !file.name.startsWith('tale_')
            )
            .forEach(file => {
                const category = getCategoryForFile(file.name);
                if (!categorizedFiles[category]) {
                    categorizedFiles[category] = [];
                }
                categorizedFiles[category].push({
                    name: file.name,
                    displayName: file.name
                        .replace(/^(en_hu_|ge_hu_|math_|game_|full_en_hu_|full_ge_hu_|oep1_en_hu_|oep2_en_hu_|dp1_ge_hu_|dp2_ge_hu_)/, '')
                        .replace(/\.csv$/, '')
                        .replace(/_/g, ' ')
                });
            });

        // Clear previous options
        fileSelect.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a file from my repository';
        defaultOption.selected = true;
        defaultOption.disabled = true;
        fileSelect.appendChild(defaultOption);

        // Add options for each category and its files
        Object.keys(categorizedFiles).sort().forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            categorizedFiles[category].sort((a, b) => a.displayName.localeCompare(b.displayName)).forEach(file => {
                const option = document.createElement('option');
                option.value = file.name;
                option.textContent = file.displayName;
                optgroup.appendChild(option);
            });
            fileSelect.appendChild(optgroup);
        });

        // Select the first file by default if available
        const firstOptGroup = fileSelect.querySelector('optgroup');
        if (firstOptGroup && firstOptGroup.firstChild) {
            fileSelect.value = firstOptGroup.firstChild.value;
        }
    } catch (error) {
        console.error('Error loading vocabulary files:', error);
        alert('Failed to load vocabulary files. Please try again later.');
    }
}
    
    // Start the test
    function startTest() {
        const selectedFile = fileSelect.value;
        if (!selectedFile) {
            alert('Please select a vocabulary file');
            return;
        }
        
        // Capture precise start time
        startTimeStamp = performance.now();
        
        // Load the CSV file
        loadCSV(selectedFile, function(data) {
            vocabularyData = data;
            
            // Prepare questions
            prepareQuestions();
            
            // Hide settings, show test
            document.querySelector('.settings').classList.add('hidden');
            testContainer.classList.remove('hidden');
            document.querySelector('.pagetitle').style.display = 'none';
            
            // Reset counters
            currentQuestionIndex = 0;
            correctAnswers = 0;
            incorrectQuestions = [];
            elapsedTime = 0;
            
            // Start timer if enabled
            if (timerEnabled.checked) {
                startTime = new Date();
                timerInterval = setInterval(updateTimer, 1000);
                timer.classList.remove('hidden');
            } else {
                timer.classList.add('hidden');
            }
            
            // Show first question
            showQuestion();
            
            // Play start sound
            startSound.play();
        });
    }
    
    // Load CSV file from GitHub
    async function loadCSV(filename, callback) {
        try {
            const fileUrl = GITHUB_RAW_BASE_URL + filename;
            const response = await fetch(fileUrl);
        
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filename}`);
            }
        
            const csvText = await response.text();
        
            // Parse CSV using PapaParse
            Papa.parse(csvText, {
                complete: function(results) {
                    console.log('CSV parsing results:', results);
                
                    // Process the data
                    const parsedData = results.data
                        .filter(row => row.length >= 2 && row[0] && row[1]) // Filter out empty rows
                        .map(row => {
                            // const hungarian = row[0].trim(); 2025.09.19

                            // Az A oszlopban lehet <img ...> tag és magyar szó is
                            let hungarianRaw = row[0].trim();
                            // Ha van <img ...>, azt szűrjük ki
                            // let hungarian = hungarianRaw.replace(/<img[^>]*>/gi, '').trim(); 2025.09.19
                            let hungarian = hungarianRaw
                            .replace(/<[^>]+>/g, '') // minden HTML tag eltávolítása
                            .replace(/\s+/g, ' ')    // többszörös szóköz egy szóközre
                            .trim();
                            
                            const englishColumn = row[1];
                        

                            // Split the B column at <br> tag
                            const parts = englishColumn.split('<br>');
                        
                            // The part before <br> contains the image
                            const imgPart = parts[0] || '';
                            // The part after <br> is the English term
                            // original changed on 2025.10.06 const englishTerm = parts.length > 1 ? parts[1].trim() : '';
                            // new line on 2025.10.06:
                            const englishTerm = parts.length > 1 ? parts[1].trim() : englishColumn.trim();
                            // Extract image URL from the img tag
                            let imageUrl = '';
                            const imgMatch = imgPart.match(/src="([^"]+)"/i);
                            if (imgMatch && imgMatch[1]) {
                                imageUrl = imgMatch[1];
                            }
                            


                            return {
                                hungarian: hungarian,
                                english: englishTerm,
                                imageUrl: imageUrl
                            };
                        });
                
                    console.log('Parsed vocabulary data:', parsedData);
                    callback(parsedData);
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    alert('Failed to parse the vocabulary file.');
                }
            });
        } catch (error) {
            console.error('Error loading CSV file:', error);
            alert('Failed to load the vocabulary file. Please try again later.');
        }
    }
    
    // Prepare questions for the test
    function prepareQuestions() {
        // Shuffle the vocabulary data
        const shuffled = [...vocabularyData].sort(() => 0.5 - Math.random());
        
        // Take the requested number of questions
        const count = Math.min(parseInt(questionCount.value), shuffled.length);
        currentQuestions = shuffled.slice(0, count);
    }
    
    // Show the current question
    function showQuestion() {
        const question = currentQuestions[currentQuestionIndex];
        const isHuToEn = direction.value === 'hu_to_en' || direction.value === 'hu_to_ge';

    // Update progress
    progress.textContent = `Question ${currentQuestionIndex + 1}/${currentQuestions.length}`;

    // Clear previous feedback and answer
    feedback.textContent = '';
    feedback.className = '';
    answer.value = '';
    answer.focus();

    // Set the source word based on direction
    if (isHuToEn) {
        sourceWord.innerHTML = `<strong>🤔</strong><br>${question.hungarian}`;
        if (question.imageUrl) {
            wordImage.src = question.imageUrl;
            wordImage.style.display = 'block';
        } else {
            wordImage.style.display = 'none';
        }
    } else {
        sourceWord.innerHTML = `<strong>🤔</strong><br>${question.english}`;
        if (question.imageUrl) {
            wordImage.src = question.imageUrl;
            wordImage.style.display = 'block';
        } else {
            wordImage.style.display = 'none';
        }
    }

    // Indítsd el a kérdés időzítőjét, ha a timerEnabled be van kapcsolva
    if (timerEnabled.checked) {
        questionTimeLeft = 15;
        timer.classList.remove('hidden');
        timer.innerHTML = `Time: ${elapsedTime}s<br><span id="timeLeftDisplay">Time left: ${questionTimeLeft}s</span>`;
        if (questionTimerInterval) clearInterval(questionTimerInterval);
        questionTimerInterval = setInterval(() => {
            questionTimeLeft--;
            let timeLeftHtml = `Time left: ${questionTimeLeft}s`;
            let timeLeftSpan = document.getElementById('timeLeftDisplay');
            if (questionTimeLeft <= 5) {
                // Piros és villogó stílus
                timeLeftHtml = `<span class="blinking" style="color:red;">Time left: ${questionTimeLeft}s</span>`;
            }
            timer.innerHTML = `Time: ${elapsedTime}s<br>${timeLeftHtml}`;
            if (questionTimeLeft <= 0) {
                clearInterval(questionTimerInterval);
                timer.innerHTML = `Time: ${elapsedTime}s<br><span style="color:red;">Time left: 0s</span><br><span style="color:red;">Time is up!</span>`;
                checkAnswer(true); // true: idő lejárt
            }
        }, 1000);
    } else {
        timer.classList.add('hidden');
        if (questionTimerInterval) clearInterval(questionTimerInterval);
    }
}
    
    // Check the user's answer
// Módosított checkAnswer függvény: fogad egy optional paramétert, ami jelzi, hogy idő lejárt miatt hívódott-e
function checkAnswer(timeUp = false) {
    if (timerEnabled.checked && questionTimerInterval) {
        clearInterval(questionTimerInterval);
    }

    const userAnswer = answer.value.trim().toLowerCase();
    const question = currentQuestions[currentQuestionIndex];
    const dir = direction.value;

    let correctAnswer = '';

    if (dir === 'hu_to_en') {
        correctAnswer = question.english.toLowerCase();
    } else if (dir === 'en_to_hu') {
        correctAnswer = question.hungarian.toLowerCase();
    }

    const normalizedUserAnswer = userAnswer.replace(/\s+/g, ' ').trim();
    const normalizedCorrectAnswer = correctAnswer.replace(/\s+/g, ' ').trim();

    if (!timeUp && normalizedUserAnswer === normalizedCorrectAnswer) {
        correctSound.play();
        feedback.textContent = 'Correct! 👍';
        feedback.className = 'correct';
        document.querySelector('.question-container').classList.add('bounce');
        correctAnswers++;

        setTimeout(() => {
            document.querySelector('.question-container').classList.remove('bounce');
            nextQuestion();
        }, 1000);
    } else {
        incorrectSound.play();
        if (timeUp) {
            feedback.innerHTML = `Time is up!<br>The correct answer is: <br><b style="color:yellow; font-size:2.5vw;">${correctAnswer}</b>`;
        } else {
            feedback.innerHTML = `The correct answer is: <br><b style="color:yellow; font-size:2.5vw;">${correctAnswer}</b>`;
        }
        feedback.className = 'incorrect';
        document.querySelector('.question-container').classList.add('shake');
        incorrectQuestions.push(question);

        setTimeout(() => {
            document.querySelector('.question-container').classList.remove('shake');
            nextQuestion();
        }, 3000);
    }
}



    // Move to the next question
    function nextQuestion() {
        currentQuestionIndex++;
        
        // Check if we've gone through all the questions
        if (currentQuestionIndex >= currentQuestions.length) {
            // If there are incorrect questions, add them for review
            if (incorrectQuestions.length > 0) {
                currentQuestions = currentQuestions.concat(incorrectQuestions);
                incorrectQuestions = [];
            }
            
            // Check if we're done with all questions including reviews
            if (currentQuestionIndex >= currentQuestions.length) {
                endTest();
                return;
            }
        }
        
        // Show the next question
        showQuestion();
    }
    
    // Update the timer
    function updateTimer() {
        elapsedTime++;
        if (timerEnabled.checked) {
            let timeLeftHtml = `Time left: ${questionTimeLeft}s`;
            if (questionTimeLeft <= 5) {
                timeLeftHtml = `<span class="blinking" style="color:red;">Time left: ${questionTimeLeft}s</span>`;
            }
            timer.innerHTML = `Time: ${elapsedTime}s<br>${timeLeftHtml}`;
        } else {
            timer.textContent = `Time: ${elapsedTime}s`;
        }
    }
    
    // End the test
    function endTest() {
        // Capture end time
        endTimeStamp = performance.now();
        
        // Calculate duration in milliseconds
        testDuration = endTimeStamp - startTimeStamp;
        
        // Convert to seconds and milliseconds
        const seconds = Math.floor(testDuration / 1000);
        const milliseconds = Math.floor(testDuration % 1000);
        
        // Stop the timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Play completion sound if it exists
        if (completeSound) {
            completeSound.play();
        } else {
            console.error("Complete sound element is missing.");
        }

        // Calculate final score
        const initialQuestions = parseInt(questionCount.value);
        const totalAttempts = currentQuestionIndex; // Total number of questions attempted including repeats
        const incorrectCount = totalAttempts - correctAnswers; // Number of incorrect answers
        const score = Math.round((correctAnswers / totalAttempts) * 100);
        
        // Update results text
        finalScore.textContent = `You got ${correctAnswers} out of ${totalAttempts} correct (${score}%)`;
        
        // Update time spent with precise timing
        timeSpent.textContent = `You completed the test in ${seconds} seconds ${milliseconds} milliseconds`;
        
        // Add information about incorrect answers
        const incorrectInfo = document.createElement('p');
        incorrectInfo.textContent = `Original questions: ${initialQuestions}, Incorrect answers: ${incorrectCount}`;
        finalScore.parentNode.insertBefore(incorrectInfo, timeSpent);
        
        // Add motivational message based on score
        const motivationMessage = document.createElement('p');
        motivationMessage.className = 'motivation-message';
        
        if (score < 60) {
            motivationMessage.innerHTML = "Let's try it again! Practice makes the master!🔥";
        } else if (score >= 60 && score < 70) {
            motivationMessage.innerHTML = "Practice a little more, don't give up! 🔥🔥";
        } else if (score >= 70 && score < 80) {
            motivationMessage.innerHTML = "Not bad, but a little more practice makes you even better. You can do it! 🔥🔥🔥";
        } else if (score >= 80 && score < 90) {
            motivationMessage.innerHTML = "Good job! You are near to the goal! 🔥🔥🔥🔥";
        } else if (score >= 90 && score < 100) {
            motivationMessage.innerHTML = "Very good job! You are near to perfection! Go on! 🔥🔥🔥🔥🔥";
        } else {
            motivationMessage.innerHTML = "💯 🚀 Rocket! You are a superstar! 🔥🔥🔥🔥🔥 👑 🏆";
        }
        
        // Add the motivation message after the score information
        finalScore.parentNode.insertBefore(motivationMessage, timeSpent);
        
        // Show results explicitly
        results.style.display = 'block'; // Show results
        results.classList.remove('hidden');
        questionContainer.style.display = 'none'; // Hide test container
        document.querySelector('.pagetitle').style.display = 'block'; // Show page title again
        console.log("Test Ended: Results should now be visible.");
    }

    // Reset the test to start over
    function resetTest() {
    // Reload the page
        window.location.reload();
    }
});
