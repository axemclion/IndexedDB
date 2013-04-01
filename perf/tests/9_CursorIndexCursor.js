(function(s) {
	s['Iterations using Cursors/Index Cursors'] = {
		desc: 'Is iterating using Indexes as fast as Iterating using normal cursors',
		onStart: function(cb, status) {
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				$.indexedDB('IndexedDBPerf', {
					'schema': {
						1: function(t) {
							var table1 = t.createObjectStore("Table1", {
								autoIncrement: false,
								keyPath : "id"
							});
							table1.createIndex("id");
							table1.createIndex("name");
						}
					}
				}).done(function() {
					var objStore = $.indexedDB('IndexedDBPerf').objectStore('Table1');
					var added = 0;
					for (var i = 0; i < 1000; i++) {
						var data = Faker.Helpers.createCard();
						data.name  = i + Faker.Name.findName();
						data.id = i;
						objStore.add(data).always(function() {
							if (++added >= 999) {
								cb();
							}
							status();
						});
					}
				})
			});
		},
		setup: function() {},
		teardown: function() {},
		tests: {
			'Reading using Cursors': function(deferred) {
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
							if (readCount < 999){
								throw "Did not read all the data"  + readCount;
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
			'Reading using Index Cursors': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var index = objStore.index("id");
					var cursorReq = index.openCursor(IDBKeyRange.bound(0, 1000, true, true), "next");
					cursorReq.onsuccess = function() {
						if (cursorReq.result) {
							var data = cursorReq.result.value;
							readCount++;
							cursorReq.result["continue"]();
						} else {
							if (readCount < 999){
								throw "Did not read all the data"  + readCount;
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
			'Reading using Index Cursors - String Index': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readonly');
					var objStore = transaction.objectStore('Table1');
					var index = objStore.index("name");
					var cursorReq = index.openCursor();
					cursorReq.onsuccess = function() {
						if (cursorReq.result) {
							var data = cursorReq.result.value;
							readCount++;
							cursorReq.result["continue"]();
						} else {
							if (readCount < 999){
								throw "Did not read all the data " + readCount;
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