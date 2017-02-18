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
      this.editedNote = this.notes.new();
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
          _this.editedNote = _this.notes.new(_this.editedNote);
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
