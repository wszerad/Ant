function regexMatcher(reg) {
	reg = regexp(reg);
	return function (el) {
		return reg.test(el);
	}
}

function dateMatcher(d) {
	var ms = d.getTime();
	return function (el) {
		return !!(el && el.getTime) && el.getTime() === ms;
	}
}

function functionMatcher(fn) {
	return function (el, i, arr) {
		return el === fn || fn.call(this, el, i, arr);
	}
}

function invertedArgsFunctionMatcher(fn) {
	return function (value, key, obj) {
		return value === fn || fn.call(obj, key, value, obj);
	}
}

function fuzzyMatcher(obj, isObject) {
	var matchers = {};
	return function (el, i, arr) {
		var key;
		if(!isObjectType(el)) {
			return false;
		}
		for(key in obj) {
			matchers[key] = matchers[key] || getMatcher(obj[key], isObject);
			if(matchers[key].call(arr, el[key], i, arr) === false) {
				return false;
			}
		}
		return true;
	}
}

function defaultMatcher(f) {
	return function (el) {
		return el === f || isEqual(el, f);
	}
}

function getMatcher(f, isObject) {
	if(isPrimitiveType(f)) {
	} else if(isRegExp(f)) {
		return regexMatcher(f);
	} else if(isDate(f)) {
		return dateMatcher(f);
	} else if(isFunction(f)) {
		if(isObject) {
			return invertedArgsFunctionMatcher(f);
		} else {
			return functionMatcher(f);
		}
	} else if(isPlainObject(f)) {
		return fuzzyMatcher(f, isObject);
	}
	return defaultMatcher(f);
}

function transformArgument(el, map, context, mapArgs) {
	if(!map) {
		return el;
	} else if(map.apply) {
		return map.apply(context, mapArgs || []);
	} else if(isArray(map)) {
		return map.map(function(m) {
			return transformArgument(el, m, context, mapArgs);
		});
	} else if(isFunction(el[map])) {
		return el[map].call(el);
	} else {
		return el[map];
	}
}

function arrayFind(arr, f, indexes, limit, from, fromEnd, context){
	limit = limit || -1;

	var matcher = getMatcher(f),
		hits = [],
		len = arr.length,
		diff = fromEnd? -1 : 1,
		j = from || 0,
		i = fromEnd? len-1-from : from;

	for (; j<len; j++,i+=diff) {
		if(matcher.call(context, arr[i], i, arr)){
			hits.push(indexes? i : arr[i]);

			if(!--limit)
				break;
		}
	}

	return hits;
}

function arrayAdd(arr, el, index) {
	if(!isNumber(number(index)) || isNaN(index)) index = arr.length;
	array.prototype.splice.apply(arr, [index, 0].concat(el));
	return arr;
}

function arrayRemove(arr, args) {
	var del = [];
	multiArgs(args, function(f) {
		var i = 0, matcher = getMatcher(f);
		while(i < arr.length) {
			if(matcher(arr[i], i, arr)) {
				del.push(arr.splice(i, 1));
			} else {
				i++;
			}
		}
	});
	return del;
}

function arrayClone(arr) {
	return simpleMerge([], arr);
}

function arrayBuildEnhancements() {
	var callbackCheck = function() {
		var args = arguments;
		return args.length > 0 && !isFunction(args[0]);
	};
	extendSimilar(array, 'every,some,filter', function(methods, name) {
		var nativeFn = array.prototype[name];
		methods[name] = function(f) {
			var matcher = getMatcher(f);
			return nativeFn.call(this, function(el, index, arr) {
				return matcher(el, index, arr);
			});
		}
	}, true, callbackCheck);
}

extend(array, {
	'create': function() {
		var result = [];
		multiArgs(arguments, function(a) {
			if(isArgumentsObject(a) || isArrayLike(a)) {
				a = multiArgs(a);
			}
			result = result.concat(a);
		});
		return result;
	},
	//FROM Underscore
	'range': function(start, stop, step) {
		if (stop == null) {
			stop = start || 0;
			start = 0;
		}
		step = step || 1;

		var length = Math.max(Math.ceil((stop - start) / step), 0);
		var range = Array(length);

		for (var idx = 0; idx < length; idx++, start += step) {
			range[idx] = start;
		}

		return range;
	}
}, false);

