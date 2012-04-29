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
	IDBObjectStore.prototype.__getStoreProps = function(callback){
		var me = this;
		if (me.__storeProps) {
			modules.util.callback(me.__storeProps);
		} else {
			this.transaction.db.__db.transaction(function(tx){
				tx.executeSql("SELECT * FROM __sys__ where name = ?", [me.name], function(tx, data){
					me.__storeProps = data.rows.item(0)
					modules.util.callback(me.__storeProps);
				}, function(){
					modules.util.callback();
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
		if (!props) modules.util.throwDOMException(0, "Data Error - Could not locate defination for this table", props);
		if (!props.keyPath && !key) modules.util.throwDOMException(0, "Data Error - keyPath was defined as null, but a key was provided", props);
		if (props.keyPath && key) modules.util.throwDOMException(0, "Data Error - keyPath was defined, but a key was NOT provided", props);
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
	
	
	modules["IDBObjectStore"] = IDBObjectStore;
}(modules));
