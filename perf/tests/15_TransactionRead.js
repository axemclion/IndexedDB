(function(s) {
	s['Read Operation for per store transactions'] = {
		category: 'ObjectStore',
		desc: 'Does it matter if a read operation is performed for different object stores in different transactions, or will doing it in the same transaction be equally fast? ',
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBiT9K4UDA',
		onStart: function(cb, status) {
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				$.indexedDB('IndexedDBPerf', {
					'schema': {
						'1': function(trans) {
							trans.createObjectStore('Table1', {
								'autoIncrement': false
							});
							trans.createObjectStore('Table2', {
								'autoIncrement': false
							});
							status();
						}
					}
				}).done(function() {
					var objStore1 = $.indexedDB('IndexedDBPerf').objectStore('Table1');
					var objStore2 = $.indexedDB('IndexedDBPerf').objectStore('Table2');
					var added = 0;
					for (var i = 0; i < 1000; i++) {
						objStore1.add(Faker.Helpers.createCard(), i).always(function() {
							if (++added >= 1999) {
								cb();
							}
							status();
						});
						objStore2.add(Faker.Helpers.createCard(), i).always(function() {
							if (++added >= 1999) {
								cb();
							}
							status();
						});
					}
				});
			});
		},
		setup: function() {},
		teardown: function() {},
		defer: true,
		tests: {
			'Read Transaction per ObjectStore': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				openReq.onsuccess = function() {
					var db = openReq.result;
					var objectStore1 = db.transaction(['Table1'], 'readonly').objectStore('Table1');
					var objectStore2 = db.transaction(['Table2'], 'readonly').objectStore('Table2');
					for (var i = 0; i < 1000; i++) {
						(function(i) {
							var readReq1 = objectStore1.get(i);
							readReq1.onsuccess = function() {
								if (++readCount >= 1999) {
									db.close();
									deferred.resolve();
								}
							}
							var readReq2 = objectStore2.get(i);
							readReq2.onsuccess = function() {
								if (++readCount >= 1999) {
									db.close();
									deferred.resolve();
								}
							}
						}(i));
					}
				}
			},
			'All ObjectStore reads in a transaction': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				openReq.onsuccess = function() {
					var db = openReq.result;
					var transaction = db.transaction(['Table1', 'Table2'], 'readonly');
					var objectStore1 = transaction.objectStore('Table1');
					var objectStore2 = transaction.objectStore('Table2');
					for (var i = 0; i < 1000; i++) {
						(function(i) {
							var readReq1 = objectStore1.get(i);
							readReq1.onsuccess = function() {
								if (++readCount >= 1999) {
									db.close();
									deferred.resolve();
								}
							}
							var readReq2 = objectStore2.get(i);
							readReq2.onsuccess = function() {
								if (++readCount >= 1999) {
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