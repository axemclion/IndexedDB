queuedModule("ObjectStore CRUD");
var key = sample.integer();
var data = sample.obj();
queuedAsyncTest("Adding data to Object Store", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		_("Database opened successfully");
		ok(true, "Database Opened successfully");
		var db = dbOpenRequest.result;
		var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], IDBTransaction.READ_WRITE);
		var objectStore1 = transaction.objectStore(DB.OBJECT_STORE_1);
		var addReq1 = objectStore1.add(data, key);
		addReq1.onsuccess = function(e){
			_("Data added to object Store successfully " + key);
			equal(key, addReq1.result, "Data added to Object store");
			start();
			nextTest();
		};
		addReq1.onerror = function(e){
			_("Could not add data to database");
			ok(false, "Could not add Data to ObjectStore1");
			start();
			nextTest();
		};
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		start();
		nextTest();
	};
});

queuedAsyncTest("Adding data in Object Store with keypath and autoInc", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		_("Database opened successfully");
		ok(true, "Database Opened successfully");
		var db = dbOpenRequest.result;
		var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], IDBTransaction.READ_WRITE);
		var objectStore = transaction.objectStore(DB.OBJECT_STORE_2);
		var addReq1 = objectStore.add(data);
		addReq1.onsuccess = function(e){
			_("Data added to object Store successfully " + key);
			notEqual(null, addReq1.result, "Data added to Object store");
			start();
			nextTest();
		};
		addReq1.onerror = function(e){
			_("Could not add data to database");
			ok(false, "Could not add Data to ObjectStore1");
			start();
			nextTest();
		};
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		start();
		nextTest();
	};
});

queuedAsyncTest("Adding data in Object Store with no and autoInc", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		_("Database opened successfully");
		ok(true, "Database Opened successfully");
		var db = dbOpenRequest.result;
		var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], IDBTransaction.READ_WRITE);
		var objectStore = transaction.objectStore(DB.OBJECT_STORE_2);
		var addReq1 = objectStore.add(data);
		addReq1.onsuccess = function(e){
			_("Data added to object Store successfully " + key);
			notEqual(null, addReq1.result, "Data added to Object store");
			start();
			nextTest();
		};
		addReq1.onerror = function(e){
			_("Could not add data to database");
			ok(false, "Could not add Data to ObjectStore1");
			start();
			nextTest();
		};
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		start();
		nextTest();
	};
});

queuedAsyncTest("Updating data in Object Store", function(){
	_("Updating " + key + data);
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		_("Database opened successfully");
		ok(true, "Database Opened successfully");
		var db = dbOpenRequest.result;
		var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], IDBTransaction.READ_WRITE);
		var objectStore1 = transaction.objectStore(DB.OBJECT_STORE_1);
		data = sample.obj();
		data["modified"] = true;
		var addReq = objectStore1.put(data, key);
		addReq.onsuccess = function(){
			_("Data added to object Store successfully");
			equal(key, addReq.result, "Data added to Object store");
			start();
			nextTest();
		};
		addReq.onerror = function(){
			_("Could not add data to database");
			ok(false, "Could not update Data");
			start();
			nextTest();
		};
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		start();
		nextTest();
	};
});

queuedAsyncTest("Getting data in Object Store", function(){
	_("Getting " + key);
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		_("Database opened successfully");
		ok(true, "Database Opened successfully");
		var db = dbOpenRequest.result;
		var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], IDBTransaction.READ_WRITE);
		var objectStore1 = transaction.objectStore(DB.OBJECT_STORE_1);
		var addReq = objectStore1.get(key);
		addReq.onsuccess = function(){
			_("Data got from object store");
			deepEqual(addReq.result, data, "Data fetched matches the data");
			start();
			nextTest();
		};
		addReq.onerror = function(){
			_("Could not get data to database");
			ok(false, "Could not get data");
			start();
			nextTest();
		};
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		start();
		nextTest();
	};
});

queuedAsyncTest("Lots of data Added to objectStore1", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		_("Database opened successfully");
		ok(true, "Database Opened successfully");
		var db = dbOpenRequest.result;
		var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], IDBTransaction.READ_WRITE);
		var objectStore1 = transaction.objectStore(DB.OBJECT_STORE_1);
		var counter = 0;
		for (var i = 0; i < 10; i++) {
			var addReq = objectStore1.add(sample.obj(), sample.integer());
			addReq.onsuccess = function(){
				_(counter + ". Data added to store" + addReq.result);
				ok(true, "Data added to store" + addReq.result);
				if (++counter >= 10) {
					start();
					nextTest();
				}
			};
			addReq.onerror = function(){
				_(counter + ". Could not get add to database");
				ok(false, "Could not add data");
				if (++counter >= 10) {
					start();
					nextTest();
				}
			};
		}
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		start();
		nextTest();
	};
});
