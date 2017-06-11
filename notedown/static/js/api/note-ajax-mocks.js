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
