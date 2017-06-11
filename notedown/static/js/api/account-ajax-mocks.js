var AccountMockAPI = function (accountData, password, loggedIn) {
  this.accountData = accountData;
  this.password = password;
  this.loggedIn = !!loggedIn;
}

AccountMockAPI.prototype.index = function (success, fail) {
  if (this.loggedIn) {
    success({ account: _.clone(this.accountData) });
  } else {
    success({ account: null });
  }
}

AccountMockAPI.prototype.login = function (username, password, success, fail) {
  if (username == this.accountData.username && password == this.password) {
    this.loggedIn = true;
    success({ account: _.clone(this.accountData) });
  } else {
    fail(403);
  }
}

AccountMockAPI.prototype.logout = function (success, fail) {
  this.loggedIn = false;
  success({ account: null });
}

var AccountFailAPI = function (code, msg) {
  this.code = code;
  this.msg = msg;
}

AccountFailAPI.prototype.fail = function (callback) {
  callback(this.code, this.msg);
}

AccountFailAPI.prototype.index = function (_, fail) { this.fail(fail); }
AccountFailAPI.prototype.login = function (_, _, _, fail) { this.fail(fail); }
AccountFailAPI.prototype.logout = function (_, fail) { this.fail(fail); }
