"use strict";

// Initialize SignalR connection
const connection = new signalR.HubConnectionBuilder().withUrl("/mathHub").build();

// DOM elements
const elements = {
    userInput: document.getElementById("userInput"),
    groupInput: document.getElementById("groupInput"),
    fetchProblemButton: document.getElementById("fetchProblemButton"),
    problemDisplay: document.getElementById("problemDisplay"),
    answerInput: document.getElementById("answerInput"),
    answerProblemButton: document.getElementById("answerProblemButton"),
    createGroupButton: document.getElementById("createGroupButton"),
    joinGroupButton: document.getElementById("joinGroupButton"),
    leaveGroupButton: document.getElementById("leaveGroupButton")
};

// Helper function to invoke hub methods and handle/catch errors
const invokeHubMethod = (methodName, ...args) => {
    return connection.invoke(methodName, ...args)
        .catch(err => console.error(`Error in ${methodName}:`, err.toString()));
};


// SignalR event handlers, defines what to do when a specific message arrive from the server.
const signalRHandlers = {
    ReceiveMathProblem: (problem) => {
        elements.problemDisplay.textContent = problem;
    },
    AnswerFeedback: (isCorrect, message) => {
        alert(message); // Display whether the answer was correct or incorrect
    },
    GroupCreated: (groupName) => {
        alert(`Group ${groupName} has been created! You can now start mathematising.`);
    },
    JoinedGroup: (groupName) => {
        alert(`You have joined group ${groupName}!`);
    },
    LeftGroup: (groupName) => {
        alert(`You have left the group ${groupName}!`);
    }
};

// Register SignalR event handlers, tells the system to do something for each type of messages that arrives from the server.
Object.entries(signalRHandlers).forEach(([event, handler]) => {
    connection.on(event, handler);
});

// Start SignalR connection
elements.fetchProblemButton.disabled = true;
connection.start()
    .then(() => {
        elements.fetchProblemButton.disabled = false;
    })
    .catch(err => console.error("Connection start error:", err.toString()));



// Event listeners for buttons
elements.createGroupButton.addEventListener("click", () => {
    invokeHubMethod("CreateGroup", elements.groupInput.value);
});

elements.joinGroupButton.addEventListener("click", () => {
    invokeHubMethod("JoinGroup", elements.groupInput.value);
});

elements.leaveGroupButton.addEventListener("click", () => {
    invokeHubMethod("LeaveGroup", elements.groupInput.value);
});

elements.fetchProblemButton.addEventListener("click", () => {
    invokeHubMethod("SendMathProblem", elements.groupInput.value);
});

elements.answerProblemButton.addEventListener("click", () => {
    const userAnswer = elements.answerInput.value;
    invokeHubMethod("SubmitAnswer", elements.groupInput.value, userAnswer);
    elements.answerInput.value = ''; // Clear the answer input after submitting
});