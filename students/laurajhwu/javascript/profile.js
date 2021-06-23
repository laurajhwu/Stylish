import fb from "./fbLogin.js";
import displayCartQuantity from "./cartQuantity.js";
import SignInAPI from "./signInAPI.js";

const logoutBtn = document.querySelector("#logout");

function renderProfilePage(accessToken) {
  const signInAPI = new SignInAPI(accessToken);

  signInAPI
    .fetchSignInAPI()
    .then((data) => {
      const userData = data.data.user;
      const memberInfo = document.querySelector("#profile");

      memberInfo.innerHTML = `
        <img
          src="${userData.picture}"
          alt="profile picture"
        />
        <section class="member-details">
          <div class="name">${userData.name}</div>
          <div class="email">${userData.email}</div>
        </section>
      `;
    })
    .catch((e) => console.log(e));
}

function fbLogout() {
  // eslint-disable-next-line no-undef
  FB.getLoginStatus(function (response) {
    if (response.status === "connected") {
      // eslint-disable-next-line no-undef
      FB.logout(function () {
        alert("您已登出！");
        window.location.href = "index.html";
      });
    }
  });
}

window.fbAsyncInit = function () {
  // eslint-disable-next-line no-undef
  FB.init({
    appId: "291256862512750",
    cookie: true,
    xfbml: true,
    version: "v10.0",
  });
  // eslint-disable-next-line no-undef
  FB.AppEvents.logPageView();

  // eslint-disable-next-line no-undef
  FB.getLoginStatus((response) => {
    if (response.status === "connected") {
      renderProfilePage(response.authResponse.accessToken);
    } else {
      window.location.href = "index.html";
    }
  });
};

(function (d, s, id) {
  var js,
    fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
})(document, "script", "facebook-jssdk");

window.addEventListener("DOMContentLoaded", () => {
  displayCartQuantity();
});

logoutBtn.addEventListener("click", () => {
  fbLogout();
});

fb.memberBtn.addEventListener("click", () => fb.loginFB());
