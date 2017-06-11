var NotedownAPI = (function () {
  // Performs ajax request to the given api.
  // * method -  string;
  // * url -     string;
  // * data -    object (map), optional;
  // * success - function(json),
  //             where json is an object.
  // * fail -    function(statusCode, msg),
  //             statusCode is a number and
  //             msg is a string or null.
  function call(method, url, data, success, fail) {
    var successWrapped = function (json) {
      if (success) success(json);
    }
    var failWrapped = function (code, msg) {
      if (fail) fail(code, msg);
    }

    var options = {
      method: method,
      credentials: 'same-origin',
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
        status = 0;
        return { message: error.toString() };
      })
      .then(function (json) {
        if (status >= 200 && status <= 299) {
          successWrapped(json);
        } else {
          failWrapped(status, json && json.message);
        }
      }, function (error) {
        failWrapped(status, error.toString());
      });
  }

  return {
    _call: call,
    notes: {
      index: function (success, fail) {
        call('GET', '/api/v1/notes', null, success, fail);
      },
      create: function (note, success, fail) {
        call('POST', '/api/v1/notes/create', { text: note.text }, success, fail);
      },
      update: function (note, success, fail) {
        call('POST', '/api/v1/notes/update', { id: note.id, text: note.text }, success, fail);
      },
      delete: function (note, success, fail) {
        call('POST', '/api/v1/notes/delete', { id: note.id }, success, fail);
      },
    },

    account: {
      index: function (success, fail) {
        call('GET', '/api/v1/account', null, success, fail);
      },
      login: function (username, password, success, fail) {
        call('POST', '/api/v1/account/login',
             { username: username, password: password },
             success, fail);
      },
      logout: function (success, fail) {
        call('POST', '/api/v1/account/logout', success, fail);
      },
    },
  };
})();
