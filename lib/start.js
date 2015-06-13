(function (global, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory.bind(global));
	} else if (typeof module !== 'undefined' && module.exports){
		module.exports = factory.call(global);
	} else {
		global.Ant = factory.call(global);
	}
})(this, function(){