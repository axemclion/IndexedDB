(function(s) {
	s['Comparing Keys'] = {
		desc : "Comparing various keys",
		onStart: function(cb) {
			cb();
		},
		setup: function() {
			    obj1 = Faker.Helpers.createCard();
    			obj2 = Faker.Helpers.createCard();
		},
		teardown: function() {

		},
		tests: {
			'Integers': function() {
				window.indexedDB.cmp(100,1101);
			},
			'Longs': function() {
				window.indexedDB.cmp(100.123123,22/7);
			},
			'String': function() {},
			'Arrays': function() {},
			'Object': function() {}
		}
	};
}(window.IndexedDBPerf.suites));