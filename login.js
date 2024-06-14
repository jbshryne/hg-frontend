console.log("login.js loaded");

let domain = "http://localhost:4600/";
// domain = "https://hg-backend.onrender.com/";

let $loginForm = $("#loginForm");
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

$loginForm.on("submit", async function (e) {
  e.preventDefault();

  let username = $("#username").val();
  let password = $("#password").val();

  console.log(username, password);

  const response = await fetch(domain + "login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (data.user) {
    localStorage.setItem("heyGPT_currentUser", JSON.stringify(data.user));
    window.location.href = "chat.html";
  } else {
    alert(data.message);
  }

  console.log(resObject);
});
