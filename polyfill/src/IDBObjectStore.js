(function(idbModules){

	/**
	 * IndexedDB Object Store
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
	 * @param {Object} name
	 * @param {Object} transaction
	 */
	var IDBObjectStore = function(name, idbTransaction, ready){
		this.name = name;
		this.transaction = idbTransaction;
		this.__setReadyState(ready);
	};
	
	/**
	 * Need this flag as createObjectStore is synchronous. So, we simply return when create ObjectStore is called
	 * but do the processing in the background. All other operations should wait till ready is set
	 * @param {Object} val
	 */
	IDBObjectStore.prototype.__setReadyState = function(val){
		this.__ready = (typeof ready === "undefined") ? true : false;
		var me = this;
	};
	
	/**
	 * Called by all operations on the object store, waits till the store is ready, and then performs the operation
	 * @param {Object} callback
	 */
	IDBObjectStore.prototype.__waitForReady = function(callback){
		if (this.__ready) {
			callback();
		} else {
			console.log("Waiting for objectstore to be ready");
			var me = this;
			window.setTimeout(function(){
				me.__waitForReady(callback);
			}, 100);
		}
	}
	
	/**
	 * Gets (and optionally caches) the properties like keyPath, autoincrement, etc for this objectStore
	 * @param {Object} callback
	 */
	IDBObjectStore.prototype.__getStoreProps = function(tx, callback){
		var me = this;
		this.__waitForReady(function(){
			if (me.__storeProps) {
				callback(me.__storeProps);
			} else {
				tx.executeSql("SELECT * FROM __sys__ where name = ?", [me.name], function(tx, data){
					if (data.rows.length !== 1) {
						callback();
					} else {
						me.__storeProps = data.rows.item(0);
						callback(me.__storeProps);
					}
				}, function(){
					callback();
				});
			}
		});
	};
	
	/**
	 * From the store properties and object, extracts the value for the key in hte object Store
	 * If the table has auto increment, get the next in sequence
	 * @param {Object} props
	 * @param {Object} value
	 * @param {Object} key
	 */
	IDBObjectStore.prototype.__deriveKey = function(tx, value, key, callback){
		function getNextAutoIncKey(){
			tx.executeSql("SELECT * FROM sqlite_sequence where name like ?", [me.name], function(tx, data){
				if (data.rows.length !== 1) {
					idbModules.util.throwDOMException(0, "Data Error - Could not get the auto increment value for key, no auto Inc value returned", data.rows);
				} else {
					callback(idbModules.Key.encode(data.rows.item(0).seq));
				}
			}, function(tx, error){
				idbModules.util.throwDOMException(0, "Data Error - Could not get the auto increment value for key", error);
			});
		}
		
		var me = this;
		me.__getStoreProps(tx, function(props){
			if (!props) idbModules.util.throwDOMException(0, "Data Error - Could not locate defination for this table", props);
			
			if (props.keyPath) {
				if (key) {
					idbModules.util.throwDOMException(0, "Data Error - The object store uses in-line keys and the key parameter was provided", props);
				}
				if (value) {
					try {
						var primaryKey = eval("value['" + props.keyPath + "']");
						if (!primaryKey) {
							if (props.autoInc === "true") {
								getNextAutoIncKey();
							} else {
								idbModules.util.throwDOMException(0, "Data Error - Could not eval key from keyPath", e);
							}
						} else {
							callback(primaryKey);
						}
					} catch (e) {
						idbModules.util.throwDOMException(0, "Data Error - Could not eval key from keyPath", e);
					}
				} else {
					idbModules.util.throwDOMException(0, "Data Error - KeyPath was specified, but value was not", e);
				}
			} else {
				if (key) {
					callback(idbModules.Key.encode(key));
				} else {
					if (props.autoInc === "false") {
						idbModules.util.throwDOMException(0, "Data Error - The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ", props);
					} else {
						// Looks like this has autoInc, so lets get the next in sequence and return that.
						getNextAutoIncKey();
					}
				}
			}
		});
	};
	
	function insertData(tx, storeName, value, primaryKey, success, error){
		var sqlValues = [idbModules.Sca.encode(value)];
		var sql = ["INSERT INTO", storeName];
		sql.push(!primaryKey ? "(value)" : "(value, key)");
		sql.push("VALUES (?");
		primaryKey && (sql.push(",?"), sqlValues.push(primaryKey));
		sql.push(")");
		console.log("SQL for adding", sql.join(" "), sqlValues);
		tx.executeSql(sql.join(" "), sqlValues, function(tx, data){
			success(idbModules.Key.decode(primaryKey));
		}, function(tx, err){
			error(err);
		});
	}
	
	IDBObjectStore.prototype.add = function(value, key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__deriveKey(tx, value, key, function(primaryKey){
				insertData(tx, me.name, value, primaryKey, success, error);
			});
		});
	};
	
	IDBObjectStore.prototype.put = function(value, key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__deriveKey(tx, value, key, function(primaryKey){
				var sql = "UPDATE " + me.name + " SET value = ? where key = ?";
				console.log("Updating", sql, [JSON.stringify(value), primaryKey]);
				tx.executeSql(sql, [JSON.stringify(value), primaryKey], function(tx, data){
					if (data.rowsAffected === 1) {
						success(idbModules.Key.decode(primaryKey));
					} else {
						// Looks like the data did not exist, lets try adding it
						console.log("Could not update data as it did not exist, so trying to add it now");
						insertData(tx, me.name, value, primaryKey, success, error);
					}
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	IDBObjectStore.prototype.get = function(key){
		// TODO Key should also be a key range
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__waitForReady(function(){
				var primaryKey = idbModules.Key.encode(key);
				console.log("Fetching", me.name, primaryKey);
				tx.executeSql("SELECT * FROM " + me.name + " where key = ?", [primaryKey], function(tx, data){
					console.log("Fetched data", data.rows.item(0));
					try {
						success(JSON.parse(data.rows.item(0).value));
					} catch (e) {
						console.log(e)
						// If no result is returned, or error occurs when parsing JSON
						success(undefined);
					}
				}, function(tx, err){
					error(err);
				});
			});
		});
	}
	
	IDBObjectStore.prototype["delete"] = function(key){
		// TODO key should also support key ranges
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__waitForReady(function(){
				var primaryKey = idbModules.Key.encode(key);
				console.log("Fetching", me.name, primaryKey);
				tx.executeSql("DELETE FROM " + me.name + " where key = ?", [primaryKey], function(tx, data){
					console.log("Deleted from database", data.rowsAffected);
					success();
				}, function(tx, err){
					error(err);
				});
			});
		});
	}
	
	IDBObjectStore.prototype.clear = function(){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__waitForReady(function(){
				var primaryKey = idbModules.Key.encode(key);
				console.log("Fetching", me.name, primaryKey);
				tx.executeSql("DELETE FROM " + me.name, [], function(tx, data){
					console.log("Cleared all records from database", data.rowsAffected);
					success();
				}, function(tx, err){
					error(err);
				});
			});
		});
	}
	
	IDBObjectStore.prototype.count = function(){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__waitForReady(function(){
				var sql = "SELECT * FROM " + me.name + ((key !== "undefined") ? " WHERE key = ?" : "");
				var sqlValues = [];
				key && sqlValues.push(idbModules.Key.encode(key))
				tx.executeSql(sql, sqlValues, function(tx, data){
					success(data.rows.length);
				}, function(tx, err){
					error(err);
				});
			});
		});
	}
	
	IDBObjectStore.prototype.openCursor = function(range, direction){
		var me = this;
		var cursorRequest = new idbModules.IDBRequest();
		var cursor = new idbModules.IDBCursor(range, direction, this, cursorRequest);
		return cursorRequest;
	}
	
	idbModules["IDBObjectStore"] = IDBObjectStore;
}(idbModules));
