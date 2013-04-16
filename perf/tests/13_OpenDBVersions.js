(function(s) {
	s['Open Database with version'] = {
		category: 'General',
		desc: 'Is it faster to open a database with a specified version, or should the version be omitted',
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBiMm6QUDA',
		onStart: function(cb, status) {
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				$.indexedDB('IndexedDBPerf1').deleteDatabase().done(function() {
					cb();
				});
			});
		},
		setup: function() {
			window.version = 1;
		},
		teardown: function() {},
		tests: {
			'Open database without version': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf');
				openReq.onsuccess = function() {
					openReq.result.close();
					deferred.resolve();
				};
			},
			'Open database with version': function(deferred) {
				var openReq = window.indexedDB.open('IndexedDBPerf1', 1);
				openReq.onsuccess = function() {
					openReq.result.close();
					deferred.resolve();
				}
			}
		}
	};
}(window.IndexedDBPerf.suites));