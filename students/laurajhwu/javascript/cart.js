import fb from "./fbLogin.js";
import SignInAPI from "./signInAPI.js";

const productsContainer = document.querySelector(".purchase-items");
const checkoutBtn = document.querySelector("#checkout-btn");

let purchaseList = JSON.parse(localStorage.getItem("purchaseList"));

const paymentAmount = {
  subTotal: 0,
  freight: 60,
  total: 0,
};

class LoadCartPage {
  constructor() {
    this.purchaseList = purchaseList;
  }

  displayTotalToPay() {
    const subTotal = document.querySelector(".items-total .amount span");
    const totalToPay = document.querySelector(".payment-sum .amount span");
    const freight = document.querySelector(".shipping-fee .amount span");

    paymentAmount.subTotal = this.purchaseList.reduce(
      (total, product) => total + product.price * product.qty,
      0
    );

    if (paymentAmount.subTotal === 0) {
      paymentAmount.freight = 0;
    } else {
      paymentAmount.freight = 60;
    }

    paymentAmount.total = paymentAmount.subTotal + paymentAmount.freight;

    subTotal.innerText = paymentAmount.subTotal;
    freight.innerText = paymentAmount.freight;
    totalToPay.innerText = paymentAmount.total;
  }

  displayCartQuantity() {
    const cartCounter = document.querySelector(".item-counter");
    const cartPageCounter = document.querySelector(".item-qty");

    cartCounter.innerText = this.purchaseList.length;
    cartPageCounter.innerText = this.purchaseList.length;
  }

  displayNoItems() {
    const purchaseItems = document.querySelector(".purchase-items");
    if (this.purchaseList.length === 0) {
      purchaseItems.innerText = "您的購物車尚無任何商品!";
      purchaseItems.classList.add("empty-cart-style");
    } else {
      purchaseItems.classList.remove("empty-cart-style");
    }
  }

  renderQuantityOptions(product) {
    const tempDiv = document.createElement("div");

    for (let i = 1; i <= product.stock; i++) {
      const qtyOption = new Option(i, i, i === product.qty, i === product.qty);
      tempDiv.append(qtyOption);
    }

    return tempDiv.innerHTML;
  }

  renderPaymentInfo() {
    // eslint-disable-next-line no-undef
    TPDirect.card.setup({
      fields: {
        number: {
          element: "#card-number",
          placeholder: "**** **** **** ****",
        },
        expirationDate: {
          element: document.getElementById("card-expiration-date"),
          placeholder: "MM / YY",
        },
        ccv: {
          element: "#card-ccv",
          placeholder: "後三碼",
        },
      },
      styles: {
        ".valid": {
          color: "green",
        },
        ".invalid": {
          color: "red",
        },
      },
    });
  }

  renderCartPage() {
    productsContainer.innerHTML = "";
    this.purchaseList.forEach((product) => {
      productsContainer.innerHTML += `
          <div class="purchase-item border-bottom display-flex">
            <img
              src="${product.image}"
              alt="product-img"
              class="product-img"
            />
            <section class="product-info">
              <div class="product-name">${product.name}</div>
              <div class="product-id">${product.id}</div>
              <div class="product-color">顏色｜${product.color.name}</div>
              <div class="product-size">尺寸｜${product.size}</div>
            </section>

            <section class="price-info display-flex">
              <div class="item-quantity display-flex text-align">
                <label for="quantity">數量</label>
                <select name="quantity" class="quantity">
                  ${this.renderQuantityOptions(product)}
                </select>
              </div>
              <div class="price">
                <label for="item-price">單價</label>
                <div class="item-price">NT.${product.price}</div>
              </div>
              <div class="price">
                <label for="item-total">小計</label>
                <div class="item-total">NT.${product.price * product.qty}</div>
              </div>
            </section>
            <img
              src="images/cart-remove.png"
              alt="delete-icon"
              class="delete-icon"
            />
          </div>
        `;
    });

    this.displayNoItems();
    this.displayCartQuantity();
    this.displayTotalToPay();
    this.renderPaymentInfo();
  }

  updateCartPage() {
    this.displayNoItems();
    this.displayCartQuantity();
    this.displayTotalToPay();
  }
}

