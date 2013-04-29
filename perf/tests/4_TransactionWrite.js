(function(s) {
	s['Transaction based on Write'] = {
		category: 'Transaction',
		desc : 'Is it faster to queue all write requests in one transaction, or batch write requests in multiple transactions opening in a loop',
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBjDk6QUDA',
		onStart: function(cb, status) {
			$.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
				status();
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
			'All Writes in One Transaction': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction(['Table1'], 'readwrite');
					var objStore = transaction.objectStore('Table1');
					//console.log("Database opened");
					for (var i = 0; i < 1000; i++) {
						//console.log('Single Transaction - reading ', i)
						var readReq = objStore.add(data);
						readReq.onsuccess = readReq.onerror = function() {
							if (++readCount >= 999) {
								db.close()
								deferred.resolve();
							}
						}
					}

				};
				req.onerror = function() {
					throw "Could not open database";
				}
			},
			'Group write in transaction sets with 10 reads each': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					//console.log("Database opened");
					for (var i = 0; i < 10; i++) {
						var transaction = db.transaction(['Table1'], 'readwrite');
						var objStore = transaction.objectStore('Table1');
						for (var j = 0; j < 100; j++) {
							//console.log('Transactions Sets - Reading ', i)
							var readReq = objStore.add(data);
							readReq.onsuccess = readReq.onerror = function() {
								if (++readCount >= 999) {
									db.close();
									deferred.resolve();
								}
							}
						}

					}
				};
				req.onerror = function() {
					throw "Could not open database";
				}
			},
			'Each write in its own transaction': function(deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					//console.log("Database opened");
					for (var i = 0; i < 1000; i++) {
						var transaction = db.transaction(['Table1'], 'readwrite');
						var objStore = transaction.objectStore('Table1');
						//console.log('Multiple transactions - Reading ', i)
						var readReq = objStore.add(data);
						readReq.onsuccess = readReq.onerror = function() {
							if (++readCount >= 999) {
								db.close();
								deferred.resolve();
							}
						}
					}
				};
				req.onerror = function() {
					throw "Could not open database";
				}
			}
		}
	};
}(window.IndexedDBPerf.suites));