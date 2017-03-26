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
      credentials: 'same-origin',
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
        status = 0;
        return { message: error.toString() };
      })
      .then(function (json) {
        if (status >= 200 && status <= 299) {
          successWrapped(json);
        } else {
          failWrapped(status, json && json.message);
        }
      }, function (error) {
        failWrapped(status, error.toString());
      });
  }

  return {
    _call: call,
    notes: {
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
    },

    account: {
      index: function (success, fail) {
        call('GET', '/api/v1/account', null, success, fail);
      },
      login: function (username, password, success, fail) {
        call('POST', '/api/v1/account/login',
             { username: username, password: password },
             success, fail);
      },
      logout: function (success, fail) {
        call('POST', '/api/v1/account/logout', success, fail);
      },
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
  this.rendered = fields.rendered;
  this.isBeingSaved = false;
  this.isBeingDeleted = false;

  if (fields.creation_time) {
    this.creation_time = new Date(fields.creation_time);
  }

  if (fields.update_time) {
    this.update_time = new Date(fields.update_time);
  }
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

Note.prototype.save = function (opts) {
  if (!opts) opts = {}
  if (!opts.rerender) opts.rerender = true;

  if (this.isBeingSaved || this.isBeingDeleted) return;
  this.isBeingSaved = true;

  if (this.isNew()) {
    var _this = this;
    NotedownAPI.notes.create(this, function (json) {
      _this.id = json.id;
      if (opts.rerender) _this.rendered = json.rendered;
      if (json.creation_time) _this.creation_time = new Date(json.creation_time);
      if (json.update_time) _this.update_time = new Date(json.update_time);
      _this.isBeingSaved = false;
    }, function (code, msg) {
      console.log("Error creating note: " + code + " - " + msg);
      _this.isBeingSaved = false;
    });
  } else {
    var _this = this;
    NotedownAPI.notes.update(this, function (json) {
      if (opts.rerender) _this.rendered = json.rendered;
      if (json.update_time) _this.update_time = new Date(json.update_time);
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
  NotedownAPI.notes.delete(this, function (json) {
    _this.id = null;
    _this.isBeingDeleted = false;
  }, function (code, msg) {
    console.log("Error deleting note " + _this.id + ": " + code + " - " + msg);
    _this.isBeingDeleted = false;
  });
}

Note.prototype.setCheckbox = function (ind, check) {
  var getCheckboxes = function (text) {
    var index = text.search(/\[(x| )\]/g)
    if (index < 0) return []

    var otherIndices = getCheckboxes(text.slice(index + 1));
    otherIndices = otherIndices.map(function (i) {
      return i + index + 1
    });
    otherIndices.unshift(index);
    return otherIndices;
  }

  var charIndex = getCheckboxes(this.text)[ind];
  var text = this.text;
  var newText = text.slice(0, charIndex) + '[' + (check ? 'x' : ' ') + ']' + text.slice(charIndex+3)
  this.text = newText;
};

Note.firstTagSlice = function (rendered) {
  var openTagRe = /^<(\w+)([^>]*)>/;
  var openTagMatch = openTagRe.exec(rendered);

  if (!openTagMatch) {
    return null;
  }

  var tag = openTagMatch[1];

  var closeTagRe = new RegExp("</" + tag + ">");
  var closeTagMatch = closeTagRe.exec(rendered);

  var closeIndex;
  if (closeTagMatch) {
    closeIndex = closeTagMatch.index + closeTagMatch[0].length;
  } else {
    closeIndex = rendered.length;
  }

  return { start: 0, end: closeIndex };
};

Note.prototype.splitByBlocks = function () {
  if (!this.rendered) return [];

  var tagSubstrings = [];
  var rendered = this.rendered.trim();
  while (rendered.length > 0) {
    var tagSlice = Note.firstTagSlice(rendered);
    if (!tagSlice) {
      tagSubstrings.push(rendered);
      break;
    }

    var tagsub = rendered.slice(tagSlice.start, tagSlice.end);
    tagSubstrings.push(tagsub);

    rendered = rendered.slice(tagSlice.end).trim();
  }

  return tagSubstrings;
}

Note.removeTags = function (s) {
  return s.replace(/<[^>]+>/g, "");
}

Note.unescapeHtml = function (s) {
  // Thanks to CMS stackoverflow user for this treak:
  // http://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
  var e = document.createElement('div');
  e.innerHTML = s;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

Note.prototype.title = function () {
  var tags = this.splitByBlocks();
  if (tags.length == 0) return "";
  return Note.unescapeHtml(Note.removeTags(tags[0]));
};

Note.prototype.bodyPreview = function () {
  var tags = this.splitByBlocks();
  if (tags.length < 2) return "";

  var bodyWithTags = tags.slice(1).join("\n");
  // Special case: <li> is nested inside <ul> or <ol> therefore its content
  // wouldn't be broken into lines with `join` above.
  bodyWithTags = bodyWithTags.replace("</li>", "\n");

  return Note.unescapeHtml(Note.removeTags(bodyWithTags));
};

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