class Order {
  constructor() {
    this.HOST_URL = "https://api.appworks-school.tw";
    this.BASE_URL = this.HOST_URL + "/api/1.0";
    this.CHECKOUT_URL = this.BASE_URL + "/order/checkout";
    this.data = {};
  }

  getRecipientData() {
    const fieldValues = Array.from(
      document.querySelectorAll(".order-form input.manual")
    ).map((input) => input.value);

    fieldValues.push(
      Array.from(document.querySelectorAll(".delivery-times input")).find(
        (time) => time.checked
      ).value
    );
    const fields = ["name", "email", "phone", "address", "time"];
    const data = {};

    fields.forEach((field, i) => {
      data[field] = fieldValues[i];
    });

    return data;
  }

  getPurchaseListForAPI() {
    const apiPurchaseList = JSON.parse(localStorage.getItem("purchaseList"));
    return apiPurchaseList.map((item) => {
      delete item.stock;
      delete item.image;
      return item;
    });
  }

  getOrderData() {
    const fixedData = {
      shipping: "delivery",
      payment: "credit_card",
    };

    this.data.order = {
      shipping: fixedData.shipping,
      payment: fixedData.payment,
      subtotal: paymentAmount.subTotal,
      freight: paymentAmount.freight,
      total: paymentAmount.total,
      recipient: this.getRecipientData(),
      list: this.getPurchaseListForAPI(),
    };
  }

  getTPPrime() {
    return new Promise((resolve) => {
      // eslint-disable-next-line no-undef
      TPDirect.card.getPrime((result) => {
        resolve(result.card.prime);
      });
    });
  }

  renderLoadingPage() {
    const cartPageContainer = document.querySelector(".wrapper");
    const loadingIcon = document.querySelector(".loading");

    loadingIcon.classList.add("is-loading");
    cartPageContainer.style.opacity = "0.2";
  }

