var Account = function (data) {
  this.username = data.username;
}

Account.getOrNull = function (success, fail) {
  NotedownAPI.account.index(function (data) {
    if (data.account == null) {
      success(null);
    } else {
      success(new Account(data.account));
    }
  }, function (code, msg) {
    if (fail) fail(code, msg);
  });
}

Account.login = function (username, password, success, badCreds, fail) {
  NotedownAPI.account.login(username, password, function (data) {
    if (success) success(new Account(data.account));
  }, function (code, msg) {
    if (code == 403) {
      if (badCreds) badCreds();
    } else {
      if (fail) fail(code, msg);
    }
  });
}

Account.logout = function (success, fail) {
  NotedownAPI.account.logout(function () {
    if (success) success();
  }, function (code, msg) {
    if (fail) fail(code, msg);
  });
}
