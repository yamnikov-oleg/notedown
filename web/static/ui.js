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

Vue.component('login-form', {
  template: '#login-form-template',
  data: function () {
    return {
      username: "",
      password: "",
      errorMessage: null,
    }
  },

  methods: {

    submit: function () {
      var _this = this;
      NotedownAPI.account.login(this.username, this.password, function (data) {
        _this.$emit('login', data.account);
      }, function (code, msg) {
        _this.errorMessage = "Could not log in with these credentials";
        console.log("Error logging-in: ", code, msg);
      });
    },

  },
});

Vue.component('bottom-bar', {
  template: '#bottom-bar-template',
  props: ['account'],
});

new Vue({
  el: '#app',
  data: {
    loggedIn: undefined,
    account: null,
  },

  mounted: function () {
    var _this = this;
    NotedownAPI.account.index(function (data) {
      if (data.account) {
        _this.loggedIn = true;
        _this.account = data.account;
      } else {
        _this.loggedIn = false;
      }
    });
  },

  methods: {

    login: function (account) {
      this.loggedIn = true;
      this.account = account;
    },

    logout: function () {
      NotedownAPI.account.logout();
      this.loggedIn = false;
      this.account = null;
    },

  },
});
