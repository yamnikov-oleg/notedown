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
