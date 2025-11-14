document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("abacus");
    const ctx = canvas.getContext("2d");
    const abacusValue = document.getElementById("abacus-value");
    const startBtn = document.getElementById("start");
    const checkBtn = document.getElementById("check-answers");
    const restartBtn = document.getElementById("restart");
    const resetAbacusBtn = document.getElementById("reset-abacus");
    const questionsDiv = document.getElementById("questions");
    const resultsDiv = document.getElementById("results");
    
    canvas.width = 450;
    canvas.height = 300;

    let beads = Array.from({ length: 8 }, () => ({ upper: false, lower: 0 }));

    function drawAbacus() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#058f1c";
        
        for (let i = 0; i < 8; i++) {
            let x = 50 + i * 50;
            ctx.fillRect(x - 2, 30, 5, 240);
            
            // Draw upper bead (worth 5)
            ctx.fillStyle = "#016011";
            ctx.fillRect(x - 15, beads[i].upper ? 60 : 30, 30, 30);

            // Draw lower beads (worth 1 each, up to 4) with sliding effect
            for (let j = 0; j < 4; j++) {
                ctx.fillStyle = j < beads[i].lower ? "#2be62b" : "#058f1c";
                ctx.fillRect(x - 15, 120 + j * 40, 30, 30);
            }
        }
    }

    function calculateValue() {
        let value = 0;
        beads.forEach((b, i) => {
            let placeValue = Math.pow(10, 7 - i);
            value += ((b.upper ? 5 : 0) + b.lower) * placeValue;
        });
        abacusValue.textContent = `Value: ${value}`;
        enableAnswers();
    }

    function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        beads.forEach((b, i) => {
            let x = 50 + i * 50;
            if (Math.abs(clickX - x) < 20) {
                if (clickY < 100) {
                    b.upper = !b.upper;
                } else {
                    let clickedRow = Math.floor((clickY - 120) / 40);
                    if (clickedRow >= 0 && clickedRow < 4) {
                        b.lower = clickedRow + 1 === b.lower ? clickedRow : clickedRow + 1;
                    }
                }
            }
        });
        drawAbacus();
        calculateValue();
    }

    function resetAbacus() {
        beads = Array.from({ length: 8 }, () => ({ upper: false, lower: 0 }));
        drawAbacus();
        calculateValue();
    }

    canvas.addEventListener("click", handleClick);
    resetAbacusBtn.addEventListener("click", resetAbacus);
    drawAbacus();

    function generateQuestions() {
        questionsDiv.innerHTML = "";
        let numQuestions = document.getElementById("question-count").value;
        let numDigits = document.getElementById("digit-count").value;
        let operationsCount = document.getElementById("operations-count").value;
        let operations = [];
        if (document.getElementById("addition").checked) operations.push("+");
        if (document.getElementById("subtraction").checked) operations.push("-");
        if (document.getElementById("multiplication").checked) operations.push("*");
        if (document.getElementById("division").checked) operations.push("/");
        
        for (let i = 0; i < numQuestions; i++) {
            let question = "";
            let result = 0;
            let num1 = Math.floor(Math.random() * (Math.pow(10, numDigits) - Math.pow(10, numDigits - 1)) + Math.pow(10, numDigits - 1));
            question += num1;
            result = num1;
            
            for (let j = 0; j < operationsCount; j++) {
                let op = operations[Math.floor(Math.random() * operations.length)];
                let num = Math.floor(Math.random() * (Math.pow(10, numDigits) - Math.pow(10, numDigits - 1)) + Math.pow(10, numDigits - 1));
                question += ` ${op} ${num}`;
                result = eval(`${result} ${op} ${num}`);
            }
            
            let input = `<input type='text' class='answer' data-answer='${result}'>`; // disabled removed from the end  before >
            questionsDiv.innerHTML += `<div>${question} = ${input}</div>`;
        }
    }

    function enableAnswers() {
        let answers = document.querySelectorAll(".answer");
        answers.forEach(input => input.removeAttribute("disabled"));
    }

    checkBtn.addEventListener("click", function() {
        let correct = 0;
        let answers = document.querySelectorAll(".answer");
        answers.forEach(input => {
            if (parseFloat(input.value) === parseFloat(input.dataset.answer)) {
                input.classList.add("correct-answer");
                correct++;
            }
        });
        resultsDiv.textContent = `Score: ${correct} / ${answers.length} (${(correct / answers.length * 100).toFixed(0)}%)`;
    });

    restartBtn.addEventListener("click", function() {
        questionsDiv.innerHTML = "";
        resultsDiv.textContent = "";
        document.getElementById("digit-count").value = "1";
        document.getElementById("question-count").value = "5";
        document.getElementById("operations-count").value = "1";
        document.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
    });

    startBtn.addEventListener("click", generateQuestions);
});
