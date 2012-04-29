(function(modules){

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
				modules.util.throwDOMException(0, "The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.", storeNames);
			}
		}
		this.__active = true;
		this.__requests = [];
		this.__aborted = false;
		this.db = db;
		this.error = null;
		this.onabort = this.onerror = this.oncomplete = null;
		var me = this;
	};
	
	IDBTransaction.prototype.__executeRequests = function(){
		var me = this;
		window.setTimeout(function(){
			!me.__active && modules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
			// Start using the version transaction
			me.db.__db.transaction(function(tx){
				me.__tx = tx;
				var q = null, i = 0;
				try {
					function executeRequest(){
						if (i >= me.__requests.length) {
							me.__active = false; // All requests in the transaction is done
							me.__requests = [];
							return;
						}
						q = me.__requests[i];
						q.op(tx, q["args"], success, error);
					};
					
					function success(result){
						q.req.readyState = "done";
						q.req.result = result;
						delete q.req.error;
						var e = new Event("success");
						modules.util.callback("onsuccess", q.req, [e]);
						i++;
						executeRequest();
					}
					
					function error(){
						q.req.readyState = "done";
						q.req.error = "DOMError";
						var e = new Event();
						e.debug = arguments;
						modules.util.callback("onerror", q.req, [e]);
						i++;
						executeRequest();
					};
					
					executeRequest();
				} catch (e) {
				
				}
			}, function(){
				// Error callback
			}, function(){
				// Transaction completed
			});
		}, 1);
	}
	
	IDBTransaction.prototype.__addToTransactionQueue = function(callback, args){
		!this.__active && modules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished.", this.__active);
		var request = new modules.IDBRequest();
		request.source = this.db;
		this.__requests.push({
			"op": callback,
			"args": args,
			"req": request
		});
		// Start the queue for executing the requests
		this.__executeRequests();
		return request;
	};
	
	IDBTransaction.prototype.objectStore = function(objectStoreName){
		return new IDBObjectStore(objectStoreName, this);
	};
	
	IDBTransaction.prototype.abort = function(){
		!me.__active && modules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
		
	};
	
	IDBTransaction.prototype.READ_ONLY = 0;
	IDBTransaction.prototype.READ_WRITE = 1;
	IDBTransaction.prototype.VERSION_CHANGE = 2;
	
	modules["IDBTransaction"] = IDBTransaction;
	
}(modules));
