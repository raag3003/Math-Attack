// Random spawing math quetion for then decending to the bottom of the screen
//---------------------------------------------------------------------------------------------------------------------------------------
let currentQuestions = [];
let selectedDifficulty = '';
let questions = [];
let gameGroup = '';
let usedQuestionIds = new Set();
let questionOrder = [];
let currentQuestionIndex = 0;

// Get questions from JSON-file
async function fetchQuestions() {
    const response = await fetch('/questions');
    const data = await response.json();
    questions = data.questions;
}

// Starts the game right after the countdown is finsihed
async function startGame() {
    await fetchQuestions();
    // Just to debug some of my code to see if we get questionOrder from the server
    if (!questionOrder || !questionOrder.length) {
        console.error("questionOrder er ikke initialiseret korrekt");
        return;
    }
    document.querySelector('.gameArena').style.display = 'block';
    currentQuestionIndex = 0; // Reset index when a new game is started
    spawnQuestions();

    // When the user playing a new game without refreching the site, will this ensure that all the quetions is active again
    usedQuestionIds.clear();
    currentQuestions = [];
}

function addNewQuestion() {
    const currentQuestionId = questionOrder[currentQuestionIndex]; // Selects questions matching user's chosen difficulty and which hasn't been spawned
    const question = questions.find(q =>
        q.difficulty === selectedDifficulty && q.id === currentQuestionId
    );
    // 1. debug measage to see if questionOrder is empty or if currentQuestionIndex is too big
    if (!questionOrder || !questionOrder.length || currentQuestionIndex >= questionOrder.length) {
        console.log("Ikke flere spørgsmål tilgængelige");
        return;
    }
    // 2. debug measage checks to see if there is or not a ID matching with a question
    if (!question) {
        console.log("Kunne ikke finde spørgsmål med ID:", currentQuestionId);
        currentQuestionIndex++;
        return;
    }
    currentQuestionIndex++; 

    const template = document.getElementById('question-template'); // Clone the template from the cshtml
    const questionElement = template.content.cloneNode(true).children[0];
    questionElement.querySelector('.question').textContent = question.question; // Inserting questions from JSON file into the DIV tag "question"
    const answersContainer = questionElement.querySelector('.answers'); // Finding the element with the class ".answers"
    const allAnswers = [question.correctAnswer, ...question.incorrectAnswers]; // Combine correct and incorrect answers

    // If and only if the answer is numeric (with or without unit), the user can use a input field else is it multiple choice
    if (allAnswers.every(answer => !isNaN(answer))) {
        // Display unit if it exists using MathJax
        if (question.unit) {
            const unitElement = questionElement.querySelector('.unit');
            unitElement.innerHTML = `\\(${question.unit}\\)`;
            MathJax.typeset([unitElement]);
        }

        // Getting the input fieald and buttom from either ".answer-input" or ".submit-answer"
        const answerInput = questionElement.querySelector('.answer-input');
        const submitButton = questionElement.querySelector('.submit-answer');

        // Adding a event listeners for every question that spawns
        answerInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                checkAnswer(answerInput, question.correctAnswer);
            }
        });

        submitButton.addEventListener('click', () => {
            checkAnswer(answerInput, question.correctAnswer);
        });
    } else {
        // For multiple choice questions, create answer buttons (Multiple choice quetions is only for long answers where there can be spelling errors)
        questionElement.classList.add('multiple-choice'); // Adding a multiple-choice-class to the question-box-element

        allAnswers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'answer-button';
            button.textContent = answer;
            button.onclick = () => checkAnswer(button, question.correctAnswer);
            answersContainer.appendChild(button);
        });
    }

    // Add the question element to the DOM to be visble
    document.querySelector('.questions-container').appendChild(questionElement);
    // Add the question to our tracking array
    currentQuestions.push({
        element: questionElement,
        question: question
    });
}

function spawnQuestions() {
    // While-loop is only running one time when the site reloads, and checks if there is at least 2 questions at the start of the game
    /*while (currentQuestions.length <= 2) {
        addNewQuestion();
    }*/

    let canSpawn = true; 
    // setInterval is running every 3 seconds of the game, and checks if there is more than 4 questions before spawing a new quetion
    setInterval(() => {
        if (canSpawn && currentQuestions.length >= 3) {
            return;
        } else {
            addNewQuestion();
            canSpawn = false;

            setTimeout(() => {
                canSpawn = true;
            }, 3000);
        }
    }, 100);
}

