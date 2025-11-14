document.addEventListener("DOMContentLoaded", function () {
    const clockCanvas = document.getElementById("clockCanvas");
    const ctx = clockCanvas.getContext("2d");
    const digitalHours = document.getElementById("digital-hours");
    const digitalMinutes = document.getElementById("digital-minutes");
    const testContainer = document.getElementById("test-container");
    const startTestBtn = document.getElementById("start-test");
    let hours = 0;
    let minutes = 0;
    let draggingHand = null;
    let timeFormat = "24";
    let testActive = false;

    document.getElementById("timeFormat").addEventListener("change", function (e) {
        timeFormat = e.target.value;
        updateDigitalClock();
    });

    function drawClock() {
        ctx.clearRect(0, 0, clockCanvas.width, clockCanvas.height);
        ctx.strokeStyle = "#d2d4d6";
        ctx.beginPath();
        ctx.arc(100, 100, 90, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#d2d4d6";

        for (let i = 1; i <= 12; i++) {
            let angle = (i * 30 - 90) * (Math.PI / 180);
            let x = 100 + Math.cos(angle) * 75;
            let y = 100 + Math.sin(angle) * 75;
            ctx.fillText(i, x - 5, y + 5);
        }

        let hourAngle = ((hours % 12) * 30 + minutes / 2) * (Math.PI / 180) - Math.PI / 2;
        let minuteAngle = (minutes * 6) * (Math.PI / 180) - Math.PI / 2;

        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.lineTo(100 + 40 * Math.cos(hourAngle), 100 + 40 * Math.sin(hourAngle));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.lineTo(100 + 60 * Math.cos(minuteAngle), 100 + 60 * Math.sin(minuteAngle));
        ctx.stroke();
    }

    clockCanvas.addEventListener("mousedown", function (event) {
        let rect = clockCanvas.getBoundingClientRect();
        let x = event.clientX - rect.left - 100;
        let y = event.clientY - rect.top - 100;
        let angle = Math.atan2(y, x) + Math.PI / 2;
        let min = Math.round((angle / (Math.PI * 2)) * 60) % 60;
        let hr = Math.round((angle / (Math.PI * 2)) * 12) % 12;
        
        let minuteDiff = Math.abs(min - minutes);
        if (minuteDiff < 5 || minuteDiff > 55) {
            draggingHand = "minute";
        } else {
            draggingHand = "hour";
        }
    });

    clockCanvas.addEventListener("mousemove", function (event) {
        if (!draggingHand) return;
        
        let rect = clockCanvas.getBoundingClientRect();
        let x = event.clientX - rect.left - 100;
        let y = event.clientY - rect.top - 100;
        let angle = Math.atan2(y, x) + Math.PI / 2;

        if (draggingHand === "minute") {
            let newMinutes = Math.round((angle / (Math.PI * 2)) * 60) % 60;
            if (newMinutes < 0) newMinutes += 60;
            if (newMinutes < minutes && minutes - newMinutes > 30) hours = (hours + 1) % 24;
            if (newMinutes > minutes && newMinutes - minutes > 30) hours = (hours - 1 + 24) % 24;
            minutes = newMinutes;
        } else {
            let newHours = Math.round((angle / (Math.PI * 2)) * 12) % 12;
            if (newHours < 0) newHours += 12;
            hours = newHours;
        }
        updateDigitalClock();
        drawClock();
    });

    clockCanvas.addEventListener("mouseup", function () {
        draggingHand = null;
    });

    function updateDigitalClock() {
        digitalHours.value = timeFormat === "24" ? hours : hours % 12 || 12;
        digitalMinutes.value = minutes.toString().padStart(2, '0');
    }

    digitalHours.addEventListener("input", function () {
        hours = parseInt(digitalHours.value) || 0;
        drawClock();
    });
    
    digitalMinutes.addEventListener("input", function () {
        minutes = parseInt(digitalMinutes.value) || 0;
        drawClock();
    });
    
    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Tesztkérdések generálása
function generateTestQuestions() {
    const testContainer = document.getElementById("test-container");
    testContainer.style.display = "flex"; // Make sure it's visible
    testContainer.innerHTML = "";
    testActive = true;

    // 1. típus: Analóg <-> Digitális átváltás
    // Create a flex container for both elements
    const clockQuestionContainer = document.createElement("div");
    //clockQuestionContainer.classList.add("clock_question_row"); // Add a class for styling
    
    // Generate the first question
    const randomHour1 = Math.floor(Math.random() * 12);
    const randomMinute1 = Math.floor(Math.random() * 60);

    const analogToDigitalQuestion = document.createElement("div");
    analogToDigitalQuestion.classList.add("analog_clock_question"); // Add a class for individual styling
    analogToDigitalQuestion.style.display = "flex";
    //analogToDigitalQuestion.style.flexDirection = "column"; // Stack elements vertically
    analogToDigitalQuestion.innerHTML = `<p>Hány óra van az analóg órán? (DE és DU is elfogadható)</p><br>
                                        <input type='time' id='analog-answer' required>
                                        <canvas id='testClockCanvas' width='200' height='200'></canvas>`;
    // Store the expected time as data attributes
    analogToDigitalQuestion.dataset.expectedHour = randomHour1;
    analogToDigitalQuestion.dataset.expectedMinute = randomMinute1;
    testContainer.appendChild(analogToDigitalQuestion);    
    drawTestClock(randomHour1, randomMinute1, 'testClockCanvas');
 
    // Generate a different random time for the second question
    const randomHour2 = Math.floor(Math.random() * 12);
    const randomMinute2 = Math.floor(Math.random() * 60);

    const digitalToAnalogQuestion = document.createElement("div");
    digitalToAnalogQuestion.classList.add("digital_clock_question"); // Add a class for individual styling
    digitalToAnalogQuestion.style.display = "flex";
    //digitalToAnalogQuestion.style.flexDirection = "column"; // Stack elements vertically
    digitalToAnalogQuestion.innerHTML = `<p>Állítsd be az analóg órát erre az időre az óramutatók mozgatásával: <b> ${randomHour2}:${randomMinute2.toString().padStart(2, '0')}</b></p>
                                        <canvas id='setClockCanvas' width='200' height='200'></canvas>`;
    testContainer.appendChild(digitalToAnalogQuestion);
    setupAnalogClockInteraction("setClockCanvas");

    // Append the flex container to the test container
    testContainer.appendChild(clockQuestionContainer);

    // 2. típus: Idővel kapcsolatos kérdések
    const months = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
    const seasons = { "Tavasz": ["Március", "Április", "Május"], "Nyár": ["Június", "Július", "Augusztus"], "Ősz": ["Szeptember", "Október", "November"], "Tél": ["December", "Január", "Február"] };
    const randomMonth = getRandomItem(months);
    const randomSeason = getRandomItem(Object.keys(seasons));

    const generalQuestions = [
        `Hány napból áll egy év?`,
        `Hány napos a ${randomMonth} hónap?`,
        `Hanyadik hónap a ${randomMonth}?`,
        `Melyik évszakba tartozik a ${randomMonth}?`,
        //`A(z) ${randomSeason} melyik hónapokból áll? -  doesn't work yet`,
        `Hány hétből áll egy év?`,
        `Hány hónapból áll egy év?`,
        `Hány órából áll egy nap?`,
        //`Mik a hét napjai? -  doesn't work yet`
    ];
    generalQuestions.forEach(question => {
        let div = document.createElement("div");
        div.classList.add("question_row"); // Add a class for styling fo each generated question
        div.innerHTML = `<p>${question}</p><input type='text' required>`;
        testContainer.appendChild(div);
    });

    
    // Add a check answers button at the end
    const checkButton = document.createElement("button");
    checkButton.textContent = "Check Answers";
    checkButton.style.marginTop = "20px";
    checkButton.style.padding = "10px";
    checkButton.addEventListener("click", checkAnswers);
    
    // Remove any existing check button
    const existingButton = document.getElementById("check-button");
    if (existingButton) {
        existingButton.remove();
    }
    
    checkButton.id = "check-button";
    testContainer.appendChild(checkButton);    
}

// Óra rajzolása a teszthez
function drawTestClock(hour, minute, canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#d2d4d6";
    ctx.beginPath();
    ctx.arc(100, 100, 90, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#d2d4d6";

    for (let i = 1; i <= 12; i++) {
        let angle = (i * 30 - 90) * (Math.PI / 180);
        let x = 100 + Math.cos(angle) * 75;
        let y = 100 + Math.sin(angle) * 75;
        ctx.fillText(i, x - 5, y + 5);
    }

    let hourAngle = ((hour % 12) * 30 + minute / 2) * (Math.PI / 180) - Math.PI / 2;
    let minuteAngle = (minute * 6) * (Math.PI / 180) - Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(100 + 40 * Math.cos(hourAngle), 100 + 40 * Math.sin(hourAngle));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(100 + 60 * Math.cos(minuteAngle), 100 + 60 * Math.sin(minuteAngle));
    ctx.stroke();
}

// Interaktív óra beállítás
function setupAnalogClockInteraction(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    let userHours = 0;
    let userMinutes = 0;
    let draggingHand = null;
    
    // Draw initial clock
    drawTestClock(userHours, userMinutes, canvasId);
    
    canvas.addEventListener("mousedown", function(event) {
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left - 100;
        let y = event.clientY - rect.top - 100;
        let angle = Math.atan2(y, x) + Math.PI / 2;
        let min = Math.round((angle / (Math.PI * 2)) * 60) % 60;
        let hr = Math.round((angle / (Math.PI * 2)) * 12) % 12;
        
        // Determine if user is trying to move hour or minute hand
        let distance = Math.sqrt(x*x + y*y);
        if (distance < 50) {
            draggingHand = "hour";
        } else {
            draggingHand = "minute";
        }
    });

    canvas.addEventListener("mousemove", function(event) {
        if (!draggingHand) return;
        
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left - 100;
        let y = event.clientY - rect.top - 100;
        let angle = Math.atan2(y, x) + Math.PI / 2;
        
        if (draggingHand === "minute") {
            userMinutes = Math.round((angle / (Math.PI * 2)) * 60) % 60;
            if (userMinutes < 0) userMinutes += 60;
        } else {
            userHours = Math.round((angle / (Math.PI * 2)) * 12) % 12;
            if (userHours < 0) userHours += 12;
        }
        
        // Redraw the clock with new values
        drawTestClock(userHours, userMinutes, canvasId);
    });
    canvas.addEventListener("mouseup", function() {
        draggingHand = null;
    });
    
    // Store the user's answer in a data attribute for later checking
    canvas.dataset.userHours = userHours;
    canvas.dataset.userMinutes = userMinutes;
    
    // Update data attributes when values change
    const updateDataset = function() {
        canvas.dataset.userHours = userHours;
        canvas.dataset.userMinutes = userMinutes;
    };
    
    canvas.addEventListener("mouseup", updateDataset);
}

// Function to CHECK ANSWERS and display results

function formatTime(hours, minutes) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function checkAnswers() {
    console.log("Checking answers...");
    
    // Get all input elements in the test container
    const testContainer = document.getElementById("test-container");
    const inputs = testContainer.querySelectorAll("input");

    // Track correct answers
    let correctCount = 0;
    let totalAnswered = 0;   
    
    // Process each input
    inputs.forEach(input => {
        // Get the parent question div
        const questionDiv = input.closest("div");
        
        // Get the question text
        const questionText = questionDiv.querySelector("p")?.textContent || "";
        
        // Check if it's a time input (analog to digital conversion)
        if (input.type === "time" && input.value) {
            totalAnswered++;
            
            // Get the expected time from the data attributes
            const questionDiv = input.closest("div");
            const expectedHour = parseInt(questionDiv.dataset.expectedHour || 0);
            const expectedMinute = parseInt(questionDiv.dataset.expectedMinute || 0);
            
            // Parse user's answer
            const [userHours, userMinutes] = input.value.split(':').map(Number);
            
            // Check if correct (allowing for 12/24 hour format)
            const isCorrect = (userHours % 12 === expectedHour % 12) && (userMinutes === expectedMinute);
            
            
            if (isCorrect) {
                input.style.backgroundColor = "#07e53b"; // Green background
                correctCount++;
            } else {
                input.style.backgroundColor = "#d60314"; // Red background
            // Add expected answer as a paragraph
            const expectedAnswer = formatTime(expectedHour, expectedMinute);
            const answerHint = document.createElement("p");
            answerHint.textContent = `Helyes válasz: ${expectedAnswer}`;
            answerHint.style.color = "#dc3545";
            answerHint.style.margin = "5px 0";
            answerHint.classList.add("expected-answer");
            
            // Remove any existing hint
            const existingHint = questionDiv.querySelector(".expected-answer");
            if (existingHint) {
                existingHint.remove();
            }
            
            questionDiv.appendChild(answerHint);
        }
    }

        // For text inputs
        else if (input.type === "text" && input.value.trim() !== "") {
            totalAnswered++;
            
            // Determine correct answer based on question text
            let isCorrect = false;
            let expectedAnswer = "";
            
            if (questionText.includes("Hány napból áll egy év")) {
                expectedAnswer = "365";
                isCorrect = input.value === "365";
            }
            else if (questionText.includes("Hány napból áll a")) {
                // Use a more inclusive regex pattern that captures accented characters
                const monthMatch = questionText.match(/Hány napos a ([^\?]+)/);
                
                if (monthMatch) {
                    // Trim any whitespace from the extracted month name
                    const month = monthMatch[1].trim();
                    
                    if (["Január", "Március", "Május", "Július", "Augusztus", "Október", "December"].includes(month)) {
                        expectedAnswer = "31";
                        isCorrect = input.value.trim() === "31";
                    } else if (["Április", "Június", "Szeptember", "November"].includes(month)) {
                        expectedAnswer = "30";
                        isCorrect = input.value.trim() === "30";
                    } else if (month === "Február") {
                        expectedAnswer = "28/29";
                        isCorrect = input.value.trim() === "28" || input.value.trim() === "29" || input.value.trim() === "28/29";
                    } /*else {
                        expectedAnswer = "30";
                        isCorrect = input.value.trim() === "30";
                    } */
                }
            }
            else if (questionText.includes("Hanyadik hónap a")) {
                const monthMatch = questionText.match(/Hanyadik hónap a ([^\?]+)/);
                
                if (monthMatch) {
                    const month = monthMatch[1].trim();
                    // Dictionary mapping month names to their numbers
                    const monthNumbers = {
                        "Január": 1,
                        "Február": 2,
                        "Március": 3,
                        "Április": 4,
                        "Május": 5,
                        "Június": 6, 
                        "Július": 7,
                        "Augusztus": 8,
                        "Szeptember": 9,
                        "Október": 10,
                        "November": 11,
                        "December": 12
                    };
                    
                    if (month in monthNumbers) {
                        expectedAnswer = monthNumbers[month].toString();
                        // Compare the user's input with the expected number, allowing for both string and number inputs
                        isCorrect = input.value.trim() === expectedAnswer || parseInt(input.value) === monthNumbers[month];
                    }
                }
            }
            
            
            else if (questionText.includes("Hány órából áll egy nap")) {
                expectedAnswer = "24";
                isCorrect = input.value === "24";
            }
            else if (questionText.includes("Hány hónapból áll egy év")) {
                expectedAnswer = "12";
                isCorrect = input.value === "12";
            }
            else if (questionText.includes("Hány hétből áll egy év")) {
                expectedAnswer = "52";
                isCorrect = input.value === "52" || input.value === "53";
            }

            else if (questionText.includes("Melyik évszakba tartozik a")) {
                const monthMatch = questionText.match(/Melyik évszakba tartozik a ([^\?]+)/);
                
                if (monthMatch) {
                    const month = monthMatch[1].trim();
                    
                    // Define seasons based on months
                    const winterMonths = ["December", "Január", "Február"];
                    const springMonths = ["Március", "Április", "Május"];
                    const summerMonths = ["Június", "Július", "Augusztus"];
                    const autumnMonths = ["Szeptember", "Október", "November"];
                    
                    // Determine expected answer based on month
                    if (winterMonths.includes(month)) {
                        expectedAnswer = "Tél";
                        isCorrect = input.value.toLowerCase().trim() === "tél";
                    } else if (springMonths.includes(month)) {
                        expectedAnswer = "Tavasz";
                        isCorrect = input.value.toLowerCase().trim() === "tavasz";
                    } else if (summerMonths.includes(month)) {
                        expectedAnswer = "Nyár";
                        isCorrect = input.value.toLowerCase().trim() === "nyár";
                    } else if (autumnMonths.includes(month)) {
                        expectedAnswer = "Ősz";
                        isCorrect = input.value.toLowerCase().trim() === "ősz";
                    }
                }
            }

 // Time duration questions were removed for now 
            // ---------------------------------------------
            // For other questions, we'll just mark them as "correct" for now
            else {
                isCorrect = true;
            }
            
            if (isCorrect) {
                input.style.backgroundColor = "#07e53b"; // Green background
                correctCount++;
            } else {
                input.style.backgroundColor = "#d60314"; // Red background
            }
        }
    });
    
    // Handle the analog clock canvas (digital to analog conversion)
    const setClockCanvas = document.getElementById("setClockCanvas");
    if (setClockCanvas) {
        totalAnswered++;
        
        // Get the expected time from the question text
        const questionDiv = setClockCanvas.closest("div");
        const questionText = questionDiv.querySelector("p")?.textContent || "";
        const timeMatch = questionText.match(/(\d+):(\d+)/);
        
        let isCorrect = false;
        
        if (timeMatch) {
            const expectedHour = parseInt(timeMatch[1]) % 12;
            const expectedMinute = parseInt(timeMatch[2]);
            
           // Get the user's set time from the canvas data attributes
           const userHours = parseInt(setClockCanvas.dataset.userHours || 0);
           const userMinutes = parseInt(setClockCanvas.dataset.userMinutes || 0);
           
           // Check if the time is correct (with some tolerance for minutes)
           const hourCorrect = userHours % 12 === expectedHour % 12;
           const minuteCorrect = Math.abs(userMinutes - expectedMinute) <= 2; // Allow 2 minutes tolerance
           
           isCorrect = hourCorrect && minuteCorrect;
           
           if (isCorrect) {
               correctCount++;
           }
       }
       
       setClockCanvas.style.border = isCorrect ? 
           "3px solid #28a745" : // Green border
           "3px solid #dc3545";  // Red border
   }
    
    // Calculate percentage
    const percentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    
    
    // Add a results message
    const resultsMessage = document.createElement("div");
    /*resultsMessage.style.marginTop = "20px";
    resultsMessage.style.padding = "10px";
    resultsMessage.style.backgroundColor = "#f8f9fa";
    resultsMessage.style.border = "1px solid #dee2e6";
    resultsMessage.style.borderRadius = "5px"; */
    resultsMessage.innerHTML = `
        <h2>Results</h2>
        <p>You got <b> ${correctCount} </b> out of <b> ${totalAnswered} </b>questions correct <b>(${percentage}%).</b></p>
        <p>Correct answers are highlighted in green, incorrect in red.</p>
    `;
    
    // Remove any existing results message
    const existingMessage = document.getElementById("results-message");
    if (existingMessage) {
        existingMessage.remove();
    }
    
    resultsMessage.id = "results-message";
    testContainer.appendChild(resultsMessage);
    
    // Scroll to the results message
    resultsMessage.scrollIntoView({ behavior: 'smooth' });
}

// Helper function to extract time from a canvas
function getRandomTimeFromCanvas(canvasId) {
    // In a real implementation, we would store the actual time when drawing the test clock
    // For now, we'll extract it from the question text
    const questionDiv = document.getElementById(canvasId).closest("div");
    const questionText = questionDiv.querySelector("p").textContent;
    const timeMatch = questionText.match(/(\d+):(\d+)/);
    
    if (timeMatch) {
        return [parseInt(timeMatch[1]), parseInt(timeMatch[2])];
    }
    return [0, 0];
}

// Teszt indítása
document.getElementById("start-test").addEventListener("click", generateTestQuestions);

    drawClock();
    updateDigitalClock();
});

        // Add event listener for Enter key to check answers
        document.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                checkAnswers();
            }
        });