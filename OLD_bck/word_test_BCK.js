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
    const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/frontnest/learningtools/main/cs_templates/';
    
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
    
    // Load vocabulary files from GitHub repository
    async function loadVocabularyFiles() {
        try {
            // Fetch the list of files from GitHub API
            const apiUrl = 'https://api.github.com/repos/frontnest/learningtools/contents/cs_templates';
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch file list from GitHub');
            }
            
            const files = await response.json();
            
            // Filter for en_hu files
            const enHuFiles = files
                .filter(file => (file.name.startsWith('en_hu') || file.name.startsWith('ge_hu')) && 
                file.name.endsWith('.csv'))
                .map(file => file.name);
            
            // Populate the dropdown
            enHuFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file;
                fileSelect.appendChild(option);
            });
            
            if (enHuFiles.length > 0) {
                fileSelect.value = enHuFiles[0]; // Select the first file by default
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
                            const englishTerm = parts.length > 1 ? parts[1].trim() : '';
                        
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
        
        // Display the image
        if (question.imageUrl) {
            wordImage.src = question.imageUrl;
            wordImage.style.display = 'block';
        } else {
            wordImage.style.display = 'none';
        }
    } else {
        sourceWord.innerHTML = `<strong>🤔</strong><br>${question.english}`;
        
        // Display the image
        if (question.imageUrl) {
            wordImage.src = question.imageUrl;
            wordImage.style.display = 'block';
        } else {
            wordImage.style.display = 'none';
        }
    }
    }
    
    // Check the user's answer
function checkAnswer() {
    const userAnswer = answer.value.trim().toLowerCase();
    const question = currentQuestions[currentQuestionIndex];
    const dir = direction.value;

    let correctAnswer = '';

    if (dir === 'hu_to_en') {
        correctAnswer = question.english.toLowerCase();
    } else if (dir === 'en_to_hu') {
        correctAnswer = question.hungarian.toLowerCase();
    } 
    //else if (dir === 'ge_to_hu') {
    //  correctAnswer = question.hungarian.toLowerCase(); 
    //} else if (dir === 'hu_to_ge') {
    //    correctAnswer = question.english.toLowerCase(); 
    // }

    const normalizedUserAnswer = userAnswer.replace(/\s+/g, ' ').trim();
    const normalizedCorrectAnswer = correctAnswer.replace(/\s+/g, ' ').trim();

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
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
        feedback.innerHTML = `The correct answer is: <br><b style="color:yellow; font-size:2.5vw;">${correctAnswer}</b>`;
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
        timer.textContent = `Time: ${elapsedTime}s`;
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
