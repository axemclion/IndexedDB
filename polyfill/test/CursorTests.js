queuedModule("Cursor")
queuedAsyncTest("Iterating over cursor", function(){
	_("Deleting " + key);
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		_("Database opened successfully");
		ok(true, "Database Opened successfully");
		var db = dbOpenRequest.result;
		var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], IDBTransaction.READ_WRITE);
		var objectStore1 = transaction.objectStore(DB.OBJECT_STORE_1);
		var cursorReq = objectStore1.openCursor();
		cursorReq.onsuccess = function(e){
			var cursor = cursorReq.result;
			if (cursor) {
				ok(true, "Got cursor value " + cursor.key + ":" + cursor.value);
				_("Cursor open request succeeded");
				cursor["continue"]();
			} else {
				ok(true, "Iterating over all objects completed");
				start();
				nextTest();
			}
		};
		cursorReq.onerror = function(e){
			_("Error on cursor request")
			ok(false, "Could not continue opening cursor");
			start();
			nextTest();
		}
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		start();
		nextTest();
	};
});
