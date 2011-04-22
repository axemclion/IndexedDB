(function($){
    $.extend({
        /**
         * The IndexedDB object used to open databases
         * @param {Object} dbName
         * @param {Object} config
         */
        "indexeddb": function(dbName, config){
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
            window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
            window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
            
            var promise = {
                /**
                 * Returns a database promise
                 */
                db: function(dbName){
                    return $.Deferred(function(dfd){
                        console.debug("Starting DB Promise", arguments);
                        var req = window.indexedDB.open(dbName);
                        req.onsuccess = function(){
                            console.debug("DB Promise resolved", req.result);
                            dfd.resolve(req.result);
                        }
                        req.onerror = function(e){
                            console.debug("DB Promise rejected", req.result);
                            dfd.reject(e, req);
                        }
                    }).promise();
                },
                
                /**
                 * Returns a promise for version change transaction.
                 * @param {Object} dbPromise
                 * @param {Object} version - optional. If nothing is specified, version is increased by 1.
                 */
                versionTransaction: function(dbPromise, version){
                    return $.Deferred(function(dfd){
                        dbPromise.then(function(db){
                            console.debug("Version Change Transaction Promise started", db, version);
                            var req = db.setVersion(version || (isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1));
                            req.onsuccess = function(){
                                console.debug("Version Change Transaction Promise completed", req.result);
                                req.result.oncomplete = function(){
                                    console.debug("Transaction Complete, so closing database");
                                    req.result.db.close();
                                }
                                dfd.resolve(req.result);
                            }
                            req.onblocked = function(e){
                                console.debug("Version Change Transaction Promise blocked", e);
                                dfd.reject(e, req);
                            }
                            req.onerror = function(e){
                                console.debug("Version Change Transaction Promise error", e);
                                dfd.reject(e, req);
                            }
                        }, dfd.reject);
                    }).promise();
                },
                
                /**
                 * Returns a new transaction.
                 * @param {Object} dbPromise
                 * @param {Object} objectStoreNames
                 * @param {Object} transactionType
                 */
                transaction: function(dbPromise, objectStoreNames, transactionType){
                    return $.Deferred(function(dfd){
                        (typeof objectStoreNames === "string") && (objectStoreNames = [objectStoreNames]);
                        dbPromise.then(function(db){
                            console.debug("Transaction Promise started", db, objectStoreNames, transactionType);
                            try {
                                var transaction = db.transaction(objectStoreNames || [], transactionType || IDBTransaction.READ);
                                transaction.oncomplete = function(){
                                    console.debug("Transaction completed, so closing database");
                                    transaction.db.close();
                                }
                                console.debug("Transaction Promise completed", transaction);
                                dfd.resolve(transaction);
                            } 
                            catch (e) {
                                console.debug("Error in transaction", e);
                                dfd.reject(e, db);
                            }
                        }, dfd.reject);
                    }).promise();
                    ;
                },
                /**
                 * Returns an object store if available. If object store is not available, tries to create it.
                 * @param {Object} transactionPromise
                 * @param {Object} objectStoreName
                 * @param {Object} createOptions - if specified, the object is created.
                 */
                objectStore: function(transactionPromise, objectStoreName, createOptions){
                    return $.Deferred(function(dfd){
                        transactionPromise.then(function(transaction){
                            console.debug("ObjectStore Promise started", transactionPromise, objectStoreName, createOptions);
                            try {
                                var objectStore = transaction.objectStore(objectStoreName);
                                console.debug("ObjectStore Promise completed", objectStore);
                                dfd.resolve(objectStore);
                            } 
                            catch (e) {
                                console.debug("Object store not found", objectStoreName);
                                try {
                                    if (createOptions) {
                                        console.debug("Create options specified, so trying to create the database")
                                        transaction.db.createObjectStore(objectStoreName, {
                                            "autoIncrement": createOptions.autoIncrement || true,
                                            "keyPath": createOptions.keyPath || "id"
                                        }, true);
                                    }
                                    else {
                                        console.debug("Object store not found and could not create it either", e);
                                        dfd.reject(e, transaction.db);
                                    }
                                } 
                                catch (e) {
                                    console.debug("Error in Object Store Promise", e);
                                    dfd.reject(e, transaction.db);
                                }
                            }
                        }, dfd.reject);
                    }).promise();
                },
                /**
                 * Returns a promise to remove an object store
                 * @param {Object} objectStoreName
                 */
                deleteObjectStore: function(transactionPromise, objectStoreName){
                    return $.Deferred(function(dfd){
                        transactionPromise.then(function(transaction){
                            try {
                                transaction.db.deleteObjectStore(objectStoreName);
                                console.debug("Deleted object store", objectStoreName);
                                dfd.resolve(transaction.db);
                            } 
                            catch (e) {
                                console.debug("Could not delete ", objectStoreName)
                                dfd.reject(e, transaction.db);
                            }
                        }, dfd.reject);
                    }).promise();
                },
                /**
                 * Creates a cursor Promise
                 * @param {Object} sourcePromise - Object Store or Index
                 * @param {Object} range
                 * @param {Object} direction
                 */
                cursor: function(sourcePromise, range, direction){
                    return $.Deferred(function(dfd){
                        sourcePromise.then(function(source){
                            console.debug("Cursor Promise Started", source);
                            var req = source.openCursor(range, direction);
                            req.onsuccess = function(){
                                console.debug("Cursor Promise completed", req);
                                dfd.resolve(req);
                            };
                            req.onerror = function(e){
                                console.debug("Cursor Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },
                /**
                 * Returns an index promise, or creates one if index does not exist
                 * @param {Object} indexName
                 * @param {Object} objectStorePromise
                 */
                index: function(indexName, objectStorePromise){
                    return $.Deferred(function(dfd){
                        objectStorePromise.then(function(objectStore){
                            console.debug("Index Promise started", objectStore)
                            try {
                                var index = objectStore.index(indexName + "-index");
                                console.debug("Index Promise compelted", index);
                                dfd.resolve(index);
                            } 
                            catch (e) {
                                var name = objectStore.transaction.db.name;
                                objectStore.transaction.abort();
                                objectStore.transaction.db.close();
                                console.debug("Index Promise requires version change");
                                $.when(promise.versionTransaction(promise.db(name))).then(function(transaction){
                                    console.debug("Index Promise version change transaction started", transaction);
                                    try {
                                        var index = transaction.objectStore(objectStore.name).createIndex(indexName + "-index", indexName);
                                        transaction.oncomplete = function(){
                                            transaction.db.close();
                                        }
                                        console.debug("Index Promise completed", index);
                                        dfd.resolve(index);
                                    } 
                                    catch (e) {
                                        console.debug("Index Promise Failed", e);
                                        dfd.reject(e, transaction);
                                    }
                                }, dfd.reject);
                            }
                        }, dfd.reject);
                    }).promise();
                },
            }//end of promise object
            /**
             * Returns an objectStore with done, fail, openCursor, etc.
             * @param {Object} objectStoreName
             * @param {Object} canCreate - false: don't create, true|undefined:create with default path, object:create with options
             */
            var objectStore = function(transactionPromise, objectStoreName, createOptions){
                var objectStorePromise = $.Deferred(function(dfd){
                    $.when(promise.objectStore(transactionPromise, objectStoreName)).then(function(objectStore){
                        dfd.resolve(objectStore);
                    }, function(e, db){
                        $.when(promise.objectStore(promise.versionTransaction(dbPromise), objectStoreName, typeof createOptions === "undefined" ? true : createOptions)).then(function(objectStore){
                            dfd.resolve(objectStore);
                        }, dfd.reject);
                    }, dfd.reject);
                }).promise();
                
                var crudOp = function(op, args){
                    return $.Deferred(function(dfd){
                        objectStorePromise.done(function(objectStore){
                            var req = objectStore[op](args);
                            req.onsuccess = function(event){
                                console.debug("Performed", op, req.result);
                                dfd.resolve(req.result);
                            };
                            req.onerror = function(e){
                                dfd.reject(e, req)
                            }
                        });
                    }).promise();
                };
                
                return {
                    "done": objectStorePromise.done,
                    "fail": objectStorePromise.fail,
                    "openCursor": function(range, direction){
                        return cursor(objectStorePromise, range, direction);
                    },
                    "index": function(indexName){
                        return {
                            "openCursor": function(range, direction){
                                return cursor(promise.index(indexName, objectStorePromise), range, direction);
                            }
                        };
                    },
                    "add": function(data){
                        return crudOp("add", data);
                    },
                    "delete": function(objectId){
                        return crudOp("delete", data);
                    },
                    "remove": this["delete"],
                    "get": function(objectId){
                        return crudOp("get", data);
                    },
                    "update": function(data){
                        return crudOp("put", data);
                    },
					"put" : this.update
                }
            };
            
            /**
             * Returns a cursor object with each, getAll, etc.
             * @param {Object} sourcePromise
             * @param {Object} range
             * @param {Object} direction
             */
            var cursor = function(sourcePromise, range, direction){
                var cursorPromise = promise.cursor(sourcePromise, range, direction);
                return {
                    "each": function(callback){
                        cursorPromise.then(function(cursorRequest){
                            function iterator(){
                                if (cursorRequest.result) {
                                    callback(cursorRequest.result.value, cursorRequest.result.key);
                                    cursorRequest.result["continue"]();
                                }
                                cursorRequest.onsuccess = iterator;
                            }
                            cursorRequest.onsuccess = iterator;
                            iterator();
                        }, function(e, req){
                            console.debug("Could not open cursor", e, req);
                        });
                    }
                };
            };
            
            var dbPromise = promise.db(dbName);
            return {
                "done": dbPromise.done,
                "fail": dbPromise.fail,
                /**
                 * Sets the version of a database
                 * @param {Object} callback
                 * @param {Object} versionNumber - optional. If nothing is specified, version is incremented by 1.
                 */
                "setVersion": function(callback, versionNumber){
                    promise.versionTransaction(dbPromise, versionNumber).then(function(e){
                        callback.onsuccess(e);
                    }, function(){
                        callback.onerror.apply(this, arguments);
                    });
                },
                
                /**
                 * Creates a new transaction that can be used to create
                 * @param {Object} objectStoreNames
                 * @param {Object} transactionType - IDBTransaction.
                 */
                "transaction": function(objectStoreNames, transactionType){
                    var transactionPromise = null;
                    if (transactionType === IDBTransaction.VERSION_CHANGE) {
                        transactionPromise = promise.versionTransaction(dbPromise, transactionType);
                    }
                    else {
                        transactionPromise = promise.transaction(dbPromise, objectStoreNames, transactionType);
                    }
                    return {
                        "objectStore": function(objectStoreName, canCreate){
                            return objectStore(transactionPromise, objectStoreName, canCreate);
                        }
                    };
                    
                },
                "objectStore": function(objectStoreName, canCreate){
                    var transactionPromise = promise.transaction(dbPromise, objectStoreName, IDBTransaction.READ_WRITE);
                    return objectStore(transactionPromise, objectStoreName, canCreate);
                },
                /**
                 * Creates a new object store with the set version transaction
                 * @param {Object} objectStoreName
                 * @param {Object} createOptions
                 */
                "createObjectStore": function(objectStoreName, canCreate){
                    objectStore(promise.versionTransaction(dbPromise), objectStoreName, canCreate);
                },
                
                "deleteObjectStore": function(objectStoreName){
                    return promise.deleteObjectStore(promise.versionTransaction(dbPromise), objectStoreName);
                }
            };//end of return values for indexedDB()
        }
    });
})(jQuery);
