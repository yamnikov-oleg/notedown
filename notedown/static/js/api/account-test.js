describe("Account", function () {

  describe("#getOrNull(success, fail)", function () {

    it("should get the account if user is logged in", function () {
      var accountData = { username: "test-user" };
      var accountPassword = "123";
      window.NotedownAPI = { account: new AccountMockAPI(accountData, accountPassword, true) };

      var account;
      Account.getOrNull(function (a) {
        account = a;
      });

      assert.isObject(account);
      assert.equal(account.username, accountData.username);
    });

    it("should return null if user is logged out", function () {
      window.NotedownAPI = { account: new AccountMockAPI() };

      var account;
      Account.getOrNull(function (a) {
        account = a;
      });

      assert.isNull(account);
    });

    it("should pass an error if it occurs", function () {
      var CODE = 0;
      var MSG = "Test-Induced Error";
      window.NotedownAPI = { account: new AccountFailAPI(CODE, MSG) };

      var code, msg;
      Account.getOrNull(null, function (c, m) {
        code = c;
        msg = m;
      });

      assert.equal(code, CODE);
      assert.equal(msg, MSG);
    });

  });

  describe("#login(username, password, success, badCreds, fail)", function () {

    it("should log in if credentials are correct", function () {
      var accountData = { username: "test-user" };
      var accountPassword = "123";
      window.NotedownAPI = { account: new AccountMockAPI(accountData, accountPassword, false) };

      var account;
      Account.login("test-user", "123", function (a) {
        account = a;
      });

      assert.isTrue(window.NotedownAPI.account.loggedIn);
      assert.isObject(account);
      assert.equal(account.username, accountData.username);
    });

    it("should call badCreds if credentials are wrong", function () {
      var accountData = { username: "test-user" };
      var accountPassword = "123";
      window.NotedownAPI = { account: new AccountMockAPI(accountData, accountPassword, false) };

      var called = false;
      Account.login("test-user", "1234", null, function () {
        called = true;
      });

      assert.isTrue(called);
    });

    it("should call fail if general error occurs", function () {
      var CODE = 0;
      var MSG = "Test-Induced Error";
      window.NotedownAPI = { account: new AccountFailAPI(CODE, MSG) };

      var code, msg;
      Account.login("test-user", "123", null, null, function (c, m) {
        code = c;
        msg = m;
      });

      assert.equal(code, CODE);
      assert.equal(msg, MSG);
    });

  });

  describe("#logout(success, fail)", function () {

    it("should log out successfuly", function () {
      var accountData = { username: "test-user" };
      var accountPassword = "123";
      window.NotedownAPI = { account: new AccountMockAPI(accountData, accountPassword, true) };

      var called = false;
      Account.logout(function () {
        called = true;
      });

      assert.isFalse(window.NotedownAPI.account.loggedIn);
      assert.isTrue(called);
    });

    it("should pass an error if it occurs", function () {
      var CODE = 0;
      var MSG = "Test-Induced Error";
      window.NotedownAPI = { account: new AccountFailAPI(CODE, MSG) };

      var code, msg;
      Account.logout(null, function (c, m) {
        code = c;
        msg = m;
      });

      assert.equal(code, CODE);
      assert.equal(msg, MSG);
    });

  });

});
