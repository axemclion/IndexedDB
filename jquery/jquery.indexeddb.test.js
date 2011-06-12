function data(){
    return {
        "bookName": "bookName-" + parseInt(Math.random() * 100),
        "price": parseInt(Math.random() * 1000),
        "checkedOut": new Date()
    }
};

window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

var jqueryIndexedDB_Test = {
    "Set Version": {
        "code": function(){
            $.indexeddb("BookShop1").setVersion(10).then(console.info, console.error);
        },
        "alternate": function(){
            var request = window.indexedDB.open("BookShop1");
            request.onsuccess = function(event){
                var db = request.result;
                var req = db.setVersion(isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1);
                req.onsuccess = function(){
                    console.info(req.result);
                };
                req.onerror = function(e){
                    console.error(e, req);
                };
            };
        }
    },
    
    "Transaction": {
        "code": function(){
            var transaction = $.indexeddb("BookShop1").transaction([], IDBTransaction.READ_WRITE);
            transaction.then(console.info, console.error);
            transaction.objectStore("BookList").add(data()).then(console.info, console.error);
            transaction.objectStore("OldBookList").add(data(), new Date().getTime()).then(console.info, console.error);
        },
        "alternate": function(){
        
        }
    },
    
    "Create Object Store": {
        "code": function(){
            $.indexeddb("BookShop1").createObjectStore("BookList", {
                "keyPath": "id",
                "autoIncrement": true
            }).then(console.info, console.error);
        },
        "alternate": function(){
        
        }
    },
    
    "Delete Object Store": {
        "code": function(){
            $.indexeddb("BookShop1").deleteObjectStore("BookList", false).then(console.info, console.error);
        },
        "alternate": function(){
        
        }
    },
    
    "Open Object Store, but dont create if does not exist": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList", false).then(console.info, console.error);
        },
        "alternate": function(){
        
        }
    },
    
    "Open Object Store, or create if does not exist": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList", {
                "keyPath": "id",
                "autoIncrement": true
            }).then(console.info, console.error);
        },
        "alternate": function(){
        
        }
    },
    
    "Add Data to Object Store": {
        "code": function(){
            window.book = data();
            $.indexeddb("BookShop1").objectStore("BookList").add(book).then(function(val){
                book.id = val;
                console.info(val);
            }, console.error);
        },
        "alternate": function(){
        
        }
    },
    
    "Get data": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList").get(book.id).then(console.info, console.error);
        },
        "alternate": function(){
        
        }
    },
    
    "Modify Data in Object Store": {
        "code": function(){
            book["modified" + Math.random()] = true;
            $.indexeddb("BookShop1").objectStore("BookList").update(book).then(console.info, console.error);
        },
        "alternate": function(){
        
        }
    },
    
    "Cursor and list all items in the object store": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList").openCursor().each(console.info);
        },
        "alternate": function(){
        
        }
    },
    
    "Cursor and delete items with price that is an odd number": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList").openCursor().deleteEach(function(value, key){
                if (parseInt(Math.random() * 10 % 2)) {
                    console.info("Deleting", value);
                    return true;
                }
            });
        },
        "alternate": function(){
        
        }
    },
    
    "Cursor and update items with price that is an odd number": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList").openCursor().updateEach(function(value){
                if (parseInt(Math.random() * 10 % 2)) {
                    value["modified-" + Math.random()] = true;
                    console.info("Updating", value);
                    return value;
                }
            });
        },
        "alternate": function(){
        
        }
    },
    "Open an Index and iterate over its objects": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList").index("price").openCursor().each(console.info);
        },
        "alternate": function(){
        
        }
    },
    
    "Open a key cursor on an Index and iterate over its objects": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList").index("price").openKeyCursor([200, 500]).each(console.info);
        },
        "alternate": function(){
        
        }
    }
};
