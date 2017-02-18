var MockAPI = function (data) {
  this.data = data || [];
}

MockAPI.prototype.index = function (success, fail) {
  success(_.clone(this.data));
};

MockAPI.prototype.create = function (note, success, fail) {
  note = _.clone(note);
  this.data.push(note);
  note.id = this.data.length;
  success({ id: note.id, message: "ok" });
};

MockAPI.prototype.update = function (note, success, fail) {
  var updated = false;
  for (var i in this.data) {
    if (this.data[i].id == note.id) {
      this.data[i] = _.clone(note);
      updated = true;
      break;
    }
  }
  if (!updated) throw new Error("Attempt to update non-existant note " + note.id);
  success({ message: "ok" });
};

MockAPI.prototype.delete = function (note, success, fail) {
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

var FailAPI = function (code, msg) {
  this.code = code;
  this.msg = msg;
}

FailAPI.prototype.fail = function (callback) {
  callback(this.code, this.msg);
}

FailAPI.prototype.index = function (_, fail) { this.fail(fail); }
FailAPI.prototype.create = function (_, _, fail) { this.fail(fail); }
FailAPI.prototype.update = function (_, _, fail) { this.fail(fail); }
FailAPI.prototype.delete = function (_, _, fail) { this.fail(fail); }

describe('Note', function () {

  describe('#save()', function () {

    it("should update existing note via API", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = new MockAPI([ noteData ]);

      note.text = "456";
      note.save();

      assert.equal(note.text, window.NotedownAPI.data[0].text);
    });

    it("should create new note via API", function () {
      var noteData = { text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = new MockAPI();

      note.save();

      assert.equal(note.text, window.NotedownAPI.data[0].text);
      assert.equal(note.id, 1);
    });

    it("should not fail to recreate if API fails", function () {
      var noteData = { text: "123" };
      var note = new Note(noteData);

      window.NotedownAPI = new FailAPI(500, "Test-Provoked Error");
      note.save();

      window.NotedownAPI = new MockAPI();
      note.save();

      assert.equal(note.text, window.NotedownAPI.data[0].text);
      assert.equal(note.id, 1);
    });

    it("should not fail to reupdate if API fails", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);

      window.NotedownAPI = new FailAPI(500, "Test-Provoked Error");
      note.text = "456";
      note.save();

      window.NotedownAPI = new MockAPI([ noteData ]);
      note.save();

      assert.equal(note.text, window.NotedownAPI.data[0].text);
    });

  });

  describe("#delete()", function () {

    it("should delete note via API", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);
      window.NotedownAPI = new MockAPI([ noteData ]);

      note.delete();

      assert.lengthOf(window.NotedownAPI.data, 0);
    });

    it("should not fail to redelete if API fails", function () {
      var noteData = { id: 1, text: "123" };
      var note = new Note(noteData);

      window.NotedownAPI = new FailAPI(500, "Test-Provoked Error");
      note.delete();

      window.NotedownAPI = new MockAPI([ noteData ]);
      note.delete();

      assert.lengthOf(window.NotedownAPI.data, 0);
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

  describe("#delete(note)", function () {

    it("should delete exact note from API", function () {
      var noteData = { id: 1, text: "123" };
      var list = new NotesList([ noteData ]);
      window.NotedownAPI = new MockAPI([ noteData ]);

      list.delete(list.get(0));

      assert.equal(list.length(), 0);
      assert.lengthOf(window.NotedownAPI.data, 0);
    });

    it("should delete note with same id from API", function () {
      var noteData = { id: 1, text: "123" };
      var list = new NotesList([ noteData ]);
      window.NotedownAPI = new MockAPI([ noteData ]);

      list.delete(new Note(noteData));

      assert.equal(list.length(), 0);
      assert.lengthOf(window.NotedownAPI.data, 0);
    });

    it("should remove new (unsaved) not from itself", function () {
      var noteData = { text: "123" };
      var list = new NotesList([ noteData ]);
      window.NotedownAPI = new MockAPI();

      list.delete(list.get(0));

      assert.equal(list.length(), 0);
    });

  });

});
