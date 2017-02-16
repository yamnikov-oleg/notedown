// Performs ajax request to the given api.
// * method -  string;
// * url -     string;
// * data -    object (map), optional;
// * success - function(json),
//             where json is an object.
// * fail -    function(statusCode, msg),
//             statusCode is a number and
//             msg is a string or null.
function callAPI(method, url, data, success, fail) {
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
        this.selection = "old";
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

    refresh: function () {
      var self = this;
      callAPI('GET', '/api/v1/notes', null, function (json) {
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
      }, function (code, msg) {
        console.error("Error loading notes: " + code + " - " + msg);
      });
    },

    create: function (note) {
      callAPI('POST', '/api/v1/create', { text: note.text }, function (json) {
        note.id = json.id;
      }, function (code, msg) {
        console.error("Error creating note: " + code + " - " + msg);
      });
    },

    update: function (note) {
      // Note will not have assigned id, if it's never been saved.
      if (!note.id) {
        return;
      }

      callAPI('POST', '/api/v1/update', { id: note.id, text: note.text }, null,
        function (code, msg) {
          console.error("Error updating note " + note.id + ": " + code + " - " + msg);
        });
    },

    delete: function (note) {
      // Note will not have assigned id, if it's never been saved.
      if (!note.id) {
        return;
      }

      callAPI('POST', '/api/v1/delete', { id: note.id }, null,
        function (code, msg) {
          console.error("Error deleting note " + note.id + ": " + code + " - " + msg);
        });
    },

  },
});
