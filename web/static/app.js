var NotedownAPI = (function () {
  // Performs ajax request to the given api.
  // * method -  string;
  // * url -     string;
  // * data -    object (map), optional;
  // * success - function(json),
  //             where json is an object.
  // * fail -    function(statusCode, msg),
  //             statusCode is a number and
  //             msg is a string or null.
  function call(method, url, data, success, fail) {
    var successWrapped = function (json) {
      if (success) success(json);
    }
    var failWrapped = function (code, msg) {
      if (fail) fail(code, msg);
    }

    var options = {
      method: method,
    }

    if (data) {
      var formData = new FormData();
      _.each(data, function (value, key) {
        formData.append(key, value);
      });
      options.body = formData;
    }

    var status;
    fetch(url, options)
      .then(function (response) {
        status = response.status;
        return response.json();
      }, function (error) {
        failWrapped(0, error.toString());
      })
      .then(function (json) {
        if (status >= 200 && status <= 299) {
          successWrapped(json);
        } else {
          failWrapped(status, json.message);
        }
      }, function (error) {
        failWrapped(status, error.toString());
      });
  }

  return {
    _call: call,
    index: function (success, fail) {
      call('GET', '/api/v1/notes', null, function (json) {
        success(new NotesList(json));
      }, fail);
    },
    create: function (note, success, fail) {
      call('POST', '/api/v1/notes/create', { text: note.text }, success, fail);
    },
    update: function (note, success, fail) {
      call('POST', '/api/v1/notes/update', { id: note.id, text: note.text }, success, fail);
    },
    delete: function (note, success, fail) {
      call('POST', '/api/v1/notes/delete', { id: note.id }, success, fail);
    },
  };
})();

var Note = function (fields) {
  if (!fields) {
    fields = {
      id: null,
      text: "",
    }
  }

  this.id = fields.id;
  this.text = fields.text;
  this.isBeingSaved = false;
  this.isBeingDeleted = false;
}

Note.prototype.is = function (other) {
  if (!other) return false;
  if (this == other) return true;
  if (this.isNew() || other.isNew()) return false;
  if (this.id == other.id) return true;
  return false;
}

Note.prototype.isNew = function () {
  // undefined id means note was never saved
  return !this.id;
};

Note.prototype.isEmpty = function () {
  // undefined id means note was never saved
  return this.text.trim() == "";
};

Note.prototype.save = function () {
  if (this.isBeingSaved || this.isBeingDeleted) return;
  this.isBeingSaved = true;

  if (this.isNew()) {
    var _this = this;
    NotedownAPI.create(this, function (json) {
      _this.id = json.id;
      _this.isBeingSaved = false;
    }, function (code, msg) {
      console.log("Error creating note: " + code + " - " + msg);
      _this.isBeingSaved = false;
    });
  } else {
    var _this = this;
    NotedownAPI.update(this, function (json) {
      _this.isBeingSaved = false;
    }, function (code, msg) {
      console.log("Error updating note " + _this.id + ": " + code + " - " + msg);
      _this.isBeingSaved = false;
    });
  }
};

Note.prototype.delete = function () {
  if (this.isBeingDeleted) return;
  this.isBeingDeleted = true;

  if (this.isNew()) return;

  var _this = this;
  NotedownAPI.delete(this, function (json) {
    this.id = null;
    this.isBeingDeleted = false;
  }, function (code, msg) {
    console.log("Error deleting note " + _this.id + ": " + code + " - " + msg);
    this.isBeingDeleted = false;
  });
}

var NotesList = function (raw) {
  if (!raw) raw = [];

  this._notes = [];
  for (i in raw) {
    this._notes.push(new Note(raw[i]));
  }
}

NotesList.prototype.get = function (i) {
  return this._notes[i];
}

NotesList.prototype.deleteAt = function (i) {
  this._notes[i].delete();
  this._notes.splice(i, 1);
}

NotesList.prototype.delete = function (note) {
  var ind = this._notes.indexOf(note);
  if (ind >= 0) this.deleteAt(ind);
  else note.delete();
}

NotesList.prototype.unshift = function (note) {
  this._notes.unshift(note);
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

Vue.component('note-item', {
  props: ['note', 'selected'],
  template: '#note-item',
});

new Vue({
  el: '#app',
  data: {
    notes: new NotesList(),
    editedNote: null,
  },

  mounted: function () {
    this.refresh();
  },

  methods: {

    noteSelected: function () {
      return !!this.editedNote;
    },

    closeEdited: function () {
      if (!this.noteSelected()) return;
      if (this.editedNote.isNew() && this.editedNote.isEmpty()) {
        this.remove(this.editedNote);
      }
      this.save();
      this.selectNone();
    },

    selectNone: function () {
      this.editedNote = null;
    },

    select: function (note) {
      this.save();
      this.editedNote = note;
    },

    isSelected: function (note) {
      return this.noteSelected() && this.editedNote.is(note);
    },

    newNote: function () {
      if (this.noteSelected() && this.editedNote.isNew() && this.editedNote.isEmpty()) {
        return;
      }

      if (this.notes.get(0).isEmpty()) {
        this.select(this.notes.get(0));
        return;
      }

      this.save();
      this.editedNote = new Note();
      this.notes.unshift(this.editedNote);
    },

    save: function () {
      if (!this.noteSelected()) return;
      if (this.editedNote.isNew() && this.editedNote.isEmpty()) return;
      this.editedNote.save();
    },

    saveDebounced: _.debounce(function () { this.save(); }, 500),

    refresh: function () {
      var _this = this;
      NotedownAPI.index(function (notes) {
        _this.notes = notes;

        _this.notes.each(function (note) {
          if (note.is(this.editedNote)) {
            _this.editedNote = note;
            return true;
          }
        });

        if (_this.noteSelected() && _this.editedNote.isNew()) {
          _this.notes.unshift(_this.editedNote);
        }
      }, function (code, msg) {
        console.error("Error loading notes: " + code + " - " + msg);
      });
    },

    remove: function (note) {
      this.notes.delete(note);
      if (this.editedNote == note) this.selectNone();
    },

  },
});
