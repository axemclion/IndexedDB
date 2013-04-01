(function(s) {
	s['Template'] = {

		onStart: function(cb, status) {
			console.log("onStart Called");
			cb();
		},
		setup: function() {
			console.log("Setup called");
		},
		teardown: function() {
			console.log("Teardown calld")
		},
		tests: {
			'Test 1': function(deferred) {
				console.log("Test1 called");
				deferred.resolve();
			},
			'Test 2': function(deferred) {
				console.log("Test2 called");
				deferred.resolve();
			}
		}
	};
}(window.IndexedDBPerf.suites));