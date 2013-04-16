(function(s) {
	s['Template'] = {
		category: '',
		desc: '',
		_bTestKey: '',
		onStart: function(cb, status) {
			cb();
		},
		setup: function() {},
		teardown: function() {},
		defer: true,
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