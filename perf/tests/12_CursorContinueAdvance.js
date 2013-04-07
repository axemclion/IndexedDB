(function(s) {
	s['Cursor Advance/Continue'] = {
		category: 'Cursors',
		desc: "What is faster - advancing in a cursor, or just calling continue",
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBjSvaMUDA',
		onStart: function(cb, status) {
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				$.indexedDB('IndexedDBPerf', {
					schema: {
						1: function(transaction) {
							var table1 = transaction.createObjectStore("Table1", {
								'autoIncrement': true
							});
							table1.createIndex("username", {
								'unique': false
							});
						}
					}
				}).done(function() {
					var objStore = $.indexedDB('IndexedDBPerf').objectStore('Table1');
					var added = 0;
					for (var i = 0; i < 1000; i++) {
						objStore.add(Faker.Helpers.createCard()).always(function() {
							if (++added >= 999) {
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
		tests: {
			'Cursor Continue': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var cursorReq = objStore.openCursor(IDBKeyRange.bound(0, 1000, true, true), "next");
					cursorReq.onsuccess = function() {
						if (cursorReq.result) {
							var data = cursorReq.result.value;
							readCount++;
							cursorReq.result["continue"]();
						} else {
							//console.log("All Done");
							if (readCount < 999) {
								throw "Did not read all the data" + readCount;
							}
							db.close();
							deferred.resolve();
						}
					};
					cursorReq.onerror = function() {
						throw "Could not create Cursor request"
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			},
			'Cursor Advance': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var cursorReq = objStore.openCursor(IDBKeyRange.bound(0, 1000, true, true), "next");
					cursorReq.onsuccess = function() {
						if (cursorReq.result) {
							var data = cursorReq.result.value;
							readCount++;
							cursorReq.result["advance"](1);
						} else {
							//console.log("All Done");
							if (readCount < 999) {
								throw "Did not read all the data" + readCount;
							}
							db.close();
							deferred.resolve();
						}
					};
					cursorReq.onerror = function() {
						throw "Could not create Cursor request"
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			}
		}
	};
}(window.IndexedDBPerf.suites));