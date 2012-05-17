function onObjectStoreOpen(name, storeName, callback){
	queuedAsyncTest(name, function(){
		var dbOpenRequest = window.indexedDB.open(DB.NAME);
		dbOpenRequest.onsuccess = function(e){
			_("Database opened successfully");
			ok(true, "Database Opened successfully");
			var db = dbOpenRequest.result;
			var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2, DB.OBJECT_STORE_3, DB.OBJECT_STORE_4], IDBTransaction.READ_WRITE);
			var objectStore = transaction.objectStore(storeName);
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

queuedModule("ObjectStore CRUD");
var key = sample.integer();
var data = sample.obj();

onObjectStoreOpen("Adding data to Object Store", DB.OBJECT_STORE_1, function(objectStore){
	var addReq = objectStore.add(data, key);
	addReq.onsuccess = function(e){
		_("Data added to object Store successfully " + key);
		equal(key, addReq.result, "Data added to Object store");
		start();
		nextTest();
	};
	addReq.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Adding with keypath and autoInc, no key", DB.OBJECT_STORE_2, function(objectStore){
	var addReq = objectStore.add(sample.obj());
	addReq.onsuccess = function(e){
		_("Data added to object Store successfully " + addReq.result);
		notEqual(null, addReq.result, "Data added to Object store");
		start();
		nextTest();
	};
	addReq.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});


onObjectStoreOpen("Adding with keypath and autoInc, no key in path", DB.OBJECT_STORE_2, function(objectStore){
	var data = sample.obj();
	delete data["Int"]
	var addReq = objectStore.add(data);
	addReq.onsuccess = function(e){
		_("Data added to object Store successfully " + addReq.result);
		notEqual(null, addReq.result, "Data added to Object store");
		start();
		nextTest();
	};
	addReq.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Adding with NO keypath and autoInc", DB.OBJECT_STORE_3, function(objectStore){
	var key = sample.integer();
	var addReq = objectStore.add(sample.obj(), key);
	addReq.onsuccess = function(e){
		_("Data added to object Store successfully " + key);
		equal(key, addReq.result, "Data added to Object store");
		start();
		nextTest();
	};
	addReq.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Adding with NO keypath and autoInc - no key specified", DB.OBJECT_STORE_3, function(objectStore){
	var key = sample.integer();
	var addReq = objectStore.add(sample.obj());
	addReq.onsuccess = function(e){
		_("Data added to object Store successfully " + key);
		ok(addReq.result, "Data added to Object store");
		start();
		nextTest();
	};
	addReq.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Updating data in Object Store", DB.OBJECT_STORE_1, function(objectStore){
	data = sample.obj();
	data["modified"] = true;
	var addReq = objectStore.put(data, key);
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
});

onObjectStoreOpen("Getting data in Object Store", DB.OBJECT_STORE_1, function(objectStore){
	var addReq = objectStore.get(key);
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
});

onObjectStoreOpen("Lots of data Added to objectStore1", DB.OBJECT_STORE_1, function(objectStore){
	counter = 0;
	for (var i = 0; i < 10; i++) {
		var addReq = objectStore.add(sample.obj(), sample.integer());
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
});
