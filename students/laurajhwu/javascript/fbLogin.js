const memberBtn = document.querySelector(".member-info");

function initFbSettings() {
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
}

function loginFB() {
  // eslint-disable-next-line no-undef
  FB.getLoginStatus((response) => {
    if (response.status === "connected") {
      window.location.href = "profile.html";
    } else {
      // eslint-disable-next-line no-undef
      FB.login(
        (response) => {
          if (response.status === "connected") {
            alert("您已登入！");
          }
        },
        { scope: "public_profile,email", auth_type: "reauthenticate" }
      );
    }
  });
}

export default { memberBtn, loginFB, initFbSettings };