  completeOrder(accessToken) {
    // eslint-disable-next-line no-undef
    if (!TPDirect.card.getTappayFieldsStatus().canGetPrime) {
      alert("無法付款");
      return;
    }

    this.getOrderData();

    this.getTPPrime().then((prime) => {
      this.data.prime = prime;
      const signInAPI = new SignInAPI(accessToken);

      this.renderLoadingPage();

      signInAPI.fetchSignInAPI().then((signInData) => {
        fetch(this.CHECKOUT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${signInData.data.access_token}`,
          },
          body: JSON.stringify(this.data),
        })
          .then((response) => response.json())
          .then((data) => {
            purchaseList = [];
            updateLocalStorage();
            window.location.href = `thankyou.html?number=${data.data.number}`;
          });
      });
    });
  }
}

class CheckInfo {
  constructor() {
    this.orderFields = [
      ...document.querySelectorAll(".order-form .manual"),
      ...document.querySelectorAll(".tpfield"),
    ];
    this.orderFieldsData = [
      {
        id: "name",
        errorCategory: "姓名",
        isValid: (fieldValue) => {
          return typeof fieldValue === "string" && fieldValue.length !== 0;
        },
      },
      {
        id: "email",
        errorCategory: "Email",
        isValid: (fieldValue) => {
          return (
            typeof fieldValue === "string" &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)
          );
        },
      },
      {
        id: "phone",
        errorCategory: "電話號碼",
        isValid: (fieldValue) => {
          return !isNaN(fieldValue) && /((?=(09))[0-9]{10})$/.test(fieldValue);
        },
      },
      {
        id: "address",
        errorCategory: "地址",
        isValid: (fieldValue) => {
          return typeof fieldValue === "string" && fieldValue.length !== 0;
        },
      },
      {
        id: "card-number",
        errorCategory: "信用卡號碼",
        isValid: () => {
          // eslint-disable-next-line no-undef
          return TPDirect.card.getTappayFieldsStatus().status.number === 0;
        },
      },
      {
        id: "card-expiration-date",
        errorCategory: "信用卡有效期限",
        isValid: () => {
          // eslint-disable-next-line no-undef
          return TPDirect.card.getTappayFieldsStatus().status.expiry === 0;
        },
      },
      {
        id: "card-ccv",
        errorCategory: "安全碼",
        isValid: () => {
          // eslint-disable-next-line no-undef
          return TPDirect.card.getTappayFieldsStatus().status.ccv === 0;
        },
      },
    ];
    this.isAllValid = true;
    this.errorFields = [];
  }

  getSpecificFieldData(field) {
    return this.orderFieldsData.find(
      (data) => field.getAttribute("id") === data.id
    );
  }

  displayValidity(field) {
    const fieldData = this.getSpecificFieldData(field);
    const fieldValue = field.value;
    if (fieldData.isValid(fieldValue)) {
      field.removeAttribute("style");
    } else {
      field.style.borderColor = "red";
    }
  }

  autoCheckErrorInfo() {
    const paymentFields = this.errorFields.filter((field) =>
      field.matches(".tpfield")
    );
    const memberFields = this.errorFields.filter(
      (field) => !field.matches(".tpfield")
    );

    if (paymentFields) {
      window.TPDirect.card.onUpdate(() =>
        paymentFields.forEach((field) => this.displayValidity(field))
      );
    }
    if (memberFields) {
      memberFields.forEach((field) => {
        field.addEventListener("input", (event) => {
          this.displayValidity(event.target);
        });
      });
    }
  }

  checkoutInfoIsValid() {
    if (purchaseList.length === 0) {
      this.isAllValid = false;
      alert("您的購物車沒有東西耶");
    } else {
      for (const field of this.orderFields) {
        const fieldData = this.getSpecificFieldData(field);
        if (!fieldData.isValid(field.value)) {
          field.style.borderColor = "red";
          this.errorFields.push(field);
          this.isAllValid = false;
        } else {
          field.removeAttribute("style");
        }
      }
      if (this.errorFields.length !== 0) {
        const errorFieldsMsg = this.errorFields.reduce((errorMsg, field, i) => {
          const fieldMsg = this.getSpecificFieldData(field).errorCategory;
          return i === 0 ? errorMsg + fieldMsg : errorMsg + `、${fieldMsg}`;
        }, "");
        alert(`${errorFieldsMsg}有誤`);
      }
    }
    return this.isAllValid;
  }
}

function updateLocalStorage() {
  localStorage.setItem("purchaseList", JSON.stringify(purchaseList));
}

function modifyQuantity(newQty) {
  const qtyOptions = document.querySelectorAll(".quantity");
  const itemTotal = document.querySelectorAll(".item-total");
  let cartPage;

  Array.from(qtyOptions).forEach((qtyOption, index) => {
    if (qtyOption === newQty) {
      const item = purchaseList[index];

      item.qty = Number(newQty.value);
      console.log(purchaseList);
      itemTotal[index].innerText = `NT.${item.qty * item.price}`;
    }
  });
  cartPage = new LoadCartPage();

  updateLocalStorage();
  cartPage.displayTotalToPay();
}

function removeItem(target) {
  const removeIcons = document.querySelectorAll(".delete-icon");
  let cartPage;

  Array.from(removeIcons).forEach((removeIcon, index) => {
    if (removeIcon === target) {
      target.parentElement.remove();
      purchaseList = purchaseList.filter((item, i) => i !== index);
      cartPage = new LoadCartPage();
    }
  });
  cartPage = new LoadCartPage();

  alert("已移除商品！");
  updateLocalStorage();
  cartPage.updateCartPage();
}

function checkOut() {
  const checkInfo = new CheckInfo();
  const order = new Order();
  window.FB.getLoginStatus((response) => {
    if (response.status === "connected") {
      if (checkInfo.checkoutInfoIsValid()) {
        order.completeOrder(response.authResponse.accessToken);
      } else {
        checkInfo.autoCheckErrorInfo();
      }
    } else {
      alert("請先登入會員！");
    }
  });
}

//Initialize TapPay
window.TPDirect.setupSDK(
  12348,
  "app_pa1pQcKoY22IlnSXq5m5WP5jFKzoRG58VEXpT7wU62ud7mMbDOGzCYIlzzLF",
  "sandbox"
);

window.addEventListener("DOMContentLoaded", () => {
  const cartPage = new LoadCartPage();
  cartPage.renderCartPage();
});

productsContainer.addEventListener("change", (event) => {
  if (event.target.matches(".quantity")) {
    modifyQuantity(event.target);
  }
});

productsContainer.addEventListener("click", (event) => {
  if (event.target.matches(".delete-icon")) {
    removeItem(event.target);
  }
});

checkoutBtn.addEventListener("click", () => checkOut());

fb.initFbSettings();
fb.memberBtn.addEventListener("click", () => fb.loginFB());
