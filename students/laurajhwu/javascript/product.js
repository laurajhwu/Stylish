import fb from "./fbLogin.js";
import displayCartQuantity from "./cartQuantity.js";

const purchaseOptions = document.querySelector(".purchase-options");

const userData = {
  purchaseQuantity: 1,
  selectedColor: "",
  selectedSize: "",
};

const productData = {
  stock: 0,
};

class fetchProductAPI {
  constructor(path) {
    this.HOST_URL = "https://api.appworks-school.tw";
    this.BASE_URL = this.HOST_URL + "/api/1.0";
    this.PRODUCTS_URL = this.BASE_URL + "/products/";
    this.PATH_URL = this.PRODUCTS_URL + path;

    this.queryString = window.location.search;
    this.URLParams = new URLSearchParams(this.queryString);
    this.productID = this.URLParams.get("id");
  }

  async getProductDetailsData() {
    return await fetch(this.PATH_URL + `?id=${this.productID}`)
      .then((response) => response.json())
      .then((data) => data.data);
  }
}

class productPageFormat {
  constructor(product) {
    this.product = product;
  }

  colorOptionHTML(colors) {
    const tempContainer = document.createElement("div");

    colors.forEach((option, i) => {
      const color = new Option("", option.code, false, false);
      if (i === 0) {
        color.className = "color color-selected";
      } else {
        color.className = "color";
      }
      color.style.backgroundColor = `#${option.code}`;
      tempContainer.append(color);
    });

    return tempContainer.innerHTML;
  }

  sizeOptionHTML(sizes) {
    const tempContainer = document.createElement("div");

    sizes.forEach((option, i) => {
      const size = new Option(option, option, false, false);
      if (i === 0) {
        size.className = "size size-selected";
      } else {
        size.className = "size";
      }

      tempContainer.append(size);
    });

    return tempContainer.innerHTML;
  }

  detailImagesHTML(images) {
    const tempContainer = document.createElement("div");

    images.forEach((link) => {
      const img = new Image();
      img.src = link;
      tempContainer.append(img);
    });

    return tempContainer.innerHTML;
  }

  renderProductBasicInfo(product) {
    const productBasics = document.querySelector(".product-basics");
    const mainImg = new Image();
    const mainProductInfo = document.querySelector(".main-info");
    const allColors = document.querySelector("#colors");
    const allSizes = document.querySelector("#sizes");
    const basicDescription = document.querySelector(".basic-description");
    const titleInHead = document.querySelector("title");

    titleInHead.innerText = `Stylish - ${product.title} Details and Selection`;

    mainImg.src = product.main_image;
    productBasics.prepend(mainImg);

    mainProductInfo.innerHTML = `
    <h1 id="product-title">${product.title}</h1>
    <h3 id="product-id">${product.id}</h3>
    <h2 id="product-price">TWD .${product.price}</h2>
    <hr />
  `;

    allColors.innerHTML = `
    <label for="colors" id="color-label">顏色 |</label>
    ${this.colorOptionHTML(product.colors)}
  `;

    allSizes.innerHTML = `
    <label for="sizes" id="size-label">尺寸 |</label>
    ${this.sizeOptionHTML(product.sizes)}
  `;

    basicDescription.innerHTML = `
    <div class="note">${product.note}</div>
    <div class="texture">${product.texture}</div>
    <div class="description">${product.description.replaceAll("\r\n", "<br />")}
    </div>
    <div class="wash">清洗：${product.wash}</div>
    <div class="place">產地：${product.place}</div>
  `;
  }

  renderProductDetails(product) {
    const story = document.querySelector(".story");
    const detailImages = document.querySelector(".detail-images");

    story.innerText = product.story;
    detailImages.innerHTML = this.detailImagesHTML(product.images);
  }

  renderProductPage() {
    this.renderProductBasicInfo(this.product);
    this.renderProductDetails(this.product);
  }
}

function loadAllProductInfo() {
  const productDetailsAPI = new fetchProductAPI("details");
  productDetailsAPI
    .getProductDetailsData()
    .then((product) => {
      const productPage = new productPageFormat(product);
      productPage.renderProductPage();
      displayPurchaseQuantity(userData.purchaseQuantity);
      displayCartQuantity();
      return product;
    })
    .then((product) => {
      storeProductData(
        product,
        "variants",
        "title",
        "id",
        "price",
        "main_image",
        "colors"
      );
    });
}

