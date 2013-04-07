(function(s) {
	s['Key and Object Cursor on Index'] = {
		category: 'Indexes',
		desc: "What is faster - A key cursor on an Index, or an object cursor on an index",
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBj26aEUDA',
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
			'Key Cursors': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var index = objStore.index("username");
					var cursorReq = index.openKeyCursor();
					cursorReq.onsuccess = function() {
						if (cursorReq.result) {
							++readCount;
							cursorReq.result['continue']();
						} else {
							if (readCount < 1000) {
								throw "Did not read all values";
							}
							db.close();
							deferred.resolve();
						}

					};
					cursorReq.onerror = function(e) {
						throw e;
					};
				};
				req.onerror = function() {
					throw "Could not open database";
				}
			},
			'Object Cursor': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var index = objStore.index("username");
					var cursorReq = index.openCursor();
					cursorReq.onsuccess = function() {
						if (cursorReq.result) {
							++readCount;
							cursorReq.result['continue']();
						} else {
							if (readCount < 1000) {
								throw "Did not read all values";
							}
							db.close();
							deferred.resolve();
						}

					};
					cursorReq.onerror = function(e) {
						throw e;
					};
				};
				req.onerror = function() {
					throw "Could not open database";
				}
			},
			'Key Cursor and then Object': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var index = objStore.index("username");
					var cursorReq = index.openKeyCursor();
					cursorReq.onsuccess = function() {
						if (cursorReq.result) {
							var readReq = objStore.get(cursorReq.result.key);
							readReq.onsuccess = function() {
								if (++readCount >= 1000) {
									db.close();
									deferred.resolve();
								}
							};
							cursorReq.result['continue']();
						}
					};
					cursorReq.onerror = function(e) {
						throw e;
					};
				};
				req.onerror = function() {
					throw "Could not open database";
				}
			}
		}
	};
}(window.IndexedDBPerf.suites));