Vue.component('login-form', {
  template: '#login-form-template',
  data: function () {
    return {
      username: "",
      password: "",
      errorMessage: null,
    }
  },

  methods: {

    submit: function () {
      var _this = this;
      Account.login(this.username, this.password, function (account) {
        _this.$emit('login', account);
      }, function () {
        _this.errorMessage = "Could not log in with these credentials";
      }, function (code, msg) {
        _this.errorMessage = "Network error occured";
        console.log("Error logging-in: ", code, msg);
      });
    },

  },
});
