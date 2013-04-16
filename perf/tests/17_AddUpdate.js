(function(s) {
	s['Add and Update'] = {
		desc: 'Is it better to insert data using add call or update call',
		category: 'ObjectStore',
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBio8aoUDA',
		onStart: function(cb, status) {
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				$.indexedDB('IndexedDBPerf', {
					'schema': {
						'1': function(trans) {
							trans.createObjectStore('Table1', {
								'autoIncrement': true
							});
							trans.createObjectStore('Table2', {
								'autoIncrement': true
							});
							status();
						}
					}
				}).done(function() {
					cb();
				});
			});
		},
		setup: function() {
			window.data = Faker.Helpers.createCard();
		},
		teardown: function() {},
		defer: true,
		tests: {
			'Write using Add': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				var count = 0;
				openReq.onsuccess = function() {
					var db = openReq.result;
					var objectStore = db.transaction(['Table1'], 'readwrite').objectStore('Table1');
					for (var i = 0; i < 1000; i++) {
						(function(i) {
							var writeReq = objectStore.add(data);
							writeReq.onsuccess = function() {
								if (++count >= 999) {
									db.close();
									deferred.resolve();
								}
							};
						}(i));
					}
				}
			},
			'Write using Put': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				var count = 0;
				openReq.onsuccess = function() {
					var db = openReq.result;
					var objectStore = db.transaction(['Table2'], 'readwrite').objectStore('Table2');
					for (var i = 0; i < 1000; i++) {
						(function(i) {
							var writeReq = objectStore.put(data);
							writeReq.onsuccess = function() {
								if (++count >= 999) {
									db.close();
									deferred.resolve();
								}
							};
						}(i));
					}
				}
			}
		}
	};
}(window.IndexedDBPerf.suites));