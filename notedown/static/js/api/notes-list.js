var NotesList = function (raw) {
  if (!raw) raw = [];

  this._notes = [];
  for (var i in raw) {
    this._notes.push(new Note(raw[i]));
  }
}

NotesList.prototype.get = function (i) {
  return this._notes[i];
}

NotesList.prototype.length = function () {
  return this._notes.length;
}

NotesList.prototype.refresh = function () {
  var _this = this;
  NotedownAPI.notes.index(function (data) {
    _this._notes = [];
    for (var i in data) {
      _this._notes.push(new Note(data[i]));
    }
  }, function (code, msg) {
    console.error("Error loading notes: " + code + " - " + msg);
  });
}

NotesList.prototype.delete = function (note) {
  var ind = -1;
  for (var i in this._notes) {
    if (this._notes[i].is(note)) {
      ind = i;
      break;
    }
  }
  if (ind >= 0) this._notes.splice(ind, 1);
  note.delete();
}

NotesList.prototype.new = function (opts) {
  var note = new Note(opts);

  note.creation_time = new Date();
  note.update_time = new Date();

  this._notes.unshift(note);
  return note;
}

NotesList.prototype.each = function (f) {
  for (i in this._notes) {
    var break_ = f(this._notes[i], i, this);
    if (break_) break;
  }
}

NotesList.prototype.asArray = function () {
  return this._notes;
}

NotesList.prototype.sortedByUpdateTime = function () {
  var arr = this.asArray().slice();
  arr.sort(function (a, b) {
    var utDiff = a.update_time.getTime() - b.update_time.getTime();
    if (utDiff != 0) return -utDiff;

    var ctDiff = a.creation_time.getTime() - b.creation_time.getTime();
    return -ctDiff;
  });
  return arr;
}
