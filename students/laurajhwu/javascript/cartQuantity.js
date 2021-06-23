function displayCartQuantity() {
  const cartCounter = document.querySelector(".item-counter");

  localStorage.setItem(
    "purchaseList",
    localStorage.getItem("purchaseList") || JSON.stringify([])
  );

  cartCounter.innerText = JSON.parse(
    localStorage.getItem("purchaseList")
  ).length;
}

export default displayCartQuantity;
