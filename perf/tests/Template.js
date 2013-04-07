(function(s) {
	s['Template'] = {

		onStart: function(cb, status) {
			cb();
		},
		setup: function() {},
		teardown: function() {},
		tests: {
			'Test 1': function(deferred) {
				window.setTimeout(function() {
					deferred.resolve();
				}, 1000);
			},
			'Test 2': function(deferred) {
				window.setTimeout(function() {
					deferred.resolve();
				}, 2000);
			}
		}
	};
}(window.IndexedDBPerf.suites));