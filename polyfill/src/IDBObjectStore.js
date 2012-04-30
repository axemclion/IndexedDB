(function(modules){

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
	IDBObjectStore.prototype.__getStoreProps = function(tx, callback){
		var me = this;
		if (me.__storeProps) {
			modules.util.callback(me.__storeProps);
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
		if (!props) modules.util.throwDOMException(0, "Data Error - Could not locate defination for this table", props);
		if (props.keyPath && key) modules.util.throwDOMException(0, "Data Error - The object store uses in-line keys and the key parameter was provided", props);
		if (!props.keyPath && props.autoInc === "false" && !key) modules.util.throwDOMException(0, "Data Error - The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ", props);
		if (props.keyPath) {
			try {
				key = eval("value" + props.keyPath);
			} catch (e) {
			
			}
		}
		return key;
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
				tx.executeSql(sql.join(" "), sqlValues, function(tx, data){
					success(primaryKey);
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	
	modules["IDBObjectStore"] = IDBObjectStore;
}(modules));
