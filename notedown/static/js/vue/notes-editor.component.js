Vue.component('notes-editor', {
  template: "#notes-editor-template",
  data: function () {
    return {
      notes: new SelectableNotesList(),
    };
  },

  mounted: function () {
    this.notes.refresh();
  },

  methods: {

    remove_confirm: function () {
      if (this.notes.selected.isNew() || confirm("Delete this note FOREVER?")) {
        this.notes.remove(this.notes.selected);
      }
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
