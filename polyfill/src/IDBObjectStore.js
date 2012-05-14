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
		this.__ready = (typeof ready === "undefined") ? true : false;
	};
	
	/**
	 * Gets (and optionally caches) the properties like keyPath, autoincrement, etc for this objectStore
	 * @param {Object} callback
	 */
	IDBObjectStore.prototype.__getStoreProps = function(tx, callback){
		var me = this;
		if (me.__storeProps) {
			callback(me.__storeProps);
		} else {
			tx.executeSql("SELECT * FROM __sys__ where name = ?", [me.name], function(tx, data){
				me.__storeProps = data.rows.item(0)
				callback(me.__storeProps);
			}, function(){
				callback();
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
		if (!props) idbModules.util.throwDOMException(0, "Data Error - Could not locate defination for this table", props);
		if (props.keyPath && key) idbModules.util.throwDOMException(0, "Data Error - The object store uses in-line keys and the key parameter was provided", props);
		if (!props.keyPath && props.autoInc === "false" && !key) idbModules.util.throwDOMException(0, "Data Error - The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ", props);
		if (props.keyPath && value) {
			try {
				key = eval("value" + props.keyPath);
				console.log("Got key from keyPath", key);
			} catch (e) {
			
			}
		}
		console.log("Value of key is ", key, "from", key, value, props);
		// TODO ensure that the collations are maintained across different types of key
		return key + "";
	};
	
	IDBObjectStore.prototype.add = function(value, key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__getStoreProps(tx, function(props){
				var primaryKey = me.__getKey(props, value, key);
				var sqlValues = [JSON.stringify(value)];
				var sql = ["INSERT INTO", me.name];
				sql.push(!primaryKey ? "(value)" : "(value, key)");
				sql.push("VALUES (?");
				primaryKey && (sql.push(",?"), sqlValues.push(primaryKey));
				sql.push(")");
				console.log("SQL for adding", sql.join(" "), sqlValues);
				tx.executeSql(sql.join(" "), sqlValues, function(tx, data){
					success(primaryKey);
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	IDBObjectStore.prototype.put = function(value, key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__getStoreProps(tx, function(props){
				var primaryKey = me.__getKey(props, value, key);
				console.log("Updating", me.name, value, primaryKey);
				tx.executeSql("UPDATE " + me.name + " SET value = ? where key = ?", [JSON.stringify(value), primaryKey], function(tx, data){
					success(primaryKey);
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	IDBObjectStore.prototype.get = function(key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__getStoreProps(tx, function(props){
				var primaryKey = me.__getKey(props, null, key);
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
	
	IDBObjectStore.prototype["delete"] = function(value, key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__getStoreProps(tx, function(props){
				var primaryKey = me.__getKey(props, null, key);
				console.log("Fetching", me.name, primaryKey);
				tx.executeSql("DELETE FROM " + me.name + " where key = ?", [primaryKey], function(tx, data){
					console.log("Fetched data", data.rows.item(0));
					success(primaryKey);
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
