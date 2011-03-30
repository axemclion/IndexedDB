window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;


var linq4idb = function(config){
    var dbPromise = function(dbName){
        return $.Deferred(function(dfd){
            //console.debug("Opening Database", dbName);
            var req = window.indexedDB.open(dbName);
            req.onsuccess = function(){
                //console.debug("Database opened", req.result);
                dfd.resolve(req.result);
            };
            req.onerror = function(e){
                //console.debug("Error while opening database", e);
                dfd.reject(e);
            };
        }).promise();
    };
    
    var versionChangePromise = function(db){
        return $.Deferred(function(dfd){
            var req = db.setVersion(isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1);
            //console.debug("Starting to Changing Version", req);
            req.onsuccess = function(){
                //console.debug("Database version changed to ", req.result);
                req.result.oncomplete = function(){
                    req.result.db.close();
                }
                dfd.resolve(req.result);
            };
            req.onblocked = function(e){
                //console.debug("Transaction is blocked", e);
            };
            req.onerror = function(e){
                //console.debug("Transaction error", e);
                dfd.reject(e);
            };
        }).promise();
    }
    
    var objectStorePromise = function(objectStoreName, dbName, transactionType){
        return $.Deferred(function(dfd){
            $.when(dbPromise(dbName)).then(function(db){
                try {
                    //console.debug("Starting to create transaction");
                    var transaction = db.transaction([objectStoreName], transactionType || IDBTransaction.READ_WRITE);
                    transaction.oncomplete = function(){
                        //console.debug("Transaction Compelte", transaction);
                        db.close();
                    }
                    dfd.resolve(transaction.objectStore(objectStoreName));
                } 
                catch (e) {
                    //console.debug(objectStoreName, "object store not found, so creating it", transactionType);
                    $.when(versionChangePromise(db)).then(function(transaction){
                        transaction.db.createObjectStore(objectStoreName, {
                            "autoIncrement": true,
                            "keyPath": "id"
                        }, true);
                        dfd.resolve(transaction.objectStore(objectStoreName));
                    });
                }
            });
        }).promise();
    };
    
    var indexPromise = function(indexName, objectStorePromise){
        return $.Deferred(function(dfd){
            $.when(objectStorePromise).then(function(objectStore){
                //console.debug("Index on ", indexName, objectStorePromise);
                try {
                    dfd.resolve(objectStore.index(indexName + "-index"));
                } 
                catch (e) {
                    var name = objectStore.transaction.db.name;
                    objectStore.transaction.abort();
                    //console.debug(indexName, "not found, so creating one");
                    $.when(versionChangePromise(objectStore.transaction.db)).then(function(transaction){
                        //console.debug("Database Version Changed, so now creating the index");
                        var index = transaction.objectStore(objectStore.name).createIndex(indexName + "-index", indexName);
                        transaction.oncomplete = function(){
                            transaction.db.close();
                        }
                        //console.debug("Index created", index);
                        dfd.resolve(index);
                    });
                }
            });
        }).promise();
    }
    
    var cursorPromise = function(sourcePromise, range, direction){
        return $.Deferred(function(dfd){
            //console.debug("Opening cursor on ", sourcePromise, range, direction);
            $.when(sourcePromise).then(function(source){
                var req = source.openCursor(range, direction);
                req.onsuccess = function(){
                    dfd.resolve(req);
                };
                req.onerror = function(e){
                    dfd.reject(e);
                }
            });
        }).promise();
    }
    
    var selectObject = function(cursorPromise, projection){
        var iterator = function(callback){
            $.when(cursorPromise).then(function(cursorRequest){
                function iterator(){
                    if (cursorRequest.result) {
                        callback(cursorRequest.result.value, cursorRequest.result.key);
                        cursorRequest.result["continue"]();
                    }
                }
                cursorRequest.onsuccess = iterator;
                iterator();
            });
        }
        return {
            "forEach": iterator,
            "getAll": function(callback){
                var result = [];
                iterator(function(e){
                    result.push[e];
                });
                return result;
            }
        }
    };
    
    return {
        "to": function(objectStoreName){
            return {
                "in": function(dbName){
                    return {
                        "add": function(data){
                            return $.Deferred(function(dfd){
                                $.when(objectStorePromise(objectStoreName, dbName)).then(function(objectStore){
                                    var req = objectStore.add(data);
                                    req.onsuccess = function(){
                                        dfd.resolve(req.result, data);
                                    }
                                });
                            }).promise();
                        }
                    }
                }
            }
        },
        
        "from": function(objectStoreName){
            return {
                "in": function(dbName){
                    return {
                        "orderby": function(sortProperty, direction){
                            return {
                                "select": function(){
                                    return selectObject(cursorPromise(indexPromise(sortProperty, objectStorePromise(objectStoreName, dbName, IDBTransaction.READ)), null, direction));
                                }
                            }
                        },
                        "where": function(property, clause){
                            if (clause.equals) {
                                var range = new IDBKeyRange.bound(clause.equals, clause.equals, false, false);
                            }
                            else 
                                if (clause.range) {
                                    range = new IDBKeyRange.bound(clause.range[0], clause.range[1], clause.range[2], clause.range[3]);
                                }
                            return {
                                "select": function(){
                                    return selectObject(cursorPromise(indexPromise(property, objectStorePromise(objectStoreName, dbName, IDBTransaction.READ)), range));
                                },
                                "orderByDesc": function(){
                                    return {
                                        "select": function(){
                                            return selectObject(cursorPromise(indexPromise(property, objectStorePromise(objectStoreName, dbName, IDBTransaction.READ)), range));
                                        }
                                    }
                                }
                            }
                        },
                        "select": function(){
                            return selectObject(cursorPromise(objectStorePromise(objectStoreName, dbName, IDBTransaction.READ)));
                        }
                    };
                }
            }
        },
        
        "remove": function(objectStoreName){
            return {
                "in": function(dbName){
                    return $.Deferred(function(dfd){
                        $.when(dbPromise(dbName)).then(function(db){
                            $.when(versionChangePromise(db)).then(function(transaction){
                                transaction.db.deleteObjectStore(objectStoreName);
                                //console.debug("Removing", objectStoreName);
                                dfd.resolve(transaction.db);
                            });
                        })
                    }).promise();
                }
            }
        }
    }
};
