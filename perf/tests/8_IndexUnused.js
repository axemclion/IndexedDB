(function(s) {
	s['Indexes - Used vs Unused Indexes'] = {
		category : 'Indexes',
		desc : 'Does adding unused Indexes slow down the speed at which data is written to an object store',
		_bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBj14KkUDA',
		onStart: function(cb) {
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
							table2.createIndex("name");

							var table3 = transaction.createObjectStore("Table3", {
								'autoIncrement': true
							});
							table3.createIndex("unusedindex");
						}
					}
				}).done(function() {
					cb();
				});
			});

			window.addData = function(table, deferred) {
				var req = window.indexedDB.open('IndexedDBPerf');
				var readCount = 0;
				req.onsuccess = function() {
					var db = req.result;
					var transaction = db.transaction([table], 'readwrite');
					var objStore = transaction.objectStore(table);
					var writeReq = objStore.add(data);
					writeReq.onsuccess = function() {
						db.close();
						deferred.resolve();
					};
				};
				req.onerror = function() {
					throw "Could not open database";
				};
			}
		},
		setup: function() {
			window.data = Faker.Helpers.createCard();
		},
		teardown: function() {

		},
		tests: {
			'Writing to a table with NO index': function(deferred) {
				addData("Table1", deferred);
			},
			'Writing to a table with Used index': function(deferred) {
				addData("Table2", deferred);
			},
			'Writing to a table with Unused index': function(deferred) {
				addData("Table3", deferred);
			}
		}
	};
}(window.IndexedDBPerf.suites));