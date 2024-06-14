console.log(DOMPurify.sanitize);

// let OPENAI_API_KEY;
let currentUser = {};

let domain = "http://localhost:4600/";
// domain = "https://hg-backend.onrender.com/";

if (localStorage.getItem("heyGPT_currentUser")) {
  currentUser = JSON.parse(localStorage.getItem("heyGPT_currentUser"));
}

let $chatLog = $("#chatLog");
let $textPrompt = $("#textPrompt");
let $loadingIndicator = $("#loadingIndicator");
let $checkButton = $("#check-btn");
let $connectedStatus = $("#connected-status");

$checkButton.on("click", async function () {
  $connectedStatus.text("Waking up server...").addClass("loading-message");

  const response = await fetch(domain + "hi", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  console.log(data);
  if (data.success) {
    $connectedStatus.text("Connected!").removeClass("loading-message");
  } else {
    $connectedStatus.text("Not connected").removeClass("loading-message");
  }
});

const getOpenAIKey = async () => {
  const response = await fetch(
    domain + "get-user-key/" + currentUser.username,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const resObject = await response.json();
  console.log("resObject: ", resObject);
  return resObject.openai_key;
};

const hLine = "<hr style='width: 100%' />";

let conversationHistory = [
  { role: "system", content: "You are a helpful assistant." },
];

async function heyGPT(e) {
  e.preventDefault();

  if ($textPrompt.val() === "") return;

  try {
    $loadingIndicator
      .html(`Loading ...`)
      .addClass("loading-message")
      .css("display", "block")
      .show();

    const response = await fetch(
      domain + "user-message/" + currentUser.username,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: $textPrompt.val(),
          isNewConversation: conversationHistory.length <= 1,
        }),
      }
    );

    const resObject = await response.json();
    console.log(resObject);

    const parsedResponse = marked.parse(resObject.response);
    const sanitizedResponse = DOMPurify.sanitize(parsedResponse);

    const userInput = $textPrompt.val();
    // const sanitizedUserMessage = DOMPurify.sanitize(userInput);
    const formattedUserMessage = marked
      .parse(userInput)
      .replace(/\<p\>/g, "")
      .replace(/\<\/p\>/g, "")
      .replace(/\</g, "&lt;");

    $chatLog.append(
      hLine,
      `<div class="user-message"><b>${
        currentUser.displayName || "User"
      }</b><pre>${formattedUserMessage}</pre></div>`
    );

    conversationHistory.push(
      {
        role: "user",
        content: userInput,
      },
      {
        role: "assistant",
        content: sanitizedResponse,
      }
    );

    $loadingIndicator.hide();
    $textPrompt.val("");

    $chatLog.append(
      `<p class="gpt-message"><b>GPT</b><div>${sanitizedResponse}</div></p>`
    );
  } catch (error) {
    $loadingIndicator
      .html(`Something went wrong`)
      .removeClass("loading-message")
      .show();

    console.log(error);
  }
}

$("#chatWithGPT").off().on("submit", heyGPT);

$textPrompt.on("input", function () {
  $(this).css("height", "auto"); // Reset the height to auto
  var newHeight = this.scrollHeight <= 200 ? this.scrollHeight : 200;
  $(this).css("height", newHeight + "px"); // Set it to the scroll height, with a max of 200px

  if (newHeight < 200) {
    $(this).css("overflow", "hidden");
  } else {
    $(this).css("overflow", "auto"); // Add scrollbar when height exceeds 200px
  }
});

function clearChat() {
  const confirmation = confirm("Are you sure you want to clear the chat log?");
  if (!confirmation) return;

  $chatLog.html("");
  conversationHistory = [];
}

document.getElementById("clearChatLog").addEventListener("click", clearChat);

function exportToFile() {
  const conversationText = conversationHistory
    .map(
      (message) =>
        `${message.role.charAt(0).toUpperCase() + message.role.slice(1)}: ${
          message.content
        }`
    )
    .join("\n");

  const blob = new Blob([conversationText], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const fileName = prompt(
    "Enter a file name to save the conversation",
    "conversation"
  );

  if (!fileName) return;

  link.download = fileName + ".txt";
  link.click();
}

function downloadConversation() {
  exportToFile();
}

document
  .getElementById("exportToFile")
  .addEventListener("click", downloadConversation);
