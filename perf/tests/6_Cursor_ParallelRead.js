(function(s) {
	s['Cursors - Parallel Read'] = {
		category : 'Cursors',
		desc :'Is it faster to read all data in one cursor, or segment the data and open multiple cursors in parallel to read them',
		_bTestKey : 'agt1YS1wcm9maWxlcnINCxIEVGVzdBjXtKgUDA',
		onStart: function(cb, status) {
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				$.indexedDB('IndexedDBPerf', {
					'schema': {
						'1': function(trans) {
							trans.createObjectStore('Table1', {
								'autoIncrement': true
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
		setup: function() {
			var data = Faker.Helpers.createCard();
		},
		teardown: function() {

		},
		tests: {
			'All Read in One cursor': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var cursorReq = objStore.openCursor(IDBKeyRange.bound(0, 1000, true, true), "next");
					cursorReq.onsuccess = function() {
						if (cursorReq.result) {
							//console.log(cursorReq.result);
							cursorReq.result["continue"]();
						} else {
							//console.log("All Done");
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
			'10 cursors, 100 reads per cursor': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var cursorReqs = [],
						cursorDoneCount = 0;
					for (var i = 0; i < 10; i++) {
						(function(i) {
							cursorReqs[i] = objStore.openCursor(IDBKeyRange.bound(i * 100 + 1, i * 100 + 100, true, true), "next");
							cursorReqs[i].onsuccess = function(e) {
								if (cursorReqs[i].result) {
									//console.log(cursorReqs[i].result);
									cursorReqs[i].result["continue"]();
								} else {
									if (++cursorDoneCount >= 10) {
										db.close();
										deferred.resolve();
									}
								}
							}
							cursorReqs[i].onerror = function(e) {
								throw "Could not open Cursor";
							}
						}(i));
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			},
			'100 cursors, 10 reads per cursor': function() {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var cursorReqs = [],
						cursorDoneCount = 0;
					for (var i = 0; i < 100; i++) {
						(function(i) {
							cursorReqs[i] = objStore.openCursor(IDBKeyRange.bound(i * 10 + 1, i * 10 + 10, true, true), "next");
							cursorReqs[i].onsuccess = function(e) {
								if (cursorReqs[i].result) {
									//console.log(cursorReqs[i].result);
									cursorReqs[i].result["continue"]();
								} else {
									if (++cursorDoneCount >= 100) {
										db.close();
										deferred.resolve();
									}
								}
							}
							cursorReqs[i].onerror = function(e) {
								throw "Could not open Cursor";
							}
						}(i));
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			},
			'500 cursors, 2 reads per cursor': function() {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var cursorReqs = [],
						cursorDoneCount = 0;
					for (var i = 0; i < 500; i++) {
						(function(i) {
							cursorReqs[i] = objStore.openCursor(IDBKeyRange.bound(i * 2, i * 2 + 1, true, true), "next");
							cursorReqs[i].onsuccess = function(e) {
								if (cursorReqs[i].result) {
									//console.log(cursorReqs[i].result);
									cursorReqs[i].result["continue"]();
								} else {
									if (++cursorDoneCount >= 500) {
										db.close();
										deferred.resolve();
									}
								}
							}
							cursorReqs[i].onerror = function(e) {
								throw "Could not open Cursor";
							}
						}(i));
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			},
			'1000 cursors, 1 read per cursor': function() {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var cursorReqs = [],
						cursorDoneCount = 0;
					for (var i = 0; i < 1000; i++) {
						(function(i) {
							cursorReqs[i] = objStore.openCursor(IDBKeyRange.bound(i, i), "next");
							cursorReqs[i].onsuccess = function(e) {
								if (cursorReqs[i].result) {
									//console.log(cursorReqs[i].result);
									cursorReqs[i].result["continue"]();
								} else {
									if (++cursorDoneCount >= 1000) {
										db.close();
										deferred.resolve();
									}
								}
							}
							cursorReqs[i].onerror = function(e) {
								throw "Could not open Cursor";
							}
						}(i));
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			}
		}
	};
}(window.IndexedDBPerf.suites));