(function(idbModules, undefined){
	/**
	 * IDB Index
	 * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
	 * @param {Object} indexName
	 * @param {Object} keyPath
	 * @param {Object} optionalParameters
	 * @param {Object} transaction
	 */
	function IDBIndex(indexName, idbObjectStore){
		this.indexName = indexName;
		this.__idbObjectStore = this.source = idbObjectStore;
	};
	
	IDBIndex.prototype.__createIndex = function(indexName, keyPath, optionalParameters){
		var me = this;
		var transaction = me.__idbObjectStore.transaction;
		transaction.__addToTransactionQueue(function(tx, args, success, failure){
			me.__idbObjectStore.__getStoreProps(tx, function(){
				function error(){
					idbModules.util.throwDOMException(0, "Could not create new index", arguments);
				}
				if (transaction.mode !== 2) {
					idbModules.util.throwDOMException(0, "Invalid State error, not a version transaction", me.transaction);
				}
				var indexes = JSON.parse(me.__idbObjectStore.__storeProps.indexes);
				if (typeof indexes[indexName] != "undefined") {
					idbModules.util.throwDOMException(0, "Index already exists on store", indexes);
				}
				var columnName = indexName;
				indexes[indexName] = {
					"columnName": columnName,
					"keyPath": keyPath,
					"optionalParams": optionalParameters
				};
				// For this index, first create a column
				var sql = ["ALTER TABLE", me.__idbObjectStore.name, "ADD", columnName, "BLOB"].join(" ");
				console.log(sql);
				tx.executeSql(sql, [], function(tx, data){
					// Once a column is created, put existing records into the index
					tx.executeSql("SELECT * FROM " + me.__idbObjectStore.name, [], function(tx, data){
						(function initIndexForRow(i){
							if (i < data.rows.length) {
								try {
									var value = idbModules.Sca.decode(data.rows.item(i).value);
									var indexKey = eval("value['" + keyPath + "']");
									tx.executeSql("UPDATE " + me.__idbObjectStore.name + " set " + columnName + " = ? where key = ?", [idbModules.Key.encode(indexKey), data.rows.item(i).key], function(tx, data){
										initIndexForRow(i + 1);
									}, error);
								} catch (e) {
									// Not a valid value to insert into index, so just continue
									initIndexForRow(i + 1);
								}
							} else {
								tx.executeSql("UPDATE __sys__ set indexes = ? where name = ?", [JSON.stringify(indexes), me.name], function(){
									me.__idbObjectStore.__setReadyState("createIndex", true);
									success(me);
								}, error);
							}
						})(0);
					}, error);
				}, error);
			}, "createObjectStore");
		});
	};
	
	IDBIndex.prototype.__deleteIndex = function(indexName){
		var transaction = me.__idbObjectStore.transaction;
		transaction.__addToTransactionQueue(function(tx, args, success, failure){
			me.__waitForReady(function(){
				me.__idbObjectStore.__getStoreProps(tx, function(){
					var indexes = JSON.parse(me.__storeProps.indexes);
					if (typeof indexes[indexName] === "undefined") {
						idbModules.util.throwDOMException(0, "Index does not  exist on store", indexes);
					}
					tx.executeSql("UPDATE __sys__ set indexes = ? where name = ?", [JSON.stringify(indexes), me.name], function(){
						me.__setReadyState("createIndex", true);
						success(result);
					}, error);
				});
			});
		});
		
	};
	
	IDBIndex.prototype.openCursor = function(range, direction){
		var cursorRequest = new idbModules.IDBRequest();
		var cursor = new idbModules.IDBCursor(range, direction, this.source, cursorRequest, this.indexName, "value");
		return cursorRequest;
	};
	
	IDBIndex.prototype.openKeyCursor = function(range, direction){
		var cursorRequest = new idbModules.IDBRequest();
		var cursor = new idbModules.IDBCursor(range, direction, this.source, cursorRequest, this.indexName, "key");
		return cursorRequest;
	};
	
	IDBIndex.prototype.get = function(key){
	
	};
	
	IDBIndex.prototype.getKey = function(key){
	
	};
	
	IDBIndex.prototype.count = function(key){
	
	};
	
	idbModules["IDBIndex"] = IDBIndex;
}(idbModules));
