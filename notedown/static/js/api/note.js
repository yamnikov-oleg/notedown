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
      _this.saveError = null;

    }, function (code, msg) {
      console.log("Error creating note: " + code + " - " + msg);
      _this.isBeingSaved = false;
      _this.saveError = { code: code, msg: msg };
    });

  } else {

    var _this = this;
    NotedownAPI.notes.update(this, function (json) {
      if (opts.rerender) _this.rendered = json.rendered;
      if (json.update_time) _this.update_time = new Date(json.update_time);
      _this.isBeingSaved = false;
      _this.saveError = null;

    }, function (code, msg) {
      console.log("Error updating note " + _this.id + ": " + code + " - " + msg);
      _this.isBeingSaved = false;
      _this.saveError = { code: code, msg: msg };
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
