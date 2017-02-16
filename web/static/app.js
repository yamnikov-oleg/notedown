Vue.component('note-item', {
  props: ['note', 'selected'],
  template: '#note-item',
});

new Vue({
  el: '#app',
  data: {
    notes: [],
    selection: "none", // none, new or old
    editedNote: {
      id: null,
      text: "",
    },
  },

  mounted: function () {
    this.refresh();
  },

  methods: {

    refresh: function () {
      var self = this;
      var handleError = function (error) {
        console.error("Error loading notes: " + error);
      }

      fetch("/api/v1/notes")
        .then(function (response) {
          if (response.ok) {
            return response.json()
          } else {
            var error = new Error(response.statusText);
            error.response = response;
            throw error;
          }
        }, handleError)
        .then(function (json) {
          self.notes = json;

          if (self.editingOld()) {
            for (i in self.notes) {
              if (self.notes[i].id == self.editedNote.id) {
                self.editedNote = self.notes[i];
                break;
              }
            }
          }

          if (self.editingNew()) {
            self.notes.unshift(self.editedNote);
          }
        }, handleError);
    },

    noteSelected: function () {
      return this.selection == "new" || this.selection == "old";
    },

    editingNew: function () {
      return this.selection == "new";
    },

    editingOld: function () {
      return this.selection == "old";
    },

    selectNone: function () {
      this.editedNote = null;
      this.selection = "none";
    },

    select: function (note) {
      this.save();
      this.editedNote = note;
      this.selection = "old";
    },

    isSelected: function (note) {
      return this.noteSelected() && this.editedNote.id == note.id;
    },

    newNote: function () {
      if (this.editingNew() && this.editedNote.text.trim() == "") {
        return;
      }

      if (this.notes[0].text == "") {
        this.select(this.notes[0]);
        return;
      }

      this.save();
      this.editedNote = { id: 0, text: "" };
      this.selection = "new";
      this.notes.unshift(this.editedNote);
    },

    save: function () {
      if (this.editingNew()) {
        this.create(this.editedNote);
        this.selection = "old";
      } else if (this.editingOld()) {
        this.update(this.editedNote);
      }
    },

    saveDebounced: _.debounce(function () {
      if (this.editingNew()) {
        this.create(this.editedNote);
      } else if (this.editingOld()) {
        this.update(this.editedNote);
      }
    }, 500),

    deleteEdited: function () {
      if (this.editingOld()) {
        this.delete(this.editedNote);
      }

      var delIndex = this.notes.indexOf(this.editedNote);
      if (delIndex >= 0) this.notes.splice(delIndex, 1);

      this.selectNone();
    },

    update: function (note) {
      var handleError = function (error) {
        console.error("Error updating note " + note.id + ": " + error);
      }

      // Note will not have assigned id, if it's never been saved.
      if (!note.id) {
        return;
      }

      var data = new FormData();
      data.append('id', note.id);
      data.append('text', note.text);

      var statusText;
      fetch('/api/v1/update', {
        method: 'POST',
        body: data,
      })
        .then(function (response) {
          if (!response.ok) {
            statusText = response.statusText;
            return response.json();
          } else {
            return null;
          }
        }, handleError)
        .then(function (json) {
          if (json) {
            handleError(statusText + " - " + json.message);
          }
        }, handleError);
    },

    create: function (note) {
      var handleError = function (error) {
        console.error("Error creating note " + note.id + ": " + error);
      }

      var data = new FormData();
      data.append('text', note.text);

      var failStatusText;
      fetch('/api/v1/create', {
        method: 'POST',
        body: data,
      })
        .then(function (response) {
          if (!response.ok) {
            failStatusText = response.statusText;
          }
          return response.json();
        }, handleError)
        .then(function (json) {
          if (failStatusText) {
            throw new Error(failStatusText + " - " + json.message);
          } else {
            note.id = json.id;
          }
        }, handleError);
    },

    delete: function (note) {
      var handleError = function (error) {
        console.error("Error deleting note " + note.id + ": " + error);
      }

      // Note will not have assigned id, if it's never been saved.
      if (!note.id) {
        return;
      }

      var data = new FormData();
      data.append('id', note.id);

      var failStatusText;
      fetch('/api/v1/delete', {
        method: 'POST',
        body: data,
      })
        .then(function (response) {
          if (!response.ok) {
            failStatusText = response.statusText;
          }
          return response.json();
        }, handleError)
        .then(function (json) {
          if (failStatusText) {
            throw new Error(failStatusText + " - " + json.message);
          }
        }, handleError);
    },

  },
});
