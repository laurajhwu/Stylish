import fb from "./javascript/fbLogin.js";
import displayCartQuantity from "./javascript/cartQuantity.js";

const HOST_URL = "https://api.appworks-school.tw";
const BASE_URL = HOST_URL + "/api/1.0";
const PRODUCTS_URL = BASE_URL + "/products/";
const MARKETING_URL = BASE_URL + "/marketing/";

const productContainer = document.querySelector(".container");
const searchBar = document.querySelector(".search-bar");
const searchForm = document.querySelector("#search-form");
const searchInput = searchForm.children[0];
const campaignDisplay = document.querySelector(".campaign");

let nextPage = 0;
let isLoading = false;
let sliderOnPause = false;

const queryString = window.location.search;
const URLParams = new URLSearchParams(queryString);

/*============ Functions ============*/

function colorsFormatHTML(colors) {
  const colorContainer = document.createElement("div");
  colorContainer.className = "colors";

  colors.forEach((color) => {
    const colorOption = document.createElement("div");
    colorOption.className = "color-option";
    colorOption.style.backgroundColor = `#${color.code}`;
    colorContainer.append(colorOption);
  });

  return colorContainer;
}

function productsFormatHTML(product) {
  return `
  <a href="product.html?id=${product.id}">
    <div class="product">
      <img
        src=${product.main_image}
        alt=${product.title}
        class="product-img"
      />
      ${colorsFormatHTML(product.colors).outerHTML}
      <p class="product-name">${product.title}</p>
      <div class="product-price">TWD.${product.price}</div>
    </div>
  </a>`;
}

function renderProducts(productList) {
  let productsHTML = "";
  productList.forEach(
    (product) => (productsHTML += productsFormatHTML(product))
  );
  productContainer.innerHTML += productsHTML;
}

function renderCampaign(campaigns) {
  const circles = document.createElement("div");
  circles.className = "circles";

  campaigns.forEach((campaign, index) => {
    const campaignContainer = document.createElement("a");
    const text = document.createElement("p");
    const circle = document.createElement("div");

    campaignContainer.className = "campaign-container";
    campaignContainer.setAttribute("id", `id-${campaign.id}`);
    campaignContainer.setAttribute(
      "href",
      `product.html?id=${campaign.product_id}`
    );
    circle.className = "circle";
    circle.setAttribute("id", `circle-${campaign.id}`);

    if (index === 0) {
      campaignContainer.classList.add("campaign-active");
      circle.classList.add("circle-active");
    }

    campaignContainer.style.backgroundImage = `url(${campaign.picture})`;
    text.innerHTML = `${campaign.story}`.replaceAll("\r\n", "<br />");
    campaignContainer.append(text);
    campaignDisplay.append(campaignContainer);

    circles.append(circle);
  });

  campaignDisplay.append(circles);
}

function displayNotFound(keyword) {
  const notFound = document.createElement("p");
  notFound.setAttribute("id", "cannot-find");
  notFound.innerText = `搜尋不到與"${keyword}"相關的產品`;
  campaignDisplay.after(notFound);
}

async function getProductListData(category, query = "") {
  let api =
    PRODUCTS_URL + category + `?${query}${query ? "&" : ""}paging=${nextPage}`;
  let response = await fetch(api);
  let data;
  if (response.ok) {
    data = await response.json();
    nextPage = data.next_paging;
    isLoading = false;
  }
  return data;
}

async function getMarketingData(category) {
  let api = MARKETING_URL + category;
  let response = await fetch(api);
  let data;
  if (response.ok) {
    data = await response.json();
  }
  return data;
}

function scrollForNextPage(category, query = "") {
  window.addEventListener("scroll", () => {
    if (!isLoading) {
      if (
        productContainer.getBoundingClientRect().bottom < window.innerHeight
      ) {
        if (nextPage !== undefined) {
          getProductListData(category, query).then((products) =>
            renderProducts(products.data)
          );
          isLoading = true;
        }
      }
    }
  });
}

function loadSlidingCampaign() {
  getMarketingData("campaigns").then((campaigns) => {
    renderCampaign(campaigns.data);

    const ids = Array.from(campaigns.data).map((campaign) =>
      campaign.id.toString()
    );

    let index = 1;
    setInterval(() => {
      if (!sliderOnPause) {
        loadSpecificCampaign(ids[index]);
        index = index === ids.length - 1 ? 0 : index + 1;
      }
    }, 5000);
  });
}

function loadSpecificCampaign(id) {
  const campaigns = document.querySelectorAll(".campaign-container");
  const dots = document.querySelectorAll(".circle");

  const ids = Array.from(campaigns).map((campaign) =>
    campaign.getAttribute("id").slice(3)
  );
  const index = ids.findIndex((campaignId) => campaignId === id);

  const toggleState = (elements, state) => {
    elements.forEach((element, i) => {
      if (element.matches(`.${state}`)) {
        element.classList.toggle(state);
      }
      if (i === index) {
        element.classList.toggle(state);
      }
    });
  };
  toggleState(campaigns, "campaign-active");
  toggleState(dots, "circle-active");
}

function loadSearchResults(keyword) {
  window.history.replaceState({}, "", `index.html?tag=${keyword}`);
  searchInput.value = keyword;
  nextPage = 0;
  productContainer.innerHTML = "";

  if (document.querySelector("#cannot-find")) {
    document.querySelector("#cannot-find").remove();
  }

  if (keyword === "") {
    loadProductPages("all");
  } else {
    getProductListData("search", `keyword=${keyword}`).then((result) => {
      if (result.data.length === 0) {
        displayNotFound(keyword);
      } else {
        renderProducts(result.data);
      }
    });
    scrollForNextPage("search", `keyword=${keyword}`);
  }
}

function loadProductPages(category, query = "") {
  getProductListData(category, query).then((products) => {
    renderProducts(products.data);
  });
  scrollForNextPage(category, query);
}

function loadCategoryProducts(URLParams) {
  const category = URLParams.get("tag");
  loadProductPages(category);
}

function loadHomePage(URLParams) {
  loadSlidingCampaign();
  displayCartQuantity();
  if (URLParams.has("tag")) {
    loadCategoryProducts(URLParams);
  } else {
    loadProductPages("all");
  }
}

/*============ Execution ============*/

window.addEventListener("DOMContentLoaded", () => {
  loadHomePage(URLParams);
});

searchBar.addEventListener("click", (event) => {
  if (event.target.matches(".search-icon")) {
    searchForm.classList.toggle("hide-content");
  }
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const searchValue = searchInput.value.trim();
  if (!isLoading) {
    loadSearchResults(searchValue);
    isLoading = true;
  }
});

campaignDisplay.addEventListener("click", (event) => {
  if (event.target.matches(".circle")) {
    sliderOnPause = true;
    const id = event.target.getAttribute("id").slice(7);
    loadSpecificCampaign(id);
    setTimeout(() => (sliderOnPause = false), 5000);
  }
});

campaignDisplay.addEventListener("mouseover", (event) => {
  if (event.target.matches(".campaign-container")) {
    sliderOnPause = true;
  }
});

campaignDisplay.addEventListener("mouseout", (event) => {
  if (event.target.matches(".campaign-container")) {
    sliderOnPause = false;
  }
});

fb.initFbSettings();
fb.memberBtn.addEventListener("click", () => fb.loginFB());
