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
      call('GET', '/api/v1/notes', null, success, fail);
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
    _this.id = null;
    _this.isBeingDeleted = false;
  }, function (code, msg) {
    console.log("Error deleting note " + _this.id + ": " + code + " - " + msg);
    _this.isBeingDeleted = false;
  });
}

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
