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
  note.creation_time = new Date().toISOString();
  note.update_time = new Date().toISOString();

  success({
    id: note.id,
    text: note.text,
    rendered: note.text,
    creation_time: note.creation_time,
    update_time: note.update_time,
  });
};

NotesMockAPI.prototype.update = function (note, success, fail) {
  var updated = null;
  for (var i in this.data) {
    if (this.data[i].id == note.id) {
      updated = this.data[i];
      updated.text = note.text;
      updated.update_time = new Date();
      break;
    }
  }

  if (!updated) throw new Error("Attempt to update non-existant note " + note.id);

  success({
    id: updated.id,
    text: updated.text,
    rendered: updated.text,
    update_time: updated.update_time,
  });
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

  describe('constructor(data)', function () {

    it("should parse creation_time field if it's provided", function () {
      var noteData = { id: 1, text: "123", creation_time: "2017-03-26T11:38:00+00:00" };

      var note = new Note(noteData);

      assert.instanceOf(note.creation_time, Date);
      assert.equal(note.creation_time.getUTCFullYear(), 2017);
      assert.equal(note.creation_time.getUTCMonth(), 2);
      assert.equal(note.creation_time.getUTCDate(), 26);
      assert.equal(note.creation_time.getUTCHours(), 11);
      assert.equal(note.creation_time.getUTCMinutes(), 38);
      assert.equal(note.creation_time.getUTCSeconds(), 00);
    });

    it("should parse update_time field if it's provided", function () {
      var noteData = { id: 1, text: "123", update_time: "2017-03-26T11:38:00+00:00" };

      var note = new Note(noteData);

      assert.instanceOf(note.update_time, Date);
      assert.equal(note.update_time.getUTCFullYear(), 2017);
      assert.equal(note.update_time.getUTCMonth(), 2);
      assert.equal(note.update_time.getUTCDate(), 26);
      assert.equal(note.update_time.getUTCHours(), 11);
      assert.equal(note.update_time.getUTCMinutes(), 38);
      assert.equal(note.update_time.getUTCSeconds(), 00);
    });

  });

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

    it("should set timestamps with server response on creating", function () {
      var noteData = { text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = { notes: new NotesMockAPI() };

      note.save();

      var serverNote = window.NotedownAPI.notes.data[0];
      assert.instanceOf(note.creation_time, Date);
      assert.equal(note.creation_time.getTime(), new Date(serverNote.creation_time).getTime());

      assert.instanceOf(note.update_time, Date);
      assert.equal(note.update_time.getTime(), new Date(serverNote.update_time).getTime());
    });

    it("should set update_time field with server response on updating", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = { notes: new NotesMockAPI([ noteData ]) };

      note.text = "456";
      note.save();

      var serverNote = window.NotedownAPI.notes.data[0];
      assert.instanceOf(note.update_time, Date);
      assert.equal(note.update_time.getTime(), new Date(serverNote.update_time).getTime());
    });

    it("should set isBeingSaved flag while saving and reset it after success", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      var successCallback;
      window.NotedownAPI.notes.update = function (note, success, failure) {
        successCallback = success;
      };

      assert.equal(note.isBeingSaved, false);

      note.text = "456";
      note.save();
      assert.equal(note.isBeingSaved, true);

      successCallback({ id: 1, text: "123" });
      assert.equal(note.isBeingSaved, false);
    });

    it("should set isBeingSaved flag while saving and reset it after failure", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      var failureCallback;
      window.NotedownAPI.notes.update = function (note, success, failure) {
        failureCallback = failure;
      };

      assert.equal(note.isBeingSaved, false);

      note.text = "456";
      note.save();
      assert.equal(note.isBeingSaved, true);

      failureCallback(500, "Test-induced error");
      assert.equal(note.isBeingSaved, false);
    });

    it("should set saveError field on error", function() {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = { notes: new NotesFailAPI(333, "Test-induced error") };

      assert.isNotOk(note.saveError);

      note.text = "456";
      note.save();
      assert.isObject(note.saveError);
      assert.equal(note.saveError.code, 333);
      assert.equal(note.saveError.msg, "Test-induced error");
    });

    it("should reset saveError after successful save", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      note.saveError = { code: 333, msg: "Test-induced error" };
      window.NotedownAPI = { notes: new NotesMockAPI([noteData]) };

      note.text = "456";
      note.save();

      assert.isNotOk(note.saveError);
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

  describe("#title()", function () {

    it("should return contents of first rendered block", function () {
      var note = new Note({
        text: "# Hello world!\nA paragraph\n",
        rendered: "<h1>Hello world!</h1><p>A paragraph</p>"
      });

      var title = note.title();

      assert.equal(title, "Hello world!");
    });

    it("should unescape html escape sequences", function () {
      var note = new Note({
        text: "# Hello<> \"world\"!\nA paragraph\n",
        rendered: "<h1>Hello&lt;&gt; &quot;world&quot;!</h1><p>A paragraph</p>"
      });

      var title = note.title();

      assert.equal(title, "Hello<> \"world\"!");
    });

    it("should return empty string if note is not rendered", function () {
      var note = new Note({
        text: "# Hello world!\nA paragraph\n",
      });

      var title = note.title();

      assert.equal(title, "");
    });

  });

  describe("#bodyPreview()", function () {

    it("should return text contents of note's body", function () {
      var note = new Note({
        text: "# Hello world!\nA paragraph\n\n* Item 1\n* Item2\n",
        rendered: "<h1>Hello world!</h1><p>A paragraph</p><ul><li>Item 1</li><li>Item 2</li></ul>"
      });

      var bodyPreview = note.bodyPreview();

      assert.equal(bodyPreview, "A paragraph\nItem 1\nItem 2");
    });

    it("should unescape html escape sequences", function () {
      var note = new Note({
        text: "# Hello world!\nA<> \"paragraph\"\n",
        rendered: "<h1>Hello world!</h1><p>A&lt;&gt; &quot;paragraph&quot;</p>"
      });

      var bodyPreview = note.bodyPreview();

      assert.equal(bodyPreview, "A<> \"paragraph\"");
    });

    it("should return empty string if note is not rendered", function () {
      var note = new Note({
        text: "# Hello world!\nA paragraph\n",
      });

      var bodyPreview = note.bodyPreview();

      assert.equal(bodyPreview, "");
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

    it("should set creation_time and update_time fields if not data is provided", function () {
      var list = new NotesList();

      var note = list.new();

      var now = new Date();
      assert.instanceOf(note.creation_time, Date);
      assert.isBelow(now - note.creation_time, 1000);
      assert.instanceOf(note.update_time, Date)
      assert.isBelow(now - note.update_time, 1000);
    });

    it("should set creation_time and update_time fields if data is provided", function () {
      var list = new NotesList();

      var note = list.new({ text: "test" });

      var now = new Date();
      assert.instanceOf(note.creation_time, Date);
      assert.isBelow(now - note.creation_time, 1000);
      assert.instanceOf(note.update_time, Date)
      assert.isBelow(now - note.update_time, 1000);
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

  describe("#sortedByUpdateTime()", function () {

    it("should return a list of notes sorted by update_time in desc order", function () {
      var list = new NotesList([
        { id: 1, update_time: new Date(2017, 2, 26, 17, 23) },
        { id: 2, update_time: new Date(2017, 2, 26, 17, 22) },
        { id: 3, update_time: new Date(2017, 2, 26, 17, 24) },
      ]);

      var sorted = list.sortedByUpdateTime();

      assert.lengthOf(sorted, 3);
      sorted.forEach(function (n) { assert.instanceOf(n, Note) });
      assert.equal(sorted[0].id, 3);
      assert.equal(sorted[1].id, 1);
      assert.equal(sorted[2].id, 2);
    });

    it("should not touch underlying array", function () {
      var list = new NotesList([
        { id: 1, update_time: new Date(2017, 2, 26, 17, 23) },
        { id: 2, update_time: new Date(2017, 2, 26, 17, 22) },
        { id: 3, update_time: new Date(2017, 2, 26, 17, 24) },
      ]);

      list.sortedByUpdateTime();

      assert.lengthOf(list._notes, 3);
      assert.equal(list._notes[0].id, 1);
      assert.equal(list._notes[1].id, 2);
      assert.equal(list._notes[2].id, 3);
    });

    it("should order by creation_time if update_time's are equal", function () {
      var list = new NotesList([
        { id: 1, update_time: new Date(2017, 2, 26, 17, 24), creation_time: new Date(2017, 2, 26, 17, 23) },
        { id: 2, update_time: new Date(2017, 2, 26, 17, 24), creation_time: new Date(2017, 2, 26, 17, 22) },
        { id: 3, update_time: new Date(2017, 2, 26, 17, 24), creation_time: new Date(2017, 2, 26, 17, 24) },
      ]);

      var sorted = list.sortedByUpdateTime();

      assert.lengthOf(sorted, 3);
      sorted.forEach(function (n) { assert.instanceOf(n, Note) });
      assert.equal(sorted[0].id, 3);
      assert.equal(sorted[1].id, 1);
      assert.equal(sorted[2].id, 2);
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
