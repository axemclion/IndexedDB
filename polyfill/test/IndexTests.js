queuedModule("Indexes");
queuedAsyncTest("Creating Indexes", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME, ++dbVersion);
	dbOpenRequest.onsuccess = function(e){
		ok(true, "Database Opened successfully");
		_("Database opened successfully with version");
		nextTest();
		start();
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		nextTest();
		start();
	};
	dbOpenRequest.onupgradeneeded = function(e){
		ok(true, "Database Upgraded successfully");
		_("Database upgrade called");
		var db = dbOpenRequest.result;
		var objectStore1 = dbOpenRequest.transaction.objectStore(DB.OBJECT_STORE_1);
		var index1 = objectStore1.createIndex("IntIndex", "Int", {
			"unique": false,
			"multiEntry": false
		});
		var index2 = objectStore1.createIndex("StringIndex", "String");
		equal(objectStore1.indexNames.length, 2, "2 Indexes on object store successfully created");
		_(objectStore1.indexNames);
		start();
		stop();
	};
});

function openObjectStore(name, storeName, callback){
	queuedAsyncTest(name, function(){
		var dbOpenRequest = window.indexedDB.open(DB.NAME);
		dbOpenRequest.onsuccess = function(e){
			_("Database opened successfully");
			var db = dbOpenRequest.result;
			var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], IDBTransaction.READ_WRITE);
			var objectStore = transaction.objectStore(DB.OBJECT_STORE_1);
			callback(objectStore);
		};
		dbOpenRequest.onerror = function(e){
			ok(false, "Database NOT Opened successfully");
			_("Database NOT opened successfully");
			start();
			nextTest();
		};
	});
}

openObjectStore("Adding data after index is created", DB.OBJECT_STORE_1, function(objectStore){
	var key = sample.integer();
	var addReq = objectStore.add(sample.obj(), key);
	addReq.onsuccess = function(e){
		equal(key, addReq.result, "Data successfully added");
		_("Added to datastore with index " + key);
		start();
		nextTest();
	};
	addReq.onerror = function(){
		ok(false, "Could not add data");
		start();
		nextTest();
	};
});

