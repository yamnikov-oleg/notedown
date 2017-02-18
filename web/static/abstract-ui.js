var SelectableNotesList = function(data) {
  this.list = new NotesList(data);
  this.selected = null;

  this.saveDebounced = _.debounce((function () {
    this.save();
  }).bind(this), 500);
}

SelectableNotesList.prototype.hasSelected = function () {
  return !!this.selected;
};

SelectableNotesList.prototype.deselect = function () {
  if (this.hasSelected() && this.selected.isNew() && this.selected.isEmpty()) {
    this.list.delete(this.selected);
  }

  this.save();
  this.selected = null;
};

SelectableNotesList.prototype.select = function (note) {
  this.save();
  this.selected = note;
};

SelectableNotesList.prototype.isSelected = function (note) {
  return this.hasSelected() && this.selected.is(note);
};

SelectableNotesList.prototype.new = function () {
  if (this.hasSelected() && this.selected.isNew() && this.selected.isEmpty()) {
    return this.selected;
  }

  var first = this.list.get(0);
  if (first.isEmpty()) {
    this.select(first);
    return first;
  }

  this.select(this.list.new());
  return this.selected;
};

SelectableNotesList.prototype.save = function () {
  if (!this.hasSelected()) return;
  if (this.selected.isNew() && this.selected.isEmpty()) return;
  this.selected.save();
};

SelectableNotesList.prototype.reset = function (data) {
  this.list = new NotesList(data);

  this.list.each(function (note) {
    if (note.is(this.selected)) {
      this.select(note);
      return true;
    }
  });

  if (this.hasSelected() && this.selected.isNew()) {
    this.select(this.list.new(_this.editedNote));
  }
};

SelectableNotesList.prototype.remove = function (note) {
  this.list.delete(note);
  if (this.selected.is(note)) this.deselect();
};

SelectableNotesList.prototype.asArray = function () {
  return this.list.asArray();
};
