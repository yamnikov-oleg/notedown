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
      NotedownAPI.notes.index(function (data) {
        _this.notes.reset(data);
      }, function (code, msg) {
        console.error("Error loading notes: " + code + " - " + msg);
      });
    },

    onCheck: function (event) {
      if (!event) return;
      var dataIndex = event.target.getAttribute('data-index');
      var checked = event.target.checked;
      this.notes.selected.setCheckbox(dataIndex, checked);
      this.notes.selected.save({ rerender: false });
    },

  },
});
