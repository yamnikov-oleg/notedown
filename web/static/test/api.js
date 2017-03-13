var NotesMockAPI = function (data) {
  this.data = data || [];
}

NotesMockAPI.prototype.index = function (success, fail) {
  success(_.clone(this.data));
};

NotesMockAPI.prototype.create = function (note, success, fail) {
  note = _.clone(note);
  this.data.push(note);
  note.id = this.data.length;
  success({ id: note.id, text: note.text, rendered: note.text });
};

NotesMockAPI.prototype.update = function (note, success, fail) {
  var updated = false;
  for (var i in this.data) {
    if (this.data[i].id == note.id) {
      this.data[i] = _.clone(note);
      updated = true;
      break;
    }
  }
  if (!updated) throw new Error("Attempt to update non-existant note " + note.id);
  success({ id: note.id, text: note.text, rendered: note.text });
};

NotesMockAPI.prototype.delete = function (note, success, fail) {
  var ind = -1;
  for (var i in this.data) {
    if (this.data[i].id == note.id) {
      ind = i;
    }
  }

  if (ind >= 0) this.data.splice(i, 1);
  else throw new Error("Attempt to delete non-existant note " + note.id);

  success({ message: "ok" });
};

var NotesFailAPI = function (code, msg) {
  this.code = code;
  this.msg = msg;
}

NotesFailAPI.prototype.fail = function (callback) {
  callback(this.code, this.msg);
}

NotesFailAPI.prototype.index = function (_, fail) { this.fail(fail); }
NotesFailAPI.prototype.create = function (_, _, fail) { this.fail(fail); }
NotesFailAPI.prototype.update = function (_, _, fail) { this.fail(fail); }
NotesFailAPI.prototype.delete = function (_, _, fail) { this.fail(fail); }

describe('Note', function () {

  describe('#save()', function () {

    it("should update existing note via API", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = { notes: new NotesMockAPI([ noteData ]) };

      note.text = "456";
      note.save();

      assert.equal(note.text, window.NotedownAPI.notes.data[0].text);
    });

    it("should create new note via API", function () {
      var noteData = { text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = { notes: new NotesMockAPI() };

      note.save();

      assert.equal(note.text, window.NotedownAPI.notes.data[0].text);
      assert.equal(note.id, 1);
    });

    it("should not fail to recreate if API fails", function () {
      var noteData = { text: "123" };
      var note = new Note(noteData);

      window.NotedownAPI = { notes: new NotesFailAPI(500, "Test-Provoked Error") };
      note.save();

      window.NotedownAPI = { notes: new NotesMockAPI() };
      note.save();

      assert.equal(note.text, window.NotedownAPI.notes.data[0].text);
      assert.equal(note.id, 1);
    });

    it("should not fail to reupdate if API fails", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);

      window.NotedownAPI = { notes: new NotesFailAPI(500, "Test-Provoked Error") };
      note.text = "456";
      note.save();

      window.NotedownAPI = { notes: new NotesMockAPI([ noteData ]) };
      note.save();

      assert.equal(note.text, window.NotedownAPI.notes.data[0].text);
    });

  });

  describe("#delete()", function () {

    it("should delete note via API", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = { notes: new NotesMockAPI([ noteData ]) };

      note.delete();

      assert.lengthOf(window.NotedownAPI.notes.data, 0);
    });

    it("should not fail to redelete if API fails", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);

      window.NotedownAPI = { notes: new NotesFailAPI(500, "Test-Provoked Error") };
      note.delete();

      window.NotedownAPI = { notes: new NotesMockAPI([ noteData ]) };
      note.delete();

      assert.lengthOf(window.NotedownAPI.notes.data, 0);
    });

  });

  describe("#setCheckbox(ind, check)", function () {

    it("should check a checkbox", function () {
      var note = new Note({ text: "hello [ ] world [x][ ]" });

      note.setCheckbox(0, true);
      note.setCheckbox(1, true);
      note.setCheckbox(2, true);

      assert.equal(note.text, "hello [x] world [x][x]");
    });

    it("should uncheck a checkbox", function () {
      var note = new Note({ text: "hello [ ] world [x][ ]" });

      note.setCheckbox(0, false);
      note.setCheckbox(1, false);
      note.setCheckbox(2, false);

      assert.equal(note.text, "hello [ ] world [ ][ ]");
    });

  });

});

describe("NotesList", function () {

  describe("#new()", function () {

    it("should add empty note to the beginning of the list", function () {
      var list = new NotesList();

      var note = list.new();

      assert.equal(list.length(), 1);
      assert.equal(list.get(0), note);
    });

    it("should add filled note to the beginning of the list", function () {
      var list = new NotesList();

      var note = list.new({ text: "test" });

      assert.equal(list.length(), 1);
      assert.equal(list.get(0), note);
      assert.equal(note.text, "test");
    });

  });

  describe("#refresh()", function () {

    it("should load notes from API", function () {
      var noteData1 = { id: 1, text: "123" };
      var noteData2 = { id: 2, text: "123" };
      var list = new NotesList();
      window.NotedownAPI = { notes: new NotesMockAPI([ noteData1, noteData2 ]) };

      list.refresh();

      assert.equal(list.length(), 2);
      assert.equal(list.get(0).id, noteData1.id);
      assert.equal(list.get(0).text, noteData1.text);
      assert.equal(list.get(1).id, noteData2.id);
      assert.equal(list.get(1).text, noteData2.text);
    });

  });

  describe("#delete(note)", function () {

    it("should delete exact note from API", function () {
      var noteData = { id: 1, text: "123" };
      var list = new NotesList([ noteData ]);
      window.NotedownAPI = { notes: new NotesMockAPI([ noteData ]) };

      list.delete(list.get(0));

      assert.equal(list.length(), 0);
      assert.lengthOf(window.NotedownAPI.notes.data, 0);
    });

    it("should delete note with same id from API", function () {
      var noteData = { id: 1, text: "123" };
      var list = new NotesList([ noteData ]);
      window.NotedownAPI = { notes: new NotesMockAPI([ noteData ]) };

      list.delete(new Note(noteData));

      assert.equal(list.length(), 0);
      assert.lengthOf(window.NotedownAPI.notes.data, 0);
    });

    it("should remove new (unsaved) not from itself", function () {
      var noteData = { text: "123" };
      var list = new NotesList([ noteData ]);
      window.NotedownAPI = { notes: new NotesMockAPI() };

      list.delete(list.get(0));

      assert.equal(list.length(), 0);
    });

  });

});

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