function storeProductData(product, ...data) {
  data.forEach((data) => {
    if (Array.isArray(product[data])) {
      productData[data] = [...product[data]];
    } else {
      productData[data] = product[data];
    }
  });
  updateStockAvailability();
  handleOutStock();
}

function getVariantsByColor() {
  getSelectedOptions();
  return productData.variants.filter(
    (variant) => userData.selectedColor === variant.color_code
  );
}

function getSelectedOptions() {
  userData.selectedColor = document.querySelector(`.color-selected`).value;
  userData.selectedSize = document.querySelector(`.size-selected`).value;
}

function selectOption(selection, category) {
  const prevSelected = document.querySelector(`.${category}-selected`);
  if (prevSelected) {
    if (prevSelected !== selection) {
      userData.purchaseQuantity = 1;
      displayPurchaseQuantity(userData.purchaseQuantity);
    }
    prevSelected.classList.remove(`${category}-selected`);
  }
  selection.classList.add(`${category}-selected`);
}

function updateStockAvailability() {
  getVariantsByColor().forEach((variant) => {
    if (variant.size === userData.selectedSize) {
      productData.stock = variant.stock;
    }
  });
}

function handleOutStock() {
  getVariantsByColor().forEach((variant) => {
    const sizeOption = document.querySelector(`.size[value="${variant.size}"]`);
    if (variant.stock === 0) {
      sizeOption.disabled = true;
      if (userData.selectedSize === variant.size) {
        const minSizeAvailable = Array.from(sizeOption.parentElement.children)
          .slice(1)
          .find((size) => !size.disabled);
        selectOption(minSizeAvailable, "size");
        updateStockAvailability();
      }
    } else {
      sizeOption.disabled = false;
    }
  });
}

function addToCart() {
  getSelectedOptions();
  const purchaseList = JSON.parse(localStorage.getItem("purchaseList"));
  const confirmation = document.querySelector(".add-to-cart-confirm");
  const productInCart = purchaseList.find(
    (item) =>
      item.color.code === userData.selectedColor &&
      item.size === userData.selectedSize
  );

  if (productInCart) {
    productInCart.qty = userData.purchaseQuantity;
    localStorage.setItem("purchaseList", JSON.stringify(purchaseList));
  } else {
    localStorage.setItem(
      "purchaseList",
      JSON.stringify([
        ...purchaseList,
        {
          id: productData.id,
          name: productData.title,
          price: productData.price,
          stock: productData.stock,
          image: productData.main_image,
          color: productData.colors.find(
            (color) => color.code === userData.selectedColor
          ),
          size: userData.selectedSize,
          qty: userData.purchaseQuantity,
        },
      ])
    );
  }

  confirmation.classList.add("show-confirmation");
  setTimeout(() => confirmation.classList.remove("show-confirmation"), 1450);

  displayCartQuantity();
}

function displayPurchaseQuantity(purchaseQuantity) {
  const quantityDisplay = document.querySelector(".quantity-number");
  quantityDisplay.innerText = purchaseQuantity;
}

window.addEventListener("DOMContentLoaded", () => {
  loadAllProductInfo();
});

purchaseOptions.addEventListener("click", (event) => {
  if (event.target.matches(".color")) {
    selectOption(event.target, "color");
    updateStockAvailability();
    handleOutStock();
  }

  if (event.target.matches(".size")) {
    selectOption(event.target, "size");
    updateStockAvailability();
  }

  if (event.target.matches(".quantity #add-btn")) {
    if (userData.purchaseQuantity < productData.stock) {
      displayPurchaseQuantity(++userData.purchaseQuantity);
    }
  }

  if (event.target.matches(".quantity #remove-btn")) {
    if (userData.purchaseQuantity > 1) {
      displayPurchaseQuantity(--userData.purchaseQuantity);
    }
  }

  if (event.target.matches(".add-to-cart")) {
    addToCart();
  }
});

fb.initFbSettings();
fb.memberBtn.addEventListener("click", () => fb.loginFB());
