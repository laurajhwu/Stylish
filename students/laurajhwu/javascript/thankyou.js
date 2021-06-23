import fb from "./fbLogin.js";
import displayCartQuantity from "./cartQuantity.js";

function renderOrderNumber() {
  const queryString = window.location.search;
  const URLParams = new URLSearchParams(queryString);
  const orderNumber = URLParams.get("number");

  if (!URLParams.has("number") || orderNumber === "") {
    window.location.href = "index.html";
  }

  document.querySelector(".order-number").innerText = orderNumber;
}

window.addEventListener("DOMContentLoaded", () => {
  renderOrderNumber();
  displayCartQuantity();
});

fb.initFbSettings();
fb.memberBtn.addEventListener("click", () => fb.loginFB());
