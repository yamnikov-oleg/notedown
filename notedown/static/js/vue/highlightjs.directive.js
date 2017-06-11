Vue.directive('highlightjs', {
  deep: true,
  bind: function (el, binding) {
    var targets = el.querySelectorAll('code');
    targets.forEach(function (target) {
      hljs.highlightBlock(target);
    });
  },
  componentUpdated: function (el, binding) {
    var targets = el.querySelectorAll('code');
    targets.forEach(function (target) {
      hljs.highlightBlock(target);
    });
  },
});
