function data() {
	return {
		"bookName" : "bookName-" + parseInt(Math.random() * 100),
		"rating" : parseInt(Math.random() * 10),
		"price" : parseInt(Math.random() * 1000),
		"checkedOut" : new Date()
	}
};

var LINQ = $.linq4idb();
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

// List of all Examples
var linq4idbTests = {
	"To object store in database, add data and then print" : {
		"code" : function() {
			LINQ.to("BookList")["in"]("BookShop1").add(data()).then(console.info, console.error);
		},
		"alternate" : function() {
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(e) {
				var db = request.result;
				var transaction = db.transaction([ "BookList" ], IDBTransaction.READ_WRITE);
				objectStore = transaction.objectStore("BookList");
				var addRequest = objectStore.add(data());
				addRequest.onsuccess = function(event) {
					console.info("Saved id ", addRequest.result);
				};
				addRequest.onerror = function(e) {
					console.error(e);
				}
			};
			request.onerror = function(e) {
				console.error(e);
			}
		}
	},
	"From Object Store, Select and for each print" : {
		"code" : function() {
			LINQ.from("BookList")["in"]("BookShop1").select().forEach(console.info);
		},
		"alternate" : function() {
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(e) {
				var db = request.result;
				var transaction = db.transaction([ "BookList" ], IDBTransaction.READ);
				objectStore = transaction.objectStore("BookList");
				var curRequest = objectStore.openCursor();
				curRequest.onsuccess = function(event) {
					cursor = curRequest.result;
					console.info(cursor.value, cursor.key);
					cursor["cont" + "inue"]();
				};
				curRequest.onerror = function(event) {
				};
			};
		}
	},
	"From ObjectStore, Order By Price, select and for each, print"  : {
		"code" : function() {
			LINQ.from("BookList")["in"]("BookShop1").orderby("price").select().forEach(console.info);
		},
		"alternate" : function() {
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(e) {
				var db = request.result;
				var transaction = db.transaction([ "BookList" ], IDBTransaction.READ);
				objectStore = transaction.objectStore("BookList");
				var index = objectStore.index("price-index");
				var curRequest = index.openCursor();
				curRequest.onsuccess = function(event) {
					cursor = curRequest.result;
					console.info(cursor.value, cursor.key);
					cursor["cont" + "inue"]();
				};
				curRequest.onerror = function(event) {
				};
			};
		}
	},
	"From ObjectStore, Order By Price REVERSED and for each, print"  : {
		"code" : function() {
			LINQ.from("BookList")["in"]("BookShop1").orderby("price", 1).select().forEach(console.info);
		},
		"alternate" : function() {
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(e) {
				var db = request.result;
				var transaction = db.transaction([ "BookList" ], IDBTransaction.READ);
				objectStore = transaction.objectStore("BookList");
				var index = objectStore.index("price-index");
				var curRequest = index.openCursor(null, 1);
				curRequest.onsuccess = function(event) {
					cursor = curRequest.result;
					console.info(cursor.value, cursor.key);
					cursor["cont" + "inue"]();
				};
				curRequest.onerror = function(event) {
				};
			};
		}
	},

	"From ObjectStore, Where property Equals" : {
		"code" : function() {
			LINQ.from("BookList")["in"]("BookShop1").where("price", {
				"equals" : 450
			}).select().forEach(console.info);
		},
		"alternate" : function() {
		}
	},
	"From ObjectStore, Where property in Range" : {
		"code" : function() {
			LINQ.from("BookList")["in"]("BookShop1").where("price", {
				"range" : [ 200, 600 ]
			}).select().forEach(console.info);
		},
		"alternate" : function() {
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(e) {
				var db = request.result;
				var transaction = db.transaction([ "BookList" ], IDBTransaction.READ);
				objectStore = transaction.objectStore("BookList");
				var index = objectStore.index("price-index");
				var range = new IDBKeyRange.bound(200, 600, false, false);
				var curRequest = index.openCursor(range);
				curRequest.onsuccess = function(event) {
					cursor = curRequest.result;
					console.info(cursor.value, cursor.key);
					cursor["cont" + "inue"]();
				};
				curRequest.onerror = function(event) {
				};
			};

		}
	},
	"From ObjectStore, Where property in Range and Ordered by Rating" : {
		"code" : function() {
			LINQ.from("BookList")["in"]("BookShop1").where("price", {
				"range" : [ 200, 600 ]
			}).orderby("rating").select().forEach(console.info);
		},
		"alternate" : function() {
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(e) {
				var db = request.result;
				var transaction = db.transaction([ "BookList" ], IDBTransaction.READ);
				objectStore = transaction.objectStore("BookList");
				var index = objectStore.index("rating-index");
				var curRequest = index.openCursor();
				curRequest.onsuccess = function(event) {
					cursor = curRequest.result;
					if (!cursor) {
						return;
					}
					if (cursor.value && (cursor.value.price >= 200 || cursor.value.price <= 600)) {
						console.info(cursor.value, cursor.key);
					}
					cursor["cont" + "inue"]();
				};
				curRequest.onerror = function(event) {
				};
			};
		}
	},
	"Remove ObjectStore in Database" : {
		"code" : function() {
			LINQ.remove("BookList")["in"]("BookShop1").then(console.info, console.error);
		},
		"alternate" : function() {
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(e) {
				var db = request.result;
				var transactionReq = db.setVersion(db.version || (isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1));
				transactionReq.onsuccess = function() {
					transactionReq.result.db.deleteObjectStore("BookList");
					console.info(transactionReq.result.db);
				}
				transactionReq.onerror = function(e) {
					console.error(e, req);
				}
			}
		}
	}
}