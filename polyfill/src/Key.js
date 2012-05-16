(function(idbModules){
	/**
	 * Encodes the keys and values based on their types. This is required to maintain collations
	 */
	var Key = (function(){
		return {
			encode: function(key){
				return JSON.stringify(key);
			},
			decode: function(key){
				return JSON.parse(key);
			}
		}
	}());
	idbModules["Key"] = Key;
}(idbModules));
