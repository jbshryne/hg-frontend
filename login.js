let domain = "http://localhost:4600/";
domain = "https://hg-backend.onrender.com/";

const $checkButton = $("#check-btn");
const $connectedStatus = $("#connected-status");
const $loginForm = $("#loginForm");
const $loadingIndicator = $(".loadingIndicator");

$checkButton.on("click", async function () {
  $connectedStatus.text("Waking server...").addClass("loading-message");
  $("#check-btn-label").removeClass("loading-message");

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
    $checkButton
      .html("Hide widget")
      .off("click")
      .on("click", function () {
        $("#connection-widget").hide();
      });
  } else {
    $connectedStatus.text("Not connected").removeClass("loading-message");
  }
});

$loginForm.on("submit", async function (e) {
  e.preventDefault();

  const username = $("#username").val();
  const password = $("#password").val();

  $loadingIndicator.text("Logging in...").addClass("loading-message");

  try {
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
      $loadingIndicator.text("Error logging in").removeClass("loading-message");
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    $loadingIndicator.text("Error logging in").removeClass("loading-message");
    alert("An error occurred. Please try again.");
  }
});
