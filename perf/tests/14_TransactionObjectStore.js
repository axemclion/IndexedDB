(function(s) {
	s['Objectstore per transaction'] = {
		category: 'ObjectStore',
		desc: 'Which transaction opens faster - one with all object stores, or the one per object store ?  ',
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBiD0LIUDA',
		onStart: function(cb, status) {
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				status();
				$.indexedDB('IndexedDBPerf', {
					'schema': {
						1: function(t) {
							for (var i = 0; i < 20; i++)
							t.createObjectStore('Table' + i);
							status();
						}
					}
				}).done(function() {
					cb();
				});
			});
		},
		setup: function() {},
		teardown: function() {},
		tests: {
			'1 read transaction per store': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				openReq.onsuccess = function() {
					var db = openReq.result;
					for (var i = 0; i < 20; i++) {
						db.transaction(['Table' + i], 'readonly').objectStore('Table' + i);
					}
					db.close();
					deferred.resolve();
				}
			},
			'All stores in 1 read transaction': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				openReq.onsuccess = function() {
					var db = openReq.result;
					var tables = [];
					for (var i = 0; i < 20; i++) {
						tables.push('Table' + i);
					}
					var transaction = db.transaction(tables, 'readonly');
					for (var i = 0; i < 20; i++) {
						transaction.objectStore('Table' + i);
					}
					db.close();
					deferred.resolve();
				}
			},
			'1 write transaction per store': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				openReq.onsuccess = function() {
					var db = openReq.result;
					for (var i = 0; i < 20; i++) {
						db.transaction(['Table' + i], 'readwrite').objectStore('Table' + i);
					}
					db.close();
					deferred.resolve();
				}
			},
			'All stores in 1 write transaction': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				openReq.onsuccess = function() {
					var db = openReq.result;
					var tables = [];
					for (var i = 0; i < 20; i++) {
						tables.push('Table' + i);
					}
					var transaction = db.transaction(tables, 'readwrite');
					for (var i = 0; i < 20; i++) {
						transaction.objectStore('Table' + i);
					}
					db.close();
					deferred.resolve();
				}
			}
		}
	};
}(window.IndexedDBPerf.suites));