extend(array, {
	'fill': function(value, start, end){
		this.emit(this);

		var len = this.length,
			old;

		if(start<0)
			start = len+start;

		if(end<0)
			end = len+end;
		else if(end===undefined)
			end = len;

		while(start<end){
			old = this[start];
			this[start] = value;
			this.emit(old, value, start, this);
			start++;
		}

		return this;
	},
	'pop': function(){
		this.emit(this);

		var ret = getProxy(Array).pop.original.apply(this);

		if(this.listen){
			var len = this.length;
			this.emit(ret, undefined, len, this);
		}

		return ret;
	},
	'push': function(){
		this.emit(this);

		var ret = getProxy(Array).push.original.apply(this, arguments);

		if(this.listen){
			var args = arguments.length,
				len = this.length-args;

			for(var i=0;i<args;i++){
				this.emit(undefined, arguments[i], len+i, this);
			}
		}

		return ret;
	},
	'shift': function(){
		this.emit(this);

		var ret = getProxy(Array).shift.original.apply(this);

		if(this.listen){
			this.emit(ret, undefined, 0);
		}

		return ret;
	},
	'unshift': function(){
		this.emit(this);

		var ret = getProxy(Array).unshift.original.apply(this, arguments);

		if(this.listen){
			var args = arguments.length;
			for(var i=0;i<args;i++){
				this.emit(undefined, arguments[i], i, this);
			}
		}

		return ret;
	},
	'splice': function(start, count){
		this.emit(this);

		var ret = getProxy(Array).splice.original.apply(this, arguments);

		if(this.listen){
			var args = array.prototype.slice.call(arguments, 2),
				len = Math.max(args.length, count);

			for(var i=0;i<len;i++){
				this.emit(ret[i], args[i], start+i, this);
			}
		}

		return ret;
	},
	'find': function(f, context) {
		checkCallback(f);
		return arrayFind(this, f, false, true, 0, false, context);
	},
	'findIndex': function(f, context) {
		var indexes;
		checkCallback(f);

		indexes = arrayFind(this, f, true, true, 0, false, context);
		return indexes.length? indexes[0] : -1;
	},
	'findAll': function(f, context) {
		return arrayFind(this, f, false, false, 0, false, context);
	},
	'findAllIndexes': function(f, context) {
		return arrayFind(this, f, true, false, 0, false, context);
	},
	'where': function(where, options, context){
		var limit = options.limit || -1,
			skip = options.skip || 0,
			reverse = options.reverse || false,
			indexes = options.indexes || false;

		return arrayFind(this, where, indexes, limit, skip, reverse, context);
	},
	'removeAt': function(start, end) {
		if(isUndefined(start)) return this;
		if(isUndefined(end))   end = start;
		return this.splice(start, end - start + 1);
	},
	'include': function(el, index) {
		return arrayAdd(arrayClone(this), el, index);
	},
	'exclude': function() {
		return arrayRemove(arrayClone(this), arguments);
	},
	'clone': function() {
		return arrayClone(this);
	},
	'at': function() {
		return array.prototype.slice.apply(this, arguments);
	},
	'first': function(num) {
		if(isUndefined(num)) return this[0];
		if(num < 0) num = 0;
		return this.slice(0, num);
	},
	'last': function(num) {
		if(isUndefined(num)) return this[this.length - 1];
		var start = this.length - num < 0 ? 0 : this.length - num;
		return this.slice(start);
	},
	'from': function(num) {
		return this.slice(num);
	},
	'to': function(num) {
		if(isUndefined(num)) num = this.length;
		return this.slice(0, num);
	},
	'add': function(el, index) {
		return arrayAdd(this, el, index);
	},
	'delete': function(el){
		var index = this.indexOf(el);

		if(index!==-1){
			this.splice(index, 1);
			return true;
		}

		return false;
	},
	'remove': function() {
		return arrayRemove(this, arguments);
	},
	'none': function(f) {
		var args = multiArgs(arguments);
		return !array.prototype.some.apply(this, [this].concat(args));
	},
	'sortBy': function(by, order){
		if(isObjectType(by)){
			var args = Object.keys(by).reduce(function(ret, name){
				array.prototype.push.call(ret[0], name);
				array.prototype.push.call(ret[1], by[name]);
				return ret;
			}, [[],[]]);

			by = args[0];
			order = args[1];
		} else {
			by = [].concat(by);
			order = [].concat(order || (new Array(by.length)).fill(1));
		}

		var len = by.length;

		function sort(arr, by){
			function compare(x, y){
				var i=0, a, b, name, pos;

				while(i<len){
					name = by[i];
					pos = order[i];
					a = x[name];
					b = y[name];

					if(a>b){
						return pos;
					} else if (a<b){
						return -1*pos;
					} else {
						i++;
					}
				}

				return 0;
			}

			return arr.sort(compare);
		}

		return sort(this, by);
	},
	'clear': function(){
		return this.splice(0, this.length);
	},
	'has': function(el){
		return this.indexOf(el)!==-1;
	},
	'set': function(f, replacer){
		var ret = arrayFind(this, f, true);

		if(ret!==-1){
			return this.splice(ret, 1, replacer);
		}else{
			this.push(replacer);
			return undefined;
		}
	}
});

function arrayBuildAliases() {
	alias(array, 'get', 'find');
	alias(array, 'all', 'every');
	alias(array, 'any', 'some');
	alias(array, 'insert', 'add');
}

arrayBuildEnhancements();
arrayBuildAliases();
buildWatchMethods(array);