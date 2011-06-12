            function data(){
                return {
                    "bookName": "bookName-" + parseInt(Math.random() * 100),
                    "price": parseInt(Math.random() * 1000),
                    "checkedOut": new Date()
                }
            };
            function clear(){
                $("#console").empty();
            }
            
            var write = function(){
                $("#console").append($("<div >").html(JSON.stringify(arguments)));
                // console.info.apply(this, arguments);
            };
            
            var writeError = function(){
                $("#console").append($("<div style = 'color:RED' >").html(JSON.stringify(arguments)));
                // console.error.apply(this, arguments);
            }
            
            var examples = {
                "Set Version": function(){
                    $.indexeddb("BookShop-1").setVersion(10).then(write, writeError);
                },
                
                "Transaction": function(){
                    var transaction = $.indexeddb("BookShop-1").transaction([], IDBTransaction.READ_WRITE);
                    transaction.then(write, writeError);
                    transaction.objectStore("BookList").add(data()).then(write, writeError);
                    transaction.objectStore("OldBookList").add(data()).then(write, writeError);
                },
                
                "Create Object Store": function(){
                    $.indexeddb("BookShop-1").createObjectStore("BookList", {
                        "keyPath": "id",
                        "autoIncrement": true
                    }).then(write, writeError);
                },
                
                "Delete Object Store": function(){
                    $.indexeddb("BookShop-1").deleteObjectStore("BookList", false).then(write, writeError);
                },
                
                "Open Object Store, but dont create if does not exist": function(){
                    $.indexeddb("BookShop-1").objectStore("BookList", false).then(write, writeError);
                },
                
                "Open Object Store, or create if does not exist": function(){
                    $.indexeddb("BookShop-1").objectStore("BookList", {
                        "keyPath": "id",
                        "autoIncrement": true
                    }).then(write, writeError);
                },
                
                "Add Data to Object Store": function(){
                    window.book = data();
                    $.indexeddb("BookShop-1").objectStore("BookList").add(book).then(function(val){
                        book.id = val;
                        write(val);
                    }, writeError);
                },
                
                "Get data": function(){
                    $.indexeddb("BookShop-1").objectStore("BookList").get(book.id).then(write, writeError);
                },
                
                "Modify Data in Object Store": function(){
                    book["modified" + Math.random()] = true;
                    $.indexeddb("BookShop-1").objectStore("BookList").update(book).then(write, writeError);
                },
                
                "Cursor and list all items in the object store": function(){
                    $.indexeddb("BookShop-1").objectStore("BookList").openCursor().each(write);
                },
                
                "Cursor and delete items with price that is an odd number": function(){
                    $.indexeddb("BookShop-1").objectStore("BookList").openCursor().deleteEach(function(value, key){
                        if (parseInt(Math.random() * 10 % 2)) {
                            write("Deleting", value);
                            return true;
                        }
                    });
                },
                
                "Cursor and update items with price that is an odd number": function(){
                    $.indexeddb("BookShop-1").objectStore("BookList").openCursor().updateEach(function(value){
                        if (parseInt(Math.random() * 10 % 2)) {
                            value["modified-" + Math.random()] = true;
                            write("Updating", value);
                            return value;
                        }
                    });
                },
                "Open an Index and iterate over its objects": function(){
                    $.indexeddb("BookShop-1").objectStore("BookList").index("price").openCursor().each(write);
                },
                
                "Open a key cursor on an Index and iterate over its objects": function(){
                    $.indexeddb("BookShop-1").objectStore("BookList").index("price").openKeyCursor([200, 500]).each(write);
                },
            };
