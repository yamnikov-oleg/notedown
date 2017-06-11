new Vue({
  el: '#app',
  data: {
    loggedIn: undefined,
    account: null,
  },

  mounted: function () {
    var _this = this;
    Account.getOrNull(function (account) {
      _this.account = account;
      _this.loggedIn = !!account;
    }, function (code, msg) {
      console.log("Error fetching account: " + code + " " + msg);
    });
  },

  methods: {

    login: function (account) {
      this.loggedIn = true;
      this.account = account;
    },

    logout: function () {
      if (!confirm("Log out?")) return;

      Account.logout();
      this.loggedIn = false;
      this.account = null;
    },

  },
});
