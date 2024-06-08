console.log("login.js loaded");

let $loginForm = $("#loginForm");

$loginForm.on("submit", async function (e) {
  e.preventDefault();

  let username = $("#username").val();
  let password = $("#password").val();

  console.log(username, password);

  const response = await fetch("http://localhost:4600/login", {
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
