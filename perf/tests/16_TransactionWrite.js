(function(s) {
	s['Write Operation for per store transactions'] = {
		category: 'ObjectStore',
		desc: 'Does it matter if a write operation is performed for different object stores in different transactions, or will doing it in the same transaction be equally fast? ',
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBi_oq8UDA',
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
							trans.createObjectStore('Table3', {
								'autoIncrement': true
							});
							trans.createObjectStore('Table4', {
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
			'Write Transaction per ObjectStore': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				var count = 0;
				openReq.onsuccess = function() {
					var db = openReq.result;
					var objectStore1 = db.transaction(['Table1'], 'readwrite').objectStore('Table1');
					var objectStore2 = db.transaction(['Table2'], 'readwrite').objectStore('Table2');
					for (var i = 0; i < 1000; i++) {
						(function(i) {
							var writeReq1 = objectStore1.add(data);
							writeReq1.onsuccess = function() {
								if (++count >= 1999) {
									db.close();
									deferred.resolve();
								}
							};
							writeReq1.onerror = function(e) {
								console.log(writeReq1.error);
							}
							var writeReq2 = objectStore2.add(data);
							writeReq2.onsuccess = function() {
								if (++count >= 1999) {
									db.close();
									deferred.resolve();
								}
							}
						}(i));
					}
				}
			},
			'All ObjectStore write in a transaction': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				var count = 0;
				openReq.onsuccess = function() {
					var db = openReq.result;
					var transaction = db.transaction(['Table3', 'Table4'], 'readwrite');
					var objectStore1 = transaction.objectStore('Table3');
					var objectStore2 = transaction.objectStore('Table4');
					for (var i = 0; i < 1000; i++) {
						(function(i) {
							var writeReq1 = objectStore1.add(data);
							writeReq1.onsuccess = function() {
								if (++count >= 1999) {
									db.close();
									deferred.resolve();
								}
							}
							var writeReq2 = objectStore2.add(data);
							writeReq2.onsuccess = function() {
								if (++count >= 1999) {
									db.close();
									deferred.resolve();
								}
							}
						}(i));
					}
				}
			}
		}
	}
}(window.IndexedDBPerf.suites));