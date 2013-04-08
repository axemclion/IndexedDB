(function(s) {
	s['Comparing Keys'] = {
		category: 'General',
		desc: 'Performance for comparing different key types',
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBir36IUDA',
		onStart: function(cb) {
			cb();
		},
		setup: function() {
			window.str1 = Faker.Lorem.sentence();
			window.str2 = Faker.Lorem.sentence();
			window.long1 = Math.random();
			window.long2 = Math.random();
			window.num1 = Faker.Helpers.randomNumber(10000);
			window.num2 = Faker.Helpers.randomNumber(10000);
			window.ar1 = Faker.Lorem.sentences().split(" ");
			window.ar2 = Faker.Lorem.sentences().split(" ");
			window.nar1 = Faker.Lorem.sentences().split(" ");
			nar1.push(Faker.Lorem.sentences().split(" "));
			nar1.push(Faker.Lorem.sentences().split(" "));
			nar1.push(Faker.Lorem.sentences().split(" "));
			window.nar2 = Faker.Lorem.sentences().split(" ");
			nar2.push(Faker.Lorem.sentences().split(" "));
			nar2.push(Faker.Lorem.sentences().split(" "));
			nar2.push(Faker.Lorem.sentences().split(" "));
		},
		teardown: function() {

		},
		defer : false,
		tests: {
			'Integers': function(deferred) {
				window.indexedDB.cmp(num1, num2);
			},
			'Longs': function() {
				window.indexedDB.cmp(long1, long2);
			},
			'String': function() {
				window.indexedDB.cmp(str1, str2);
			},
			'Arrays': function() {
				window.indexedDB.cmp(ar1, ar2);
			},
			'Nested Arrays': function() {
				window.indexedDB.cmp(nar1, nar2);
			}
		}
	};
}(window.IndexedDBPerf.suites));