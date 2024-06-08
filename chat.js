console.log("app.js");

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

    // const response = await fetch(
    //   domain + "user-message/" + currentUser.username,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       message: $textPrompt.val(),
    //     }),
    //   }
    // );

    // const resObject = await response.json();
    // console.log(resObject);

    const response = await fetch(
      domain + "user-message/" + currentUser.username,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: $textPrompt.val(),
          conversationHistory,
        }),
      }
    );

    const resObject = await response.json();
    console.log(resObject);

    const formattedResponse = marked.parse(resObject.response);

    const formattedUserMessage = marked
      .parse($textPrompt.val())
      .replace(/\<p\>/g, "")
      .replace(/\<\/p\>/g, "")
      .replace(/\</g, "&lt;");

    $chatLog.append(
      hLine,
      `<div class="user-message"><b>${currentUser.username}</b><pre>
      ${formattedUserMessage}</pre>
      </div>`
    );

    conversationHistory.push(
      {
        role: "user",
        content: $textPrompt.val(),
      },
      {
        role: "assistant",
        content: resObject.response,
      }
    );

    $loadingIndicator.hide();
    $textPrompt.val("");

    $chatLog.append(
      `<p class="gpt-message"><b>Asst</b>${formattedResponse}</p>`
    );
  } catch (error) {
    $loadingIndicator
      .html(`Something went wrong. Please try again.`)
      .removeClass("loading-message")
      .show();

    console.log(error);
  }
}

$("#chatWithGPT").off().on("submit", heyGPT);

function clearChat() {
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
  link.download = fileName + ".txt";
  link.click();
}

function downloadConversation() {
  exportToFile();
}

document
  .getElementById("exportToFile")
  .addEventListener("click", downloadConversation);
