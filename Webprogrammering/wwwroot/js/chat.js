"use strict";

// Initialize SignalR connection
const connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

// DOM elements
const sendButton = document.getElementById("sendButton");
const messagesList = document.getElementById("messagesList");
const userInput = document.getElementById("userInput");
const messageInput = document.getElementById("messageInput");
const groupInput = document.getElementById("groupInput");
const createGroupButton = document.getElementById("createGroupButton");
const joinGroupButton = document.getElementById("joinGroupButton");
const leaveGroupButton = document.getElementById("leaveGroupButton");

// Disable the send button until connection is established
sendButton.disabled = true;

// Handle incoming messages
connection.on("ReceiveMessage", (user, message) => {
    const li = document.createElement("li");
    // Use textContent to prevent XSS attacks
    li.textContent = `${user} says ${message}`;
    messagesList.appendChild(li);
});

// Handle group creation notification
connection.on("GroupCreated", (groupName) => {
    alert(`Group ${groupName} has been created! You can start chatting.`);
});

// Handle group join notification
connection.on("JoinedGroup", (groupName) => {
    alert(`You have joined group ${groupName}!`);
});

// Start the connection
connection.start()
    .then(() => {
        sendButton.disabled = false;
    })
    .catch((err) => console.error(err.toString()));

// Helper function (invokeHubMethod) to invoke hub methods, handle errors and to reduce code duplication when calling hub methods.
const invokeHubMethod = (methodName, ...args) => {
    connection.invoke(methodName, ...args)
        .catch((err) => console.error(err.toString()));
};

// Event listeners for buttons
createGroupButton.addEventListener("click", () => {
    invokeHubMethod("CreateGroup", groupInput.value);
});

joinGroupButton.addEventListener("click", () => {
    invokeHubMethod("JoinGroup", groupInput.value);
});

leaveGroupButton.addEventListener("click", () => {
    invokeHubMethod("LeaveGroup", groupInput.value);
});

sendButton.addEventListener("click", (event) => {
    event.preventDefault();
    invokeHubMethod("SendMessage", groupInput.value, userInput.value, messageInput.value);
    messageInput.value = ''; // Clear the message input after sending
});
