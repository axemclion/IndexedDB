var promise = {
    db: function(dbName){
        return $.Deferred(function(dfd){
            //console.debug("Starting DB Promise", arguments);
            var req = window.indexedDB.open(dbName);
            req.onsuccess = function(){
                //console.debug("DB Promise resolved", req.result);
                dfd.resolve(req.result);
            }
            req.onerror = function(e){
                //console.debug("DB Promise rejected", req.result);
                dfd.reject(e, req);
            }
        }).promise();
    },
    
    versionTransaction: function(dbPromise, version){
        return $.Deferred(function(dfd){
            $.when(dbPromise).then(function(db){
                //console.debug("Version Change Transaction Promise started", db, version);
                var req = db.setVersion(version || (isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1));
                req.onsuccess = function(){
                    //console.debug("Version Change Transaction Promise completed", req.result);
                    req.result.oncomplete = function(){
                        req.result.db.close();
                    }
                    dfd.resolve(req.result);
                }
                req.onblocked = function(e){
                    //console.debug("Version Change Transaction Promise blocked", e);
                    dfd.reject(e, req);
                }
                req.onerror = function(e){
                    //console.debug("Version Change Transaction Promise error", e);
                    dfd.reject(e, req);
                }
            }, dfd.reject);
        }).promise();
    },
    
    transaction: function(dbPromise, objectStoreNames, transactionType){
        return $.Deferred(function(dfd){
            (typeof objectStoreNames === "string") && (objectStoreNames = [objectStoreNames]);
            $.when(dbPromise).then(function(db){
                //console.debug("Transaction Promise started", db, objectStoreNames, transactionType);
                try {
                    var transaction = db.transaction(objectStoreNames || [], transactionType || IDBTransaction.READ);
                    transaction.oncomplete = function(){
                        //console.debug("Transaction completed");
                        transaction.db.close();
                    }
                    //console.debug("Transaction Promise completed", transaction);
                    dfd.resolve(transaction);
                } 
                catch (e) {
                    dfd.reject(e, db);
                }
            }, dfd.reject);
        }).promise();
        ;
    },
    
    objectStore: function(transactionPromise, objectStoreName, createOptions){
        return $.Deferred(function(dfd){
            $.when(transactionPromise).then(function(transaction){
                //console.debug("ObjectStore Promise started", transactionPromise, objectStoreName, createOptions);
                try {
                    if (createOptions) {
                        transaction.db.createObjectStore(objectStoreName, {
                            "autoIncrement": createOptions.autoIncrement || true,
                            "keyPath": createOptions.keyPath || "id"
                        }, true);
                    }
                    var objectStore = transaction.objectStore(objectStoreName);
                    //console.debug("ObjectStore Promise completed", objectStore);
                    dfd.resolve(objectStore);
                } 
                catch (e) {
                    //console.debug("Error in Object Store Promise", e);
                    dfd.reject(e, transaction.db);
                }
            }, dfd.reject);
        }).promise();
    },
    
    index: function(indexName, objectStorePromise){
        return $.Deferred(function(dfd){
            $.when(objectStorePromise).then(function(objectStore){
                //console.debug("Index Promise started", objectStore)
                try {
                    var index = objectStore.index(indexName + "-index");
                    //console.debug("Index Promise compelted", index);
                    dfd.resolve(index);
                } 
                catch (e) {
                    var name = objectStore.transaction.db.name;
                    objectStore.transaction.abort();
                    objectStore.transaction.db.close();
                    //console.debug("Index Promise requires version change");
                    $.when(promise.versionTransaction(promise.db(name))).then(function(transaction){
                        //console.debug("Index Promise version change transaction started", transaction);
                        try {
                            var index = transaction.objectStore(objectStore.name).createIndex(indexName + "-index", indexName);
                            transaction.oncomplete = function(){
                                transaction.db.close();
                            }
                            //console.debug("Index Promise completed", index);
                            dfd.resolve(index);
                        } 
                        catch (e) {
                            //console.debug("Index Promise Failed", e);
                            dfd.reject(e, transaction);
                        }
                    }, dfd.reject);
                }
            }, dfd.reject);
        }).promise();
    },
    
    cursor: function(sourcePromise, range, direction){
        return $.Deferred(function(dfd){
            $.when(sourcePromise).then(function(source){
                //console.debug("Cursor Promise Started", source);
                var req = source.openCursor(range, direction);
                req.onsuccess = function(){
                    //console.debug("Cursor Promise completed", req);
                    dfd.resolve(req);
                };
                req.onerror = function(e){
                    //console.debug("Cursor Promise error", e, req);
                    dfd.reject(e, req);
                };
            });
        }).promise();
    }
};// end of all promise definations
