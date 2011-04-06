(function($){
    $.extend({
        linq4idb: function(config){
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
            window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
            window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
            
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
            var selectObject = function(cursorPromise, projection){
                return {
                    "forEach": function(callback){
                        $.when(cursorPromise).then(function(cursorRequest){
                            function iterator(){
                                if (cursorRequest.result) {
                                    callback(cursorRequest.result.value, cursorRequest.result.key);
                                    cursorRequest.result["continue"]();
                                }
                                cursorRequest.onsuccess = iterator;
                            }
                            cursorRequest.onsuccess = iterator;
                            iterator();
                        })
                    },
                    "getAll": function(callback){
                        $.when(cursorPromise).then(function(cursorRequest){
                            //callback(cursorRequest.getAll());
                        });
                    }
                }
            };
            
            var objectStorePromise = function(dbName, objectStoreName, transactionType){
                return $.Deferred(function(dfd){
                    var dbPromise = promise.db(dbName);
                    $.when(promise.objectStore(promise.transaction(dbPromise, objectStoreName, transactionType), objectStoreName)).then(function(objectStore){
                        dfd.resolve(objectStore);
                    }, function(e, db){
                        $.when(promise.objectStore(promise.versionTransaction(dbPromise), objectStoreName, {
                            "keyPath": "id",
                            "autoIncrement": true
                        })).then(function(objectStore){
                            dfd.resolve(objectStore);
                        });
                    });
                }).promise();
            };
            
            return {
                "to": function(objectStoreName){
                    return {
                        "in": function(dbName){
                            return {
                                "add": function(data){
                                    return $.Deferred(function(dfd){
                                        $.when(objectStorePromise(dbName, objectStoreName, IDBTransaction.READ_WRITE)).then(function(objectStore){
                                            var req = objectStore.add(data);
                                            req.onsuccess = function(){
                                                dfd.resolve(data);
                                            }
                                            req.onerror = function(e){
                                                dfd.reject(e, req);
                                            }
                                        }, dfd.reject);
                                    }).promise();
                                }
                            };
                        }
                    };
                },
                
                "from": function(objectStoreName){
                    return {
                        "in": function(dbName){
                            return {
                                "orderby": function(sortProperty, direction){
                                    return {
                                        "select": function(){
                                            return selectObject(promise.cursor(promise.index(sortProperty, objectStorePromise(dbName, objectStoreName, IDBTransaction.READ)), null, direction));
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
                                            return selectObject(promise.cursor(promise.index(property, objectStorePromise(dbName, objectStoreName, IDBTransaction.READ)), range));
                                        },
                                        "orderByDesc": function(){
                                            return {
                                                "select": function(){
                                                    {
                                                        return selectObject(promise.cursor(promise.index(property, objectStorePromise(dbName, objectStoreName, IDBTransaction.READ)), range));
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "select": function(){
                                    return selectObject(promise.cursor(objectStorePromise(dbName, objectStoreName, IDBTransaction.READ)));
                                }
                            };
                        }
                    }
                },
                
                "remove": function(objectStoreName){
                    return {
                        "in": function(dbName){
                            return $.Deferred(function(dfd){
                                $.when(promise.versionTransaction(promise.db(dbName))).then(function(transaction){
                                    try {
                                        transaction.db.deleteObjectStore(objectStoreName);
                                        dfd.resolve(transaction.db);
                                    } 
                                    catch (e) {
                                        dfd.reject(e, transaction);
                                    }
                                }, dfd.reject);
                            }).promise();
                        }
                    }
                }
            }
        }
        
    });
})(jQuery);
