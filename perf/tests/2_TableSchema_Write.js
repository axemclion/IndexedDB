(function(s) {
  s['Table Schema Write'] = {
    category : 'ObjectStore',
    desc : 'Is it faster to queue up write requests in a single transaction, or start multiple transactions with with writes requests batched in them',
    _bTestKey: 'agt1YS1wcm9maWxlcnINCxIEVGVzdBjt9acUDA',
    onStart: function(cb) {
      $.indexedDB('IndexedDBPerf').deleteDatabase().done(function() {
        $.indexedDB('IndexedDBPerf', {
          schema: {
            1: function(transaction) {
              var table1 = transaction.createObjectStore("Table1", {
                'autoIncrement': false
              });

              var table2 = transaction.createObjectStore("Table2", {
                'keyPath': 'id',
                'autoIncrement': true
              });
              var table3 = transaction.createObjectStore("Table3", {
                'keyPath': 'id',
                'autoIncrement': false
              });

              var table4 = transaction.createObjectStore("Table4", {
                'autoIncrement': true
              });

              var table5 = transaction.createObjectStore("Table5", {
                'autoIncrement': true
              });
              table5.createIndex("name");
              table5.createIndex("username");
            }
          }
        }).done(function() {
          cb();
        });
      });
    },
    setup: function() {
      var data = Faker.Helpers.createCard();
      window.key++;

      function err() {
        console.log.apply(console, arguments);
      }
    },
    teardown: function() {

    },
    tests: {
      'Table with no keypath or auto increment': function(deferred) {
        var req = window.indexedDB.open('IndexedDBPerf');
        req.onsuccess = function() {
          var transaction = req.result.transaction(['Table1'], "readwrite");
          var objStore = transaction.objectStore("Table1");
          var addReq = objStore.add(data, window.key++);
          addReq.onsuccess = function() {
            deferred.resolve();
          }
          addReq.onerror = function() {
            console.log("Could not add data", addReq.error);
          };
        };
        req.onerror = function() {
          console.log("Could not Open DB");
        };
      },
      'Table with keypath and auto increment': function(deferred) {
        var req = window.indexedDB.open('IndexedDBPerf');
        req.onsuccess = function() {
          var transaction = req.result.transaction(['Table2'], "readwrite");
          var objStore = transaction.objectStore("Table2");
          var addReq = objStore.add(data);
          addReq.onsuccess = function() {
            deferred.resolve();
          }
          addReq.onerror = function() {
            console.log("Could not add data");
          };
        };
        req.onerror = function() {
          console.log("Could open DB");
        };
      },
      'Table with keypath and NO auto increment': function(deferred) {
        var req = window.indexedDB.open('IndexedDBPerf');
        req.onsuccess = function() {
          var transaction = req.result.transaction(['Table3'], "readwrite");
          var objStore = transaction.objectStore("Table3");
          data.id = window.key++;
          var addReq = objStore.add(data);
          addReq.onsuccess = function() {
            deferred.resolve();
          }
          addReq.onerror = function() {
            console.log("Could not add data");
          };
        };
        req.onerror = function() {
          console.log("Could open DB");
        };
      },
      'Table with NO keypath but auto increment': function(deferred) {
        var req = window.indexedDB.open('IndexedDBPerf');
        req.onsuccess = function() {
          var transaction = req.result.transaction(['Table4'], "readwrite");
          var objStore = transaction.objectStore("Table4");
          var addReq = objStore.add(data);
          addReq.onsuccess = function() {
            deferred.resolve();
          }
          addReq.onerror = function() {
            console.log("Could not add data");
          };
        };
        req.onerror = function() {
          console.log("Could open DB");
        };
      },
      'Table with Index': function(deferred) {
        var req = window.indexedDB.open('IndexedDBPerf');
        req.onsuccess = function() {
          var transaction = req.result.transaction(['Table4'], "readwrite");
          var objStore = transaction.objectStore("Table4");
          var addReq = objStore.add(data);
          addReq.onsuccess = function() {
            deferred.resolve();
          }
          addReq.onerror = function() {
            console.log("Could not add data");
          };
        };
        req.onerror = function() {
          console.log("Could open DB");
        };
      }
    }
  };
}(window.IndexedDBPerf.suites));