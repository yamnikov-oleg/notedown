new Vue({
  el: '#app',
  data: {
    notes: new SelectableNotesList(),
  },

  mounted: function () {
    this.refresh();
  },

  methods: {

    refresh: function () {
      var _this = this;
      NotedownAPI.index(function (data) {
        _this.notes.reset(data);
      }, function (code, msg) {
        console.error("Error loading notes: " + code + " - " + msg);
      });
    },

  },
});
