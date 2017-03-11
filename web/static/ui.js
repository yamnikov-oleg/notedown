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

    onCheck: function (event) {
      if (!event) return;
      var dataIndex = event.target.getAttribute('data-index');
      var checked = event.target.checked;
      this.notes.selected.setCheckbox(dataIndex, checked);
      this.notes.selected.save({ rerender: false });
    },

  },
});

new Vue({
  el: '#app',
});
