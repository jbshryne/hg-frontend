let currentUser = {};

let domain = "http://localhost:4600/";
// domain = "https://hg-backend.onrender.com/";

if (localStorage.getItem("heyGPT_currentUser")) {
  currentUser = JSON.parse(localStorage.getItem("heyGPT_currentUser"));
} else {
  window.location.href = "login.html";
}

const $chatLog = $("#chatLog");
const $textPrompt = $("#textPrompt");
const $loadingIndicator = $(".loadingIndicator");
const $checkButton = $("#check-btn");
const $connectedStatus = $("#connected-status");
const $conversationList = $("#conversation-list");
const $conversationTitle = $("#conversation-title");

let isLoading = false;

// let conversationTitle = "New Conversation";

let conversationHistory = [
  { role: "system", content: "You are a helpful assistant." },
];

let conversation_id = "";

$(function () {
  $("#accordion").accordion({
    collapsible: true,
    active: false,
    activate: function (event, ui) {
      if (ui.newHeader.length) {
        $("#conversations").show();
      } else {
        $("#conversations").hide();
      }
    },
  });

  $(document).click(function (event) {
    var $target = $(event.target);
    if (
      !$target.closest("#accordion").length &&
      $("#accordion").accordion("option", "active") !== false
    ) {
      $("#accordion").accordion("option", "active", false);
    }
  });
});

const getConversations = async () => {
  const response = await fetch(
    domain + "conversations/" + currentUser.username,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const resObject = await response.json();
  console.log("resObject: ", resObject);

  return resObject.conversations;
};

const getConversation = async (conversationId) => {
  if (conversationId === conversation_id) return;

  const response = await fetch(domain + "conversation/" + conversationId, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const resObject = await response.json();

  console.log("resObject: ", resObject);

  $chatLog.html("");

  resObject.conversation.messages.forEach((message) => {
    const formattedMessage = marked.parse(message.content);
    const sanitizedMessage = DOMPurify.sanitize(formattedMessage);

    if (message.role === "user") {
      $chatLog.append(
        `<div class="user-message"><b>${
          currentUser.displayName || "User"
        }</b><pre>${sanitizedMessage}</pre></div>`
      );
    } else if (message.role === "assistant") {
      $chatLog.append(
        `<p class="gpt-message"><b>GPT</b><div>${sanitizedMessage}</div></p>`
      );
    }
  });

  $conversationTitle
    .text(resObject.conversation.title || "New Conversation")
    .off()
    .on("click", function () {
      editConversationTitle(conversationId, resObject.conversation.title);
    });

  conversation_id = resObject.conversation._id;
  conversationHistory = resObject.conversation.messages;

  // scroll to the top of the chat log
  $chatLog.scrollTop(0);
};

// edit conversation title
const editConversationTitle = async (conversationId, currentTitle) => {
  const newTitle = prompt(
    "Enter a new title for the conversation",
    currentTitle
  );

  if (!newTitle) return;

  const response = await fetch(domain + "conversation/" + conversationId, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: newTitle,
    }),
  });

  const resObject = await response.json();
  console.log("resObject: ", resObject);

  getConversations().then((conversations) => {
    populateConversations(conversations);
  });

  $conversationTitle.text(newTitle);
};

const deleteConversation = async (conversationId) => {
  const confirmation = confirm(
    "Are you sure you want to delete this conversation?"
  );

  if (!confirmation) return;

  const response = await fetch(domain + "conversation/" + conversationId, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const resObject = await response.json();
  console.log("resObject: ", resObject);

  if (conversation_id === conversationId) {
    $chatLog.html("");
    conversationHistory = [];
    conversation_id = "";
  }
};

const populateConversations = async (conversations) => {
  $("#conversation-list").html("");

  conversations.forEach((conversation) => {
    $("<li></li>")
      .data("id", conversation._id)
      .text(conversation.title || "New Conversation")
      .on("click", function () {
        if (isLoading) return;
        getConversation(conversation._id);
      })
      .append(
        $('<button class="delete-btn">X</button>').on("click", function (e) {
          e.stopPropagation();
          e.preventDefault();
          deleteConversation(conversation._id);
        })
      )
      .prependTo($("#conversation-list"));
  });
};

getConversations().then((conversations) => {
  populateConversations(conversations);
});

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

async function heyGPT(e) {
  e.preventDefault();

  if ($textPrompt.val() === "") return;

  try {
    isLoading = true;

    $loadingIndicator
      .html(`Loading ...`)
      .addClass("loading-message")
      .css("display", "block")
      .show();

    // if (conversationHistory.length >= 1) {
    //   // set the conversationId to the most recent conversation
    // }

    const response = await fetch(
      domain + "user-message/" + currentUser.username,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation_id,
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

    // conversationTitle = resObject.title;
    conversation_id = resObject._id;

    $conversationTitle
      .text(resObject.title || "New Conversation")
      .off()
      .on("click", function () {
        editConversationTitle(conversationId, resObject.title);
      });

    $loadingIndicator.hide();
    $textPrompt.val("");

    isLoading = false;

    $chatLog.append(
      `<p class="gpt-message"><b>GPT</b><div>${sanitizedResponse}</div></p>`
    );
  } catch (error) {
    $loadingIndicator
      .html(`Something went wrong`)
      .removeClass("loading-message")
      .show();

    isLoading = false;

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
    .map((message) => {
      `${message.role.charAt(0).toUpperCase() + message.role.slice(1)}: ${
        message.content
      }`;
    })
    .join("\n");

  console.log("conversationHistory:", conversationHistory);
  console.log("conversationText:", conversationText);

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
