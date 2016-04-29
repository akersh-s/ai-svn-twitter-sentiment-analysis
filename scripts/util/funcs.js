String.prototype.contains = function(str) {
	return this.indexOf(str) !== -1;
};


String.prototype.containsAny = function() {
	var s = this;
	var prop;
	for (prop in arguments) {
		var arg = arguments[prop];
		if (s.contains(arg)) {
			return true;
		}
	}
	return false;
};
