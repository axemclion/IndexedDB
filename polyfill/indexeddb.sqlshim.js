/**
 * IndexedDB Shim, that works on top of WebSQL for browsers like Opera, Safari and possibly other browsers.
 * @param {Object} window
 * @param {Object} undefined
 */
window.indexedDB = (function(window, undefined){
	var DEFAULT_DB_SIZE = 4 * 1024 * 1024;
	
	// The sysDB to keep track of version numbers for databases
	var sysdb = window.openDatabase("__sysdb__", 1, "System Database", DEFAULT_DB_SIZE);
	sysdb.transaction(function(tx){
		window.axe = tx.executeSql("SELECT * FROM versions", [], function(t, data){
		}, function(){
			sysdb.transaction(function(tx){
				tx.executeSql("CREATE TABLE versions (name VARCHAR(255), version INT);", [], function(){
				}, function(){
					throw new Error("Could not create table __sysdb__ to save DB versions");
				});
			});
		});
	});
	
	/**
	 * A utility method to callback onsuccess, onerror, etc as soon as the calling function's context is over
	 * @param {Object} fn
	 * @param {Object} context
	 * @param {Object} argArray
	 */
	function callback(fn, context, argArray){
		window.setTimeout(function(){
			if (typeof context[fn] === "function") {
				context[fn].apply(context, argArray);
			}
		}, 1);
	}
	
	/**
	 * The IDBRequest Object that is returns for all async calls
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
	 */
	var IDBRequest = function(){
		this.onsuccess = this.onerror = null;
		this.result = this.error = null;
		this.source = this.transaction = null;
		this.readyState = "pending";
	};
	
	var IDBOpenRequest = function(){
		this.onblocked = this.onupgradeneeded = null;
	}
	IDBOpenRequest.prototype = IDBRequest;
	
	var Event = function(){
		this.type = null;
	};
	
	/**
	 * The IndexedDB Transaction
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
	 * @param {Object} storeNames
	 * @param {Object} mode
	 * @param {Object} db
	 */
	var IDBTransaction = function(storeNames, mode, db){
		this.mode = mode;
		this.storeNames = storeNames;
		this.db = db;
		this.error = null;
		this.onabort = this.onerror = this.oncomplete = null;
	};
	
	IDBTransaction.prototype.objectStore = function(objectStoreName){
		return new IDBObjectStore(objectStoreName, this);
	};
	
	IDBTransaction.prototype.abort = function(){
	
	};
	
	window.IDBTransaction = window.IDBTransaction || {};
	window.IDBTransaction.READ_ONLY = 0;
	window.IDBTransaction.READ_WRITE = 1;
	window.IDBTransaction.VERSION_CHANGE = 2;
	
	/**
	 * IndexedDB Object Store
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
	 * @param {Object} name
	 * @param {Object} transaction
	 */
	var IDBObjectStore = function(name, transaction){
		this.name = name;
		this.transaction = transaction;
	};
	
	IDBObjectStore.prototype.put = function(value, key){
		console.log(this);
	};
	
	/**
	 * IDB Database Object
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
	 * @param {Object} db
	 */
	var IDBDatabase = function(db, name, version, storeProperties){
		this.__db = db;
		this.version = version;
		this.__storeProperties = storeProperties;
		this.objectStoreNames = [];
		for (var i = 0; i < storeProperties.rows.length; i++) {
			this.objectStoreNames.push(storeProperties.rows.item(i).name);
		}
		this.name = name;
		this.onabort = this.onerror = this.onversionchange = null;
	};
	
	IDBDatabase.prototype.createObjectStore = function(storeName, createOptions){
		this.__db.transaction(function(tx){
			var sql = ["CREATE TABLE", storeName, "(key", (createOptions.authIncrement ? "INT AUTOINCREMENT" : "VARCHAR(255)"), "NOT NULL UNIQUE , value VARCHAR(1000))"].join(" ");
			tx.executeSql(sql, [], function(tx, data){
			}, function(){
				throw new DOMException.constructor(0, "Could not create new database");
			});
			tx.executeSql("INSERT INTO __sys__ VALUES (?,?, ?)", [storeName, createOptions.keyPath, createOptions.autoIncrement ? true : false]);
		});
	};
	
	IDBDatabase.prototype.deleteObjectStore = function(storeName){
		this.__db.transaction(function(tx){
			tx.executeSql("DROP TABLE " + storeName);
			tx.executeSql("DELETE FROM __sys__ WHERE name = ?", storeName);
			this.objectStoreNames.splice(this.objectStoreNames.indexOf(storeName), 1);
		});
	};
	
	IDBDatabase.prototype.close = function(){
		// Don't do anything coz the database automatically closes
	};
	
	IDBDatabase.prototype.transaction = function(storeNames, mode){
		this.transaction = new IDBTransaction(storeNames, mode, this);
		return this.transaction;
	};
	
	return {
		/**
		 * The IndexedDB Method to create a new database and return the DB
		 * @param {Object} name
		 * @param {Object} version
		 */
		"open": function(name, version){
			var req = new IDBOpenRequest();
			var e = new Event();
			
			function openDB(oldVersion){
				var db = window.openDatabase(name, version, name, DEFAULT_DB_SIZE);
				req.readyState = "done";
				if (version <= 0 || oldVersion > version) {
					throw new DOMException.constructor(0, "An attempt was made to open a database using a lower version than the existing version.");
				}
				db.transaction(function(tx){
					tx.executeSql("CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoIncrement boolean)");
					tx.executeSql("SELECT * FROM __sys__", [], function(tx, data){
						e.type = "success";
						req.source = req.result = new IDBDatabase(db, name, version, data);
						if (oldVersion < version) {
							e.oldVersion = oldVersion;
							e.newVersion = version;
							callback("onupgradeneeded", req, [e]);
						}
						callback("onsuccess", req, [e]);
					}, function(){
						e.type = "error";
						callback("onerror", req, [e]);
					});
				});
			};
			
			sysdb.transaction(function(tx){
				tx.executeSql("SELECT * FROM versions where name = ?;", [name], function(tx, data){
					// A DB with this name already exists
					if (data.rows.length === 0) {
						tx.executeSql("INSERT INTO versions VALUES (?,?)", [name, version], function(){
							openDB(0);
						}, function(){
							req.readyState = "done";
							req.error = "DOMError";
							e.type = "error";
							callback("onerror", req, [e]);
						});
					} else {
						openDB(data.rows.item(0).version);
					}
				}, function(){
					req.readyState = "done";
					req.error = "DOMError";
					e.type = "error";
					callback("onerror", req, [e]);
				});
			});
			return req;
		}
	}
})(window, undefined);