function checkAnswer(element, correctAnswer) {
    let isCorrect;
    const questionBox = element.closest('.question-box');

    if (element.tagName.toLowerCase() === 'input') {
        // Checks if the element is an input field, before we comparring the users answer to the correct answer
        isCorrect = element.value.trim() === correctAnswer;
    } else {
        // Checks if the element is a buttom (multiple choice), before we comparring the users answer to the correct answer
        isCorrect = element.textContent.trim() === correctAnswer;
    }

    // If the answer is correct it call the css to make the question green, for then removeing it
    if (isCorrect) {
        // Calls css script
        element.classList.add('correct');

        // Removeing the question
        setTimeout(() => {
            const index = currentQuestions.findIndex(q => q.element === questionBox);
            if (index > -1) {
                currentQuestions.splice(index, 1);
                questionBox.remove();
            }
        }, 500);

        // Updateing it for the opponent through SignalR, but only when the user answer correctly
        connection.invoke("CorrectAnswer", connection.connectionId);
    } else {
        // If the answer is incorrect it call the css to make the question red
        element.classList.add('incorrect');
    }
}
// checkAnswerInput-function is doing more or less the same thing as checkAnswer-function, just for the input field instead of the multiple choice buttons
function checkAnswerInput(inputField, correctAnswer) {
    const userAnswer = inputField.value.trim();
    const isCorrect = userAnswer === correctAnswer;
    const questionBox = inputField.closest('.question-box');

    if (isCorrect) {
        inputField.classList.add('correct');
        setTimeout(() => {
            const index = currentQuestions.findIndex(q => q.element === questionBox);
            if (index > -1) {
                currentQuestions.splice(index, 1);
                questionBox.remove();
            }
        }, 500);

        connection.invoke("CorrectAnswer", connection.connectionId);
    } else {
        inputField.classList.add('incorrect');
    }
}


// Modal box
//-----------------------------------------------------------------------------------------------------
// Function to shows the Modal box and hide gameArena, when the user refresh the site
window.onload = function () {
    document.getElementById("matchOpponent").style.display = "flex";
    document.querySelector('.gameArena').style.display = "none";
};

// Function to remove the Modal box and add gameArena, when the user is matched with an opponent
function closeModal() {
    document.getElementById("matchOpponent").style.display = "none";
    document.querySelector('.gameArena').style.display = "block";
}



// SignalR logic for real-time communication
//------------------------------------------------------------------------------------------------------------------------------
let connection = new signalR.HubConnectionBuilder()
    .withUrl("/gameHub")
    .build();

// Opens the connection for Real-Time communication with sigmalR
connection.start().catch(err => console.error(err));

// This EventListener checks what difficulty (4. klasse til 10. klasse) the user have choosen
document.querySelectorAll('.difficulty-level-button').forEach(button => {
    button.addEventListener('click', function () {
        const difficulty = this.textContent;
        selectedDifficulty = this.textContent;
        document.querySelector('.difficultyScreen').style.display = 'none';
        document.querySelector('.searchOpponent').style.display = 'block';

        connection.invoke("JoinGame", difficulty);
    });
});

// If the oppent is going mad and rage quit an alert will pop up for the user
connection.on("UserLeftBehind", () => {
    alert("Du har mistet forbindelsen til din modstander");
    window.location.reload();
});

// When there is established a connection, the div "matchOpponent" element will be none, and a countdown will start, before the acutally game begins
connection.on("GameStart", (group, questionIds) => {
    gameGroup = group;
    questionOrder = questionIds; // Save the questions order from the server
    document.getElementById('matchOpponent').style.display = 'none';
    startCountdown();
});

// The function for the 5 second countdown, which is also synchronized for both users with SignalR
function startCountdown() {
    let count = 5;
    const countdownElement = document.createElement('div');
    countdownElement.className = 'countdown';
    document.body.appendChild(countdownElement);

    const countInterval = setInterval(() => {
        if (count > 0) {
            countdownElement.textContent = count;
            count--;
        } else {
            clearInterval(countInterval);
            countdownElement.remove();
            startGame();
        }
    }, 1000);
}