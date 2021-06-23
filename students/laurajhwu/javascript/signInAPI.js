class SignInAPI {
  constructor(accessToken) {
    this.HOST_URL = "https://api.appworks-school.tw";
    this.BASE_URL = this.HOST_URL + "/api/1.0";
    this.USER_URL = this.BASE_URL + "/user/signin";
    this.data = {
      provider: "facebook",
      access_token: accessToken,
    };
  }
  async fetchSignInAPI() {
    return await fetch(this.USER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.data),
    }).then((response) => response.json());
  }
}

export default SignInAPI;
