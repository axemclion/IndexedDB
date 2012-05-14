(function(idbModules, undefined){

	function IDBCursor(range, direction, idbObjectStore, cursorRequest){
		this.__range = range;
		this.__idbObjectStore = idbObjectStore;
		this.__req = cursorRequest;
		this.__offset = 0;
		
		this.key = undefined;
		this.direction = direction;
		this.source = this.idbObjectStore;
		
		if (!this.__idbObjectStore.transaction.__active) idbModules.util.throwDOMException("TransactionInactiveError - The transaction this IDBObjectStore belongs to is not active.");
		this["continue"]();
	}
	
	IDBCursor.prototype["continue"] = function(){
		var me = this;
		this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
			var sql = "SELECT * FROM " + me.__idbObjectStore.name + " LIMIT 1 OFFSET " + me.__offset;
			tx.executeSql(sql, [], function(tx, data){
				console.log("Got more data for iteration", sql);
				if (data.rows.length === 1) {
					me.key = data.rows.item(0).key;
					me.value = data.rows.item(0).value;
					me.__offset++;
					success(me, me.__req);
				} else {
					console.log("Reached enf of cursors");
					success(undefined, me.__req);
				}
			}, function(tx, data){
				console.log("Could not execute Cursor.continue");
				error(data);
			});
		});
	};
	
	IDBCursor.prototype.update = function(){
	
	};
	
	IDBCursor.prototype.advance = function(){
	
	};
	
	IDBCursor.prototype["delete"] = function(){
	
	};
	
	
	idbModules["IDBCursor"] = IDBCursor;
}(idbModules));
