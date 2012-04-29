(function(modules){

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
	
	modules["IDBRequest"] = IDBRequest;
	modules["IDBOpenRequest"] = IDBOpenRequest;
	
}(modules));
