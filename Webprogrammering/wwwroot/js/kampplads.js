// Random spawing math quetion for then decending to the bottom of the screen
//---------------------------------------------------------------------------------------------------------------------------------------
let currentQuestions = [];
let selectedDifficulty = '';
let questions = [];
let gameGroup = '';
let usedQuestionIds = new Set();
let questionOrder = [];
let currentQuestionIndex = 0;
let userHealth = 100; // Users health
let opponentHealth = 100; // Oppoents health
let correctAnswersCount = 0; // Local varibel that only count number of correct answers
let wrongAnswersCount = 0; // Local varibel that only count number of incorrect answers
let hasRequestedRematch = false; // Boolian that sees if a user have requested a rematch
let gameIsOver = false; // Stae of the game active or not

// Get questions from JSON-file
async function fetchQuestions() {
    const response = await fetch('/questions');
    const data = await response.json();
    questions = data.questions;
}

// Starts the game right after the countdown is finsihed
async function startGame() {
    // When the user playing a new game or rematch without refreching the site, will this ensure that all the quetions and varibels is reset and active again
    userHealth = 100; // Reset users health
    opponentHealth = 100; // Reset oppoents health
    currentQuestionIndex = 0; // Reset quetions index
    correctAnswersCount = 0; // Reset the stats count for correct ansered quetions
    wrongAnswersCount = 0; // Reset the stats count for incorrect ansered quetions
    gameIsOver = false; // Set game stae to plaing
    currentQuestions = []; // Make the quetions array empty
    usedQuestionIds.clear(); // Clear all used questions
    // Reset UI
    document.querySelector('.gameArena').style.display = 'block'; // Show the game area whe nthe game start
    document.querySelector('.questions-container').innerHTML = ''; // Removed all used quetions
    updateHealthBar(true, userHealth); // Resetting users healthbar
    updateHealthBar(false, opponentHealth); // Resetting oppoents healthbar

    await fetchQuestions();
    spawnQuestions();
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
        answerInput.addEventListener('keydown', function (event) {
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
    // setInterval is running every 1 seconds of the game, and checks if there is more than 3 questions before spawing a new quetion
    setInterval(() => {
        if (currentQuestions.length < 3) {
            addNewQuestion();
        }
    }, 1000);
}

function checkAnswer(element, correctAnswer) {
    let isCorrect;
    const questionBox = element.closest('.question-box');
    const invalidFeedback = questionBox.querySelector('.invalid-feedback');
    const validFeedback = questionBox.querySelector('.valid-feedback');
    const inputField = questionBox.querySelector('.answer-input');

    if (element.tagName.toLowerCase() === 'input') {
        // Checks if the element is an input field, before we comparring the users answer to the correct answer
        isCorrect = element.value.trim() === correctAnswer;

        // Show feedback to the user if the answer in the input-field is correct or wrong
        if (!isCorrect) {
            invalidFeedback.style.display = 'block';

            // Adding an event listener to hide feedback, when the user writes a new answer
            element.addEventListener('input', function () {
                invalidFeedback.style.display = 'none';
            }, { once: true });
        } else {
            validFeedback.style.display = 'block';
        }
    } else {
        // Checks if the element is a buttom (multiple choice), before we comparring the users answer to the correct answer
        isCorrect = element.textContent.trim() === correctAnswer;
    }

    // If the answer is correct it call the css to make the question green, for then removeing it
    if (isCorrect) {
        // Calls css script
        element.classList.add('correct');
        inputField.classList.add('correct');

        correctAnswersCount++; // Adding 1 more to the correctAnswersCount

        // Removeing the question
        setTimeout(() => {
            const index = currentQuestions.findIndex(q => q.element === questionBox);
            if (index > -1) {
                currentQuestions.splice(index, 1);
                questionBox.remove();
            }
        }, 500);

        // Updating the opponets healthbar locally before synchronizing it for both users
        opponentHealth -= 20;
        updateHealthBar(false, opponentHealth);

        // Updateing it for the opponent through SignalR, but only when the user answer correctly
        connection.invoke("CorrectAnswer", connection.connectionId);
    } else {
        // If the answer is incorrect it call the css to make the question red
        element.classList.add('incorrect');
        inputField.classList.add('incorrect');

        wrongAnswersCount++; // Adding 1 more to the wrongAnswersCount
    }
}

// Updates both users health bar
function updateHealthBar(isPlayer, health) {
    const progressBar = isPlayer ?
        document.querySelector('.user-health-bar .progress-bar') :
        document.querySelector('.opponent-health-bar .progress-bar');

    progressBar.style.width = `${health}%`;
    progressBar.textContent = `${health}%`;

    // Changing the color of the health bar to symbolize how much health a user have
    if (health > 66) {
        progressBar.className = 'progress-bar bg-success';
    } else if (health > 33) {
        progressBar.className = 'progress-bar bg-warning';
    } else {
        progressBar.className = 'progress-bar bg-danger';
    }

    if (health <= 0) {
        GameOver(isPlayer);
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

function GameOver(isPlayer) {
    // All these 4 refference are all refferences to the html DOM-elements
    const modal = document.getElementById("matchOpponent"); // Refference to the matchOppoent screen
    const difficultyScreen = modal.querySelector('.difficultyScreen'); // Refference to the choose a specific difficulty screen
    const searchScreen = modal.querySelector('.searchOpponent'); // Refference to the waiting for oppoent screen 
    const gameOverScreen = modal.querySelector('.gameOverScreen'); // Refference to the game over scrren with stats and navigation buttoms

    gameIsOver = true;

    // Hide all div except "gameOverScreen"
    difficultyScreen.style.display = 'none';
    searchScreen.style.display = 'none';
    gameOverScreen.style.display = 'block';
    modal.style.display = 'flex';

    // Updating the "h2" text personal for both users
    document.getElementById('gameResult').textContent = isPlayer ? 'Du tabte!' : 'Du vandt!';

    // Updating the game stats, personal for both users
    document.getElementById('correctAnswers').textContent = correctAnswersCount;
    document.getElementById('wrongAnswers').textContent = wrongAnswersCount;

    // Reset rematch status
    hasRequestedRematch = false;
    updateRematchButton(false);
}
// The two functions "requestRematch" and "updateRematchButton" handels the rematch functionalites and buttom
function requestRematch() {
    hasRequestedRematch = true;
    connection.invoke("RequestRematch", connection.connectionId);
    updateRematchButton(true);
}
function updateRematchButton(waiting) {
    const rematchBtn = document.getElementById('rematchButton');
    rematchBtn.textContent = waiting ? 'Venter på modstander...' : 'Omkamp';
    rematchBtn.disabled = waiting;
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

// If the opponent is going mad and rage quit an alert will pop up for the user
connection.on("UserLeftBehind", () => {
    // If game is not over, it will reload the screen if the user rage quit. And if the game is over and the user rage quit the rematch buttom will not be working 
    if (!gameIsOver) {
        alert("Du har mistet forbindelsen til din modstander");
        window.location.reload();
    } else {
        const rematchBtn = document.getElementById('rematchButton');
        rematchBtn.disabled = true;
        rematchBtn.textContent = 'Din modstander forlod spillet';
    }

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
    document.querySelector('.gameArena').style.display = 'none';
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

// Whenever the user have taken damage it will be updated
connection.on("TakeDamage", (damage) => {
    userHealth -= damage;
    updateHealthBar(true, userHealth);
});