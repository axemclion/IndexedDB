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
		tx.executeSql("SELECT * FROM dbVersions", [], function(t, data){
			// dbVersions already exists
		}, function(){
			// dbVersions does not exist, so creating it
			sysdb.transaction(function(tx){
				tx.executeSql("CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);", [], function(){
				}, function(){
					throw new Error("Could not create table __sysdb__ to save DB versions");
				});
			});
		});
	}, function(){
		// sysdb Transaction failed
		throw new Error("Could not create table __sysdb__ to save DB versions");
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
	 * Throws a new DOM Exception,
	 * @param {Object} name
	 * @param {Object} message
	 * @param {Object} error
	 */
	function throwDOMException(name, message, error){
		console.log(name, message, error);
		var e = new DOMException.constructor(0, message);
		e.name = name;
		e.message = message;
		e.stack = arguments.callee.caller;
		throw e;
	}
	
	/**
	 * The IDBRequest Object that is returns for all async calls
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
	 */
	var IDBRequest = function(){
		this.onsuccess = this.onerror = this.result = this.error = this.source = this.transaction = null;
		this.readyState = "pending";
	};
	/**
	 * The IDBOpen Request called when a database is opened
	 */
	var IDBOpenRequest = function(){
		this.onblocked = this.onupgradeneeded = null;
	}
	IDBOpenRequest.prototype = IDBRequest;
	
	/**
	 * Event Object, emulating the browser events
	 */
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
		this.storeNames = typeof storeNames === "string" ? [storeNames] : storeNames;
		for (var i = 0; i < this.storeNames.length; i++) {
			if (db.objectStoreNames.indexOf(storeNames[i]) === -1) {
				throwDOMException(0, "The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.", storeNames);
			}
		}
		this.__closePending = null;
		this.__active = true;
		this.__requests = [];
		this.__aborted = false;
		var me = this;
		window.setTimeout(function(){
			!me.__active && throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
			me.db.transaction(function(tx){
				me.__tx = tx;
				try {
					(function executeRequest(i){
						if (i >= me.__requests.length) {
							// All requests in the transaction is done
							me.__active = false;
							return;
						}
						var q = me.__requests(i)
						q.op(q["args"], {
							"success": function(res, e){
								q.req.readyState = "done";
								q.result = res
								delete q.req.error;
								callback("onsuccess", q.req, [e]);
								executeRequest(i + 1)
							},
							"error": function(){
							
							}
						});
					}(me.__requests[0]));
				} catch (e) {
				
				}
			}, function(){
				// Error callback
			}, function(){
				// Transaction completed
			});
			
			me.__active = false;
		}, 1);
		this.db = db;
		this.error = null;
		this.onabort = this.onerror = this.oncomplete = null;
	};
	
	IDBTransaction.prototype.__addToTransactionQueue = function(callback, args){
		!this.__active && throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished.", this.__active);
		var request = new IDBRequest;
		request.source = this.db;
		this.__requests.push({
			"op": callback,
			"args": args,
			"req": request
		});
		return request;
	};
	
	IDBTransaction.prototype.objectStore = function(objectStoreName){
		return new IDBObjectStore(objectStoreName, this);
	};
	
	IDBTransaction.prototype.abort = function(){
		!me.__active && throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
		
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
	var IDBObjectStore = function(name, transaction, ready){
		this.name = name;
		this.transaction = transaction;
		this.__ready = (typeof ready === "undefined") ? true : false;
	};
	
	/**
	 * Gets (and optionally caches) the properties like keyPath, autoincrement, etc for this objectStore
	 * @param {Object} callback
	 */
	IDBObjectStore.prototype.__getStoreProps = function(callback){
		var me = this;
		if (me.__storeProps) {
			callback(me.__storeProps);
		} else {
			this.transaction.db.__db.transaction(function(tx){
				tx.executeSql("SELECT * FROM __sys__ where name = ?", [me.name], function(tx, data){
					me.__storeProps = data.rows.item(0)
					callback(me.__storeProps);
				}, function(){
					callback();
				});
			});
		}
	};
	
	/**
	 * From the store properties and object, extracts the value for the key in hte object Store
	 * @param {Object} props
	 * @param {Object} value
	 * @param {Object} key
	 */
	IDBObjectStore.prototype.__getKey = function(props, value, key){
		if (!props) throwDOMException(0, "Data Error - Could not locate defination for this table", props);
		if (!props.keyPath && !key) throwDOMException(0, "Data Error - keyPath was defined as null, but a key was provided", props);
		if (props.keyPath && key) throwDOMException(0, "Data Error - keyPath was defined, but a key was NOT provided", props);
		if (props.keyPath) {
			try {
				key = eval("value" + props.keyPath)
			} catch (e) {
			
			}
		}
	};
	
	/**
	 * Checks if an insert is allowed in this object
	 * @param {Object} props
	 * @param {Object} value
	 * @param {Object} key
	 */
	IDBObjectStore.prototype.__getKey = function(props, value, key){
		//TODO Check insert constraints
	}
	
	IDBObjectStore.prototype.add = function(value, key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args){
			this.__getStoreProps(function(props){
				me.__checkInsert(props, value, key);
				tx.executeSql(function(){
				
				}, function(){
				
				});
			});
		});
	};
	
	/**
	 * IDB Database Object
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
	 * @param {Object} db
	 */
	var IDBDatabase = function(db, name, version, storeProperties){
		this.__db = db, this.version = version, this.__storeProperties = storeProperties;
		this.objectStoreNames = [];
		for (var i = 0; i < storeProperties.rows.length; i++) {
			this.objectStoreNames.push(storeProperties.rows.item(i).name);
		}
		this.name = name;
		this.onabort = this.onerror = this.onversionchange = null;
	};
	
	IDBDatabase.prototype.createObjectStore = function(storeName, createOptions){
		createOptions = createOptions || {};
		createOptions.keyPath = createOptions.keyPath || null;
		function error(){
			throwDOMException(0, "Could not create new database", arguments);
		}
		var me = this;
		if (me.transaction && me.transaction.mode !== 2) {
			throwDOMException(0, "Invalid State error", me.transaction);
		}
		
		var result = new IDBObjectStore(storeName, me.transaction, false);
		// Should not push here. Pushing here does not gurantee that it was correct
		me.objectStoreNames.push(storeName);
		
		me.__db.transaction(function(tx){
			//key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
			var sql = ["CREATE TABLE", storeName, "(key", createOptions.autoIncrement ? "INTEGER" : "VARCHAR(255)", "PRIMARY KEY", createOptions.autoIncrement ? "AUTOINCREMENT" : "", " NOT NULL UNIQUE , value VARCHAR(10000))"].join(" ");
			//console.log(sql);
			tx.executeSql(sql, [], function(tx, data){
				tx.executeSql("INSERT INTO __sys__ VALUES (?,?,?)", [storeName, createOptions.keyPath, createOptions.autoIncrement ? true : false], function(){
					result.__ready = true;
				}, error);
			}, error);
		});
		
		// The IndexedDB Specification needs us to return an Object Store immediatly, but WebSQL does not create and return the store immediatly
		// Hence, this can technically be unusable, and we hack around it, by setting the ready value to false
		return result;
	};
	
	IDBDatabase.prototype.deleteObjectStore = function(storeName){
		var error = function(){
			throwDOMException(0, "Could not create new database", arguments);
		}
		var me = this;
		if (me.transaction && me.transaction.mode !== 2) {
			throwDOMException(0, "Invalid State error", me.transaction);
		}
		me.objectStoreNames.splice(me.objectStoreNames.indexOf(storeName), 1);
		me.__db.transaction(function(tx){
			tx.executeSql("DROP TABLE " + storeName, [], function(){
				tx.executeSql("DELETE FROM __sys__ WHERE name = ?", [storeName], function(){
				}, error);
			}, error);
		});
	};
	
	IDBDatabase.prototype.close = function(){
		// Don't do anything coz the database automatically closes
	};
	
	IDBDatabase.prototype.transaction = function(storeNames, mode){
		var transaction = new IDBTransaction(storeNames, mode, this);
		return transaction;
	};
	
	return {
		"deleteDatabase": function(name){
			var req = new IDBOpenRequest();
			var e = new Event();
			var calledDBError = false;
			function dbError(msg){
				if (calledDBError) {
					return;
				}
				req.readyState = "done";
				req.error = "DOMError";
				e.type = "error";
				e.message = msg;
				e.debug = arguments;
				callback("onerror", req, [e]);
				calledDBError = true;
			}
			
			sysdb.transaction(function(systx){
				systx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data){
					if (data.rows.length === 0) {
						dbError("Database does not exist");
						return;
					}
					var version = data.rows.item(0).version;
					var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
					db.transaction(function(tx){
						tx.executeSql("SELECT * FROM __sys__", [], function(tx, data){
							var tables = data.rows;
							(function deleteTables(i){
								if (i >= tables.length) {
									// If all tables are deleted, delete the housekeeping tables
									tx.executeSql("DROP TABLE __sys__", [], function(){
										// Finally, delete the record for this DB from sysdb
										sysdb.transaction(function(systx){
											systx.executeSql("DELETE FROM dbVersions where name = ? ", [name], function(){
												req.result = undefined;
												e.type = "success", e.newVersion = null, e.oldVersion = version;
												callback("onsuccess", req, [e]);
											}, dbError);
										}, dbError);
									}, dbError);
								} else {
									// Delete all tables in this database, maintained in the sys table
									tx.executeSql("DROP TABLE " + tables.item(i).name, [], function(){
										deleteTables(i + 1);
									}, function(){
										deleteTables(i + 1);
									});
								}
							}(0));
						});
					}, dbError);
				});
			}, dbError);
			return req;
		},
		
		/**
		 * The IndexedDB Method to create a new database and return the DB
		 * @param {Object} name
		 * @param {Object} version
		 */
		"open": function(name, version){
			var req = new IDBOpenRequest();
			var e = new Event();
			var calledDbCreateError = false;
			function dbCreateError(){
				if (calledDbCreateError) {
					return;
				}
				req.readyState = "done";
				req.error = "DOMError";
				e.type = "error";
				e.debug = arguments;
				callback("onerror", req, [e]);
				calledDbCreateError = true
			}
			
			function openDB(oldVersion){
				var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
				req.readyState = "done";
				if (version <= 0 || oldVersion > version) {
					throwDOMException(0, "An attempt was made to open a database using a lower version than the existing version.", version);
				}
				db.transaction(function(tx){
					tx.executeSql("CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN)", [], function(){
						tx.executeSql("SELECT * FROM __sys__ where name = ?", [name], function(tx, data){
							e.type = "success";
							req.source = req.result = new IDBDatabase(db, name, version, data);
							if (oldVersion < version) {
								sysdb.transaction(function(systx){
									systx.executeSql("UPDATE dbVersions set version = ? where name = ?", [version, name], function(){
										e.oldVersion = oldVersion, e.newVersion = version;
										req.result.transaction([], 2);
										callback("onupgradeneeded", req, [e]);
										req.result.transaction = null;
										callback("onsuccess", req, [e]);
									}, dbCreateError);
								}, dbCreateError);
							} else {
								callback("onsuccess", req, [e]);
							}
						}, dbCreateError);
					}, dbCreateError);
				}, dbCreateError);
			};
			
			sysdb.transaction(function(tx){
				tx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data){
					if (data.rows.length === 0) {
						// Database with this name does not exist
						tx.executeSql("INSERT INTO dbVersions VALUES (?,?)", [name, version || 1], function(){
							openDB(1);
						}, dbCreateError);
					} else {
						openDB(data.rows.item(0).version);
					}
				}, dbCreateError);
			}, dbCreateError);
			return req;
		}
	}
})(window, undefined);
