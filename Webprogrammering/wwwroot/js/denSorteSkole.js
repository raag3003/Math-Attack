document.querySelectorAll(".openFormulas").forEach(function (closeButton) {
    closeButton.addEventListener("click", function () {
        document.querySelector(".Formelsamling").style.display = "block";
        document.querySelector(".denSorteSkole-NavMenu").style.display = "none";
        document.querySelector(".flashcard").style.display = "none";
        document.querySelector(".test-container").style.display = "none";
    });
});

document.querySelectorAll(".openTest").forEach(function (closeButton) {
    closeButton.addEventListener("click", function () {
        document.querySelector(".test-container").style.display = "block";
        document.querySelector(".denSorteSkole-NavMenu").style.display = "none";
        document.querySelector(".flashcard").style.display = "none";
        document.querySelector(".Formelsamling").style.display = "none";
    });
});

document.querySelector(".openFlashcards").addEventListener("click", function () {
    document.querySelector(".Formelsamling").style.display = "none";
    document.querySelector(".flashcard").style.display = "block";
});


// Take all elements with class "close", and disable them through a forEach loop
document.querySelectorAll(".close").forEach(function (closeButton) {
    closeButton.addEventListener("click", function () {
        document.querySelector(".Formelsamling").style.display = "none";
        document.querySelector(".flashcard").style.display = "none";
        document.querySelector(".test-container").style.display = "none";
        document.querySelector(".denSorteSkole-NavMenu").style.display = "block";
    });
});

// Flashcard clik function
//----------------------------------------------------------------------------------
let cards = [];
let currentCard = 0;
let isShowingQuestion = true;

// Load the cards from JSON
fetch('/json/flashcards.json')
    .then(response => response.json())
    .then(data => {
        cards = data.cards;
        showCard();
    });

const flashcard = document.getElementById('flashcard');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');

// Show current card
function showCard() {
    if (cards.length === 0) return;

    if (isShowingQuestion == true) {
        flashcard.innerHTML = `<p>${cards[currentCard].front}</p>`;
        isShowingQuestion = true;
    } else {
        flashcard.innerHTML = `<p style="transform: rotateY(180deg)">${cards[currentCard].back}</p>`; // Adding inline css inside the inline html to rotate the back side of the flashcard.
        isShowingQuestion = false;
    }

    if (isShowingQuestion == true) {
        document.querySelector(".hint").style.display = "block";
    } else {
        document.querySelector(".hint").style.display = "none";
    }

    MathJax.typeset(); // Format the math numbers, equations, symbols etc.
}

// Flip card
flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('flipped');
    isShowingQuestion = !isShowingQuestion;
    showCard();
});

// Previous card
prevButton.addEventListener('click', () => {
    if (currentCard > 0) {
        currentCard--;
        isShowingQuestion = true;
        flashcard.classList.remove('flipped');
        showCard();
    }
});

// Next card
nextButton.addEventListener('click', () => {
    if (currentCard < cards.length - 1) {
        currentCard++;
        isShowingQuestion = true;
        flashcard.classList.remove('flipped');
        showCard();
    }
});


// Logic for the test
//-----------------------------------------------------------------------------------------------
const addCard = document.getElementById("add");
const subCard = document.getElementById("subtract");
const multiplyCard = document.getElementById("multiply");
const divideCard = document.getElementById("divide");
const dialog = document.querySelector("dialog");
const operator = document.getElementById("operator");

let selectedCard = "";
let testCounter = 0;

function identifyCard() {
    generateTest();
}

addCard.addEventListener("click", function () {
    openDialog("add", "\\(+\\)");
});

subCard.addEventListener("click", function () {
    openDialog("subtract", "\\(-\\)");
});

multiplyCard.addEventListener("click", function () {
    openDialog("multiply", "\\(\\cdot\\)");
});

divideCard.addEventListener("click", function () {
    openDialog("divide", "/");
});

function openDialog(cardType, operatorSymbol) {
    dialog.classList.add("open");
    selectedCard = cardType;
    operator.innerHTML = operatorSymbol;
    dialog.showModal();
    dialog.style.display = "flex";
    identifyCard();
}
MathJax.typeset();

function generateTest() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;

    document.getElementById('num1').textContent = `\\(${num1}\\)`;
    document.getElementById('num2').textContent = `\\(${num2}\\)`;

    // !!!Important to call MathJax LaTeX API every time something new happen after the website is loaded
    MathJax.typeset();
}

function getCorrectAnswer(num1, num2) {
    switch (selectedCard) {
        case "add":
            return num1 + num2;
        case "subtract":
            return num1 - num2;
        case "multiply":
            return num1 * num2;
        case "divide":
            return parseFloat((num1 / num2).toFixed(1));
            return parseFloat((num1 / num2).toFixed(1));
        default:
            return null;
    }
}

function checkAnswer() {
    const num1 = parseInt(document.getElementById('num1').textContent);
    const num2 = parseInt(document.getElementById('num2').textContent);
    const userAnswer = parseFloat(document.getElementById('answer').value);
    const correctAnswer = getCorrectAnswer(num1, num2);
    const resultDiv = document.getElementById('result');

    if (userAnswer === correctAnswer) {
        resultDiv.textContent = 'Korrekt!';
        resultDiv.style.color = 'green';
    } else {
        resultDiv.textContent = 'Forkert, Prøv igen';
        resultDiv.style.color = 'red';
    }

    setTimeout(() => {
        generateTest();
        resultDiv.textContent = '';
        document.getElementById('answer').value = '';
    }, 1000);
}
MathJax.typeset();

function closeDialog() {
    dialog.close();
    dialog.style.display = "none";
}