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
