#IndexedDB Performance Tests

* Indexes
	* Number of Indexes
	* Index depths
	* Uniqueness
	* Multi Entry

* Write operation
	* Add vs Modify

* Transactions
	* Same transaction object, all stores
	* Two transctions, individual stores



#DONE
* Keys Compare
	* Strings
	* Numbers
	* Other types
* Read
	* Read in same transaction from multiple stores
	* Read in different transaction per store
* Write
	* Write in a loop
	* Write in a transaction loop

* Table Schema
	* With Auto Increment
	* With KeyPath

* Iterate
	* Index iteration vs primary key iteration

* Read/Write
	* Read/Write in the same transaction
	* Read/Write in different transactions
* Index Get
	* Get Indexed object
	* Get indexed key and then object

* Cursor
	* Advance 1 vs Continue
* Index Iterate
	* Key Iterator + Get Object
	* Object Iterator