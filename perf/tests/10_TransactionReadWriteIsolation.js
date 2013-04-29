(function(s) {
	s['Read and Write transaction isolation'] = {
		category :'ObjectStore',
		desc : 'Should read and write operations be in the same transction, or be in different transactions',
		_bTestKey:'agt1YS1wcm9maWxlcnINCxIEVGVzdBiJ8KIUDA',
		onStart: function(cb, status) {
			window.MAX = 1000;
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				$.indexedDB('IndexedDBPerf', {
					schema: {
						1: function(transaction) {
							var table1 = transaction.createObjectStore("Table1", {
								'autoIncrement': true
							});
							var table2 = transaction.createObjectStore("Table2", {
								'autoIncrement': true
							});
							var table3 = transaction.createObjectStore("Table3", {
								'autoIncrement': true
							});
							var table4 = transaction.createObjectStore("Table4", {
								'autoIncrement': true
							});
						}
					}
				}).done(function() {
					var table1 = $.indexedDB('IndexedDBPerf').objectStore('Table1');
					var table2 = $.indexedDB('IndexedDBPerf').objectStore('Table2');
					var table3 = $.indexedDB('IndexedDBPerf').objectStore('Table3');
					var table4 = $.indexedDB('IndexedDBPerf').objectStore('Table4');
					var added = 0;

					function done() {
						if (++added >= MAX * 4) {
							cb();
						}
						status();
					}
					for (var i = 0; i < MAX; i++) {
						table1.add(Faker.Helpers.createCard()).always(done);
						table2.add(Faker.Helpers.createCard()).always(done);
						table3.add(Faker.Helpers.createCard()).always(done);
						table4.add(Faker.Helpers.createCard()).always(done);
					}
				});
			});
		},
		setup: function() {
			window.data = Faker.Helpers.createCard();
		},
		teardown: function() {

		},
		tests: {
			'Same transaction, READ first': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0,
					writeCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table2'], 'readwrite');
					var objStore = transaction.objectStore('Table2');
					for (var i = 0; i < MAX; i++) {
						(function() {
							var readReq = objStore.get(i);
							readReq.onsuccess = function() {
								if (++readCount >= MAX && writeCount >= MAX) {
									db.close();
									deferred.resolve();
								}
							};
							readReq.onerror = function(e) {
								throw e;
							}
						}(i));
					}
					for (var i = MAX; i < MAX * 2; i++) {
						(function() {
							var writeReq = objStore.put(window.data, i);
							writeReq.onsuccess = function() {
								if (++writeCount >= MAX && readCount >= MAX) {
									db.close();
									deferred.resolve();
								}
							};
							writeReq.onerror = function(e) {
								throw e;
							}
						}(i));
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			},
			'Same transaction WRITE first': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0,
					writeCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readwrite');
					var objStore = transaction.objectStore('Table1');
					for (var i = MAX; i < MAX * 2; i++) {
						(function() {
							var writeReq = objStore.put(window.data, i);
							writeReq.onsuccess = function() {
								if (++writeCount >= MAX && readCount >= MAX) {
									db.close();
									deferred.resolve();
								}
							};
							writeReq.onerror = function(e) {
								throw e;
							}
						}(i));
					}
					for (var i = 0; i < MAX; i++) {
						(function() {
							var readReq = objStore.get(i);
							readReq.onsuccess = function() {
								if (writeCount >= MAX && ++readCount >= MAX) {
									db.close();
									deferred.resolve();
								}
							};
							readReq.onerror = function(e) {
								throw e;
							}
						}(i));
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			},
			'Separate transactions, Write first': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0,
					writeCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction1 = db.transaction(['Table3'], 'readwrite');
					var objStore1 = transaction1.objectStore('Table3');
					for (var i = MAX; i < MAX * 2; i++) {
						(function() {
							var writeReq = objStore1.put(window.data, i);
							writeReq.onsuccess = function() {
								if (++writeCount >= MAX && readCount >= MAX) {
									db.close();
									deferred.resolve();
								}
							};
							writeReq.onerror = function(e) {
								throw e;
							}
						}(i));
					}
					var transaction2 = db.transaction(['Table3'], 'readonly');
					var objStore2 = transaction2.objectStore('Table3');
					for (var i = 0; i < MAX; i++) {
						(function() {
							var readReq = objStore2.get(i);
							readReq.onsuccess = function() {
								if (writeCount >= MAX && ++readCount >= MAX) {
									db.close();
									deferred.resolve();
								}
							};
							readReq.onerror = function(e) {
								throw e;
							}
						}(i));
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			},
			'Separate Transactions, Read first': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0,
					writeCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction2 = db.transaction(['Table4'], 'readonly');
					var objStore2 = transaction2.objectStore('Table4');
					for (var i = 0; i < MAX; i++) {
						(function() {
							var readReq = objStore2.get(i);
							readReq.onsuccess = function() {
								if (++readCount >= MAX && writeCount >= MAX) {
									db.close();
									deferred.resolve();
								}
							};
							readReq.onerror = function(e) {
								throw e;
							}
						}(i));
					}
					var transaction1 = db.transaction(['Table4'], 'readwrite');
					var objStore1 = transaction1.objectStore('Table4');
					for (var i = MAX; i < MAX * 2; i++) {
						(function() {
							var writeReq = objStore1.put(window.data, i);
							writeReq.onsuccess = function() {
								if (++writeCount >= MAX && readCount >= MAX) {
									db.close();
									deferred.resolve();
								}
							};
							writeReq.onerror = function(e) {
								throw e;
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