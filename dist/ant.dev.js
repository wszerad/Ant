(function (global, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory.bind(global));
	} else if (typeof module !== 'undefined' && module.exports){
		module.exports = factory.call(global);
	} else {
		global.Ant = factory.call(global);
	}
})(this, function(){
'use strict';
var global = this;
var Ant = {};
var object = Object, array = Array, regexp = RegExp, date = Date, string = String, number = Number, func = Function, math = Math, Undefined;
var hasExports = typeof module !== 'undefined' && module.exports;
var noConflict = hasExports && typeof process !== 'undefined' ? process.env['ANT_NO_CONFLICT'] : false;
var internalHasOwnProperty = object.prototype.hasOwnProperty;
var propertyDescriptorSupport = !!(object.defineProperty && object.defineProperties);
var natives = 'Boolean,Number,String,Array,Date,RegExp,Function'.split(',');
var proxies = {};

function initializeGlobal() {
	Ant = {
		'extend': extend,
		'restore': restore,
		'revert': revert,
		'noConflict': noConflict
	};
}

function initializeNatives() {
	iterateOverObject(natives.concat('Object'), function(i, name) {
		proxies[global[name]] = name;
		Ant[name] = {};
	});
}

function extend(klass, methods, instance, polyfill, override) {
	var extendee;
	instance = instance !== false;
	extendee = instance ? klass.prototype : klass;
	iterateOverObject(methods, function(name, prop) {
		var existing = checkGlobal('method', klass, name, extendee),
			original = checkGlobal('original', klass, name, extendee),
			existed  = name in extendee;
		if(typeof polyfill === 'function' && existing) {
			prop = wrapExisting(existing, prop, polyfill);
		}
		defineOnGlobal(klass, name, instance, original, prop, existed);
		if(canDefineOnNative(klass, polyfill, existing, override)) {
			setProperty(extendee, name, prop);
		}
	});
}

function alias(klass, target, source) {
	var method = getProxy(klass)[source];
	var obj = {};
	obj[target] = method['method'];
	extend(klass, obj, method['instance']);
}

function restore(klass, methods) {
	if(noConflict) return;
	return batchMethodExecute(klass, methods, function(target, name, m) {
		setProperty(target, name, m.method);
	});
}

function revert(klass, methods) {
	return batchMethodExecute(klass, methods, function(target, name, m) {
		if(m['existed']) {
			setProperty(target, name, m['original']);
		} else {
			delete target[name];
		}
	});
}

function batchMethodExecute(klass, methods, fn) {
	var all = !methods, changed = false;
	if(typeof methods === 'string') methods = [methods];
	iterateOverObject(getProxy(klass), function(name, m) {
		if(all || methods.indexOf(name) !== -1) {
			changed = true;
			fn(m['instance'] ? klass.prototype : klass, name, m);
		}
	});
	return changed;
}

function getRegExpFlags(reg, add) {
	var flags = '';
	add = add || '';
	function checkFlag(prop, flag) {
		if(prop || add.indexOf(flag) > -1) {
			flags += flag;
		}
	}
	checkFlag(reg.multiline, 'm');
	checkFlag(reg.ignoreCase, 'i');
	checkFlag(reg.global, 'g');
	checkFlag(reg.sticky, 'y');
	return flags;
}

function checkGlobal(type, klass, name, extendee) {
	var proxy = getProxy(klass), methodExists;
	methodExists = proxy && hasOwnProperty(proxy, name);
	if(methodExists) {
		return proxy[name][type];
	} else {
		return extendee[name];
	}
}

function canDefineOnNative(klass, polyfill, existing, override) {
	if(override) {
		return true;
	} else if(polyfill === true) {
		return !existing;
	}
	return !noConflict || !proxies[klass];
}

function wrapExisting(originalFn, extendedFn, condition) {
	return function(a) {
		return condition.apply(this, arguments) ?
			extendedFn.apply(this, arguments) :
			originalFn.apply(this, arguments);
	}
}

function wrapInstanceAsClass(fn) {
	return function(obj) {
		var args = arguments, newArgs = [], i;
		for(i = 1;i < args.length;i++) {
			newArgs.push(args[i]);
		}
		return fn.apply(obj, newArgs);
	};
}

function defineOnGlobal(klass, name, instance, original, prop, existed) {
	var proxy = getProxy(klass), result;
	if(!proxy) return;
	result = instance ? wrapInstanceAsClass(prop) : prop;
	setProperty(proxy, name, result, true);
	if(typeof prop === 'function') {
		setProperty(result, 'original', original);
		setProperty(result, 'method', prop);
		setProperty(result, 'existed', existed);
		setProperty(result, 'instance', instance);
	}
}

function getProxy(klass) {
	return Ant[proxies[klass]];
}

function setProperty(target, name, property, enumerable) {
	if(propertyDescriptorSupport) {
		object.defineProperty(target, name, {
			'value': property,
			'enumerable': !!enumerable,
			'configurable': true,
			'writable': true
		});
	} else {
		target[name] = property;
	}
}

function iterateOverObject(obj, fn) {
	var key;
	for(key in obj) {
		if(!hasOwnProperty(obj, key)) continue;
		if(fn.call(obj, key, obj[key], obj) === false) break;
	}
}

function hasOwnProperty(obj, prop) {
	return !!obj && internalHasOwnProperty.call(obj, prop);
}

initializeGlobal();
initializeNatives();

var internalToString = object.prototype.toString;
var regexIsFunction = typeof regexp() === 'function';
var typeChecks = {};
var matchedByValueReg = /^\[object Date|Array|String|Number|RegExp|Boolean|Arguments\]/;

var isBoolean  = buildPrimitiveClassCheck('boolean', natives[0]);
var isNumber   = buildPrimitiveClassCheck('number',  natives[1]);
var isString   = buildPrimitiveClassCheck('string',  natives[2]);
var isArray    = buildClassCheck(natives[3]);
var isDate     = buildClassCheck(natives[4]);
var isRegExp   = buildClassCheck(natives[5]);
var isFunction = buildClassCheck(natives[6]);

function isClass(obj, klass, cached) {
	var k = cached || className(obj);
	return k === '[object '+klass+']';
}

function buildClassCheck(klass) {
	var fn = (klass === 'Array' && array.isArray) || function(obj, cached) {
			return isClass(obj, klass, cached);
		};
	typeChecks[klass] = fn;
	return fn;
}

function buildPrimitiveClassCheck(type, klass) {
	var fn = function(obj) {
		if(isObjectType(obj)) {
			return isClass(obj, klass);
		}
		return typeof obj === type;
	};
	typeChecks[klass] = fn;
	return fn;
}

function className(obj) {
	return internalToString.call(obj);
}

function extendSimilar(klass, set, fn, instance, polyfill, override) {
	var methods = {};
	set = isString(set) ? set.split(',') : set;
	set.forEach(function(name, i) {
		fn(methods, name, i);
	});
	extend(klass, methods, instance, polyfill, override);
}

function isArgumentsObject(obj) {
	return hasProperty(obj, 'length') && (className(obj) === '[object Arguments]' || !!obj.callee);
}

function multiArgs(args, fn, from) {
	var result = [], i = from || 0, len;
	for(len = args.length; i < len; i++) {
		result.push(args[i]);
		if(fn) fn.call(args, args[i], i);
	}
	return result;
}

function flattenedArgs(args, fn, from) {
	var arg = args[from || 0];
	if(isArray(arg)) {
		args = arg;
		from = 0;
	}
	return multiArgs(args, fn, from);
}

function checkCallback(fn) {
	if(!fn || !fn.call) {
		throw new TypeError('Callback is not callable');
	}
}


var isArrayLike = function(obj) {
	return hasProperty(obj, 'length') && !isString(obj) && !isPlainObject(obj);
};

var isFinite = Number.isFinite || function(arg){
	return isFinite(arg);
};

var isNaN = Number.isNaN || function(arg){
	return isNaN(arg);
};

var isInteger = Number.isInteger || function(arg) {
	return typeof arg === "number" && isFinite(arg) && Math.floor(arg) === arg;
};

function isElement(value) {
	return !!value && value.nodeType === 1 && isObjectType(value) && (className(value).indexOf('Element') > -1);
}

function isError(arg){
	return isObjectType(arg) && typeof arg.message == 'string' && className(arg) == '[object Error]';
}

function isDefined(o) {
	return o !== Undefined;
}

function isUndefined(o) {
	return o === Undefined;
}

function hasProperty(obj, prop) {
	return !isPrimitiveType(obj) && prop in obj;
}

function isObjectType(obj) {
	return !!obj && (typeof obj === 'object' || (regexIsFunction && isRegExp(obj)));
}

function isPrimitiveType(obj) {
	var type = typeof obj;
	return obj == null || type === 'string' || type === 'number' || type === 'boolean';
}

function isPlainObject(obj, klass) {
	klass = klass || className(obj);
	try {
		if (obj && obj.constructor &&
			!hasOwnProperty(obj, 'constructor') &&
			!hasOwnProperty(obj.constructor.prototype, 'isPrototypeOf')) {
			return false;
		}
	} catch (e) {
		return false;
	}
	return !!obj && klass === '[object Object]' && 'hasOwnProperty' in obj;
}

function simpleMerge(target, source) {
	iterateOverObject(source, function(key) {
		target[key] = source[key];
	});
	return target;
}

function stringify(thing, stack) {
	var type = typeof thing,
		thingIsObject,
		thingIsArray,
		klass, value,
		arr, key, i, len;

	if(type === 'string') return thing;

	klass         = internalToString.call(thing);
	thingIsObject = isPlainObject(thing, klass);
	thingIsArray  = isArray(thing, klass);

	if(thing != null && thingIsObject || thingIsArray) {
		// This method for checking for cyclic structures was egregiously stolen from
		// the ingenious method by @kitcambridge from the Underscore script:
		// https://github.com/documentcloud/underscore/issues/240
		if(!stack) stack = [];

		if(stack.length > 1) {
			i = stack.length;
			while (i--) {
				if (stack[i] === thing) {
					return 'CYC';
				}
			}
		}
		stack.push(thing);
		value = thing.valueOf() + string(thing.constructor);
		arr = thingIsArray ? thing : object.keys(thing).sort();
		for(i = 0, len = arr.length; i < len; i++) {
			key = thingIsArray ? i : arr[i];
			value += key + stringify(thing[key], stack);
		}
		stack.pop();
	} else if(1 / thing === -Infinity) {
		value = '-0';
	} else {
		value = string(thing && thing.valueOf ? thing.valueOf() : thing);
	}
	return type + klass + value;
}

function isEqual(a, b) {
	if(a === b) {
		return a !== 0 || 1 / a === 1 / b;
	} else if(objectIsMatchedByValue(a) && objectIsMatchedByValue(b)) {
		return stringify(a) === stringify(b);
	}
	return false;
}

function objectIsMatchedByValue(obj) {
	var klass = className(obj);
	return matchedByValueReg.test(klass) || isPlainObject(obj, klass);
}

//watch
function buildWatchMethods(target){
	extend(target, {
		listeners: [],
		watch: function(fuu){
			this.listen = true;
			this.listeners.push(fuu);
		},
		unwatch: function(fuu){
			var listeners = this.listeners,
				i = 0;

			while(i<listeners.length){
				if(listeners[i]===fuu){
					listeners.splice(i,1);
				} else {
					i++;
				}
			}

			if(!listeners.length)
				this.listen = false;
		},
		emit: function(){
			if(!this.listen)
				return;

			var args = arguments;
			this.listeners.forEach(function(fuu){
				fuu.apply(this, args);
			});
		}
	});
}

//Utils
var Util = {
	isArrayLike: isArrayLike,
	isArray: isArray,
	isArguments: isArgumentsObject,
	isBoolean: isBoolean,
	isString: isString,
	isNumber: isNumber,
	isFinite: isFinite,
	isNaN: isNaN,
	isInteger: isInteger,
	isElement: isElement,
	isError: isError,
	isEqual: isEqual,
	isObjectLike: isObjectType,
	isObject: isPlainObject,
	isDate: isDate,
	isRegExp: isRegExp,
	isFunction: isFunction
};
function matchInObject(match, key, value) {
	if(isRegExp(match)) {
		return match.test(key);
	} else if(isObjectType(match)) {
		return match[key] === value;
	} else {
		return key === string(match);
	}
}

function selectFromObject(obj, args, select) {
	var match, result = obj instanceof Hash ? new Hash : {};
	iterateOverObject(obj, function(key, value) {
		match = false;
		flattenedArgs(args, function(arg) {
			if(matchInObject(arg, key, value)) {
				match = true;
			}
		}, 1);
		if(match === select) {
			result[key] = value;
		}
	});
	return result;
}

var getOwnPropertyNames      = object.getOwnPropertyNames;
var defineProperty           = propertyDescriptorSupport ? object.defineProperty : definePropertyShim;
var getOwnPropertyDescriptor = propertyDescriptorSupport ? object.getOwnPropertyDescriptor : getOwnPropertyDescriptorShim;
var iterateOverProperties    = propertyDescriptorSupport ? iterateOverPropertyNames : iterateOverObject;

function iterateOverPropertyNames(obj, fn) {
	getOwnPropertyNames(obj).forEach(fn);
}

function getOwnPropertyDescriptorShim(obj, prop) {
	return obj.hasOwnProperty(prop) ? { 'value': obj[prop] } : Undefined;
}

function definePropertyShim(obj, prop, descriptor) {
	obj[prop] = descriptor['value'];
}

function mergeObject(target, source, deep, resolve) {
	if(!isObjectType(source)) return target;

	iterateOverProperties(source, function(prop) {

		var resolved;
		var sourceDescriptor = getOwnPropertyDescriptor(source, prop);
		var targetDescriptor = getOwnPropertyDescriptor(target, prop);
		var sourceVal        = sourceDescriptor && sourceDescriptor.value;
		var targetVal        = targetDescriptor && targetDescriptor.value;
		var sourceIsObject   = isObjectType(sourceVal);
		var goingDeep        = deep && sourceIsObject;
		var conflict         = isDefined(targetDescriptor) && targetDescriptor.value != null;

		if(conflict) {
			if(!goingDeep && resolve === false) {
				return;
			} else if(isFunction(resolve)) {
				resolved = resolve.call(source, prop, targetVal, sourceVal);
				if(isDefined(resolved)) {
					sourceDescriptor.value = resolved;
					goingDeep = false;
				}
			}
		}

		if(goingDeep) {
			sourceDescriptor.value = handleDeepMerge(targetVal, sourceVal, deep, resolve);
		}

		defineProperty(target, prop, sourceDescriptor);
	});
	return target;
}

function handleDeepMerge(targetVal, sourceVal, deep, resolve) {
	if(isDate(sourceVal)) {
		return new date(sourceVal.getTime());
	} else if(isRegExp(sourceVal)) {
		return new regexp(sourceVal.source, getRegExpFlags(sourceVal));
	} else {
		if(!isObjectType(targetVal)) targetVal = isArray(sourceVal) ? [] : {};
		return mergeObject(targetVal, sourceVal, deep, resolve);
	}
}

extend(object, {
	'extend': function(object, props){
		var proto = Object.keys(props).reduce(function(proto, key){
			proto[key] = {};
			proto[key].value = props[key];

			return proto;
		}, {});

		Object.defineProperties(object, proto);
	},
	'equal': function(a, b) {
		return isEqual(a, b);
	},
	'merge': function(target, source, deep, resolve) {
		return mergeObject(target, source, deep, resolve);
	},
	'clone': function(obj, deep) {
		var target, klass;
		if(!isObjectType(obj)) {
			return obj;
		}
		klass = className(obj);
		if(isDate(obj, klass) && date.clone) {
			return date.clone(obj);
		} else if(isDate(obj, klass) || isRegExp(obj, klass)) {
			return new obj.constructor(obj);
		} else if(isArray(obj, klass)) {
			target = [];
		} else if(isPlainObject(obj, klass)) {
			target = {};
		} else {
			throw new TypeError('Clone must be a basic data type.');
		}
		return mergeObject(target, obj, deep);
	},
	'has': function (obj, key) {
		return hasOwnProperty(obj, key);
	},
	'select': function (obj) {
		return selectFromObject(obj, arguments, true);
	},
	'reject': function (obj) {
		return selectFromObject(obj, arguments, false);
	},
	'default': function (target) {
		var sources = multiArgs(arguments, false, 1);

		sources.reduce(function(target, source){
			for(var i in source){
				if(!(i in target))
					target[i] = source[i];
			}

			return target;
		}, target);

		return target;
	},
	'path': function(object, path){
		path = path.split('.');

		var step;
		while (step = path.shift()) {
			object = object[step];
		}

		return object;
	}
}, false);

function objectBuildAliases() {
	alias(object, 'omit', 'reject');
	alias(object, 'pick', 'select');
}

objectBuildAliases();
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
/*
 * Data part
 */

function dateBuildEnhancements(date){
	var dateMethods = ['setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear', 'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds', 'setYear'];

	extend(date, dateMethods.reduce(function(proto, method){
		if(!Date.prototype.hasOwnProperty(method))
			return proto;

		proto[method] = function(){
			var old = new Date(this.valueOf());
			getProxy(Date)[method].original.apply(this, arguments);
			this.emit(old, this);
		};

		return proto;
	}, {}))
}

extend(date, {
	'monthShort': function(num, lang){
		lang = this.getLocale(lang);
		return lang['monthsShort'][num];
	},
	'monthLong': function(num, lang){
		lang = this.getLocale(lang);
		return lang['monthsLong'][num];
	},
	'dayShort': function(num, lang){
		lang = this.getLocale(lang);
		return lang['daysShort'][num];
	},
	'dayLong': function(num, lang){
		lang = this.getLocale(lang);
		return lang['daysLong'][num];
	},
	'ampm': function(num, lang){
		lang = this.getLocale(lang);
		return lang['ampm'][num];
	},
	'addFormat': function(name, f, lang){
		lang = lang || '*';

		if(!(lang in this.locales))
			this.locales[lang] = {
				locale: null,
				format: null
			};

		if(!this.locales[lang].format)
			this.locales[lang].format = {};
		if(!this.locales['*'].format)
			this.locales['*'].format = {};

		this.locales[lang].format[name] = f;
		this.locales['*'].format[name] = f;
	},
	'addLocale': function(data, lang){
		lang = lang || '*';

		if(!(lang in this.locales))
			this.locales[lang] = {
				locale: null,
				format: null
			};

		this.locales[lang].locale = data;
	},
	'getLocale': function(lang){
		if(!lang)
			lang = this.locale;

		if(lang in this.locales && this.locales[lang].locale)
			return this.locales[lang].locale;

		return this.locales['*'].locale;
	},
	'getFormat': function(name, lang){
		if(!lang)
			lang = this.locale;

		if(lang in this.locales && this.locales[lang] && name in this.locales[lang].format)
			return this.locales[lang].format[name];

		return this.locales['*'].format[name];
	},
	'locales': {},
	'locale': '*',
	'setLocale': function(lang){
		this.locale = (lang && lang in this.locales)? lang : '*';
	},
	'clone': function(date){
		return new Date(date.valueOf());
	}
}, false);

function dateBuildCustomLocale(){
	var lang;

	date.addLocale({
		'ampm': 'am,pm'.split(','),
		'monthsLong': 'January,February,March,April,May,June,July,August,September,October,November,December'.split(','),
		'monthsShort': 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
		'daysLong': 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(','),
		'daysShort': 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',')
	}, '*');

	try{
		lang = (window.navigator.userLanguage || window.navigator.language);
	} catch (e){
		lang = '*';
	}

	date.setLocale(lang);
}

extend(date, {
		useFormat: function(name, lang){
			var format = Date.getFormat(name, lang);

			if(isFunction(format)){
				return format.call(this, lang);
			}else if(isString(format)){
				return this.format(format, lang);
			}else{
				return format;
			}
		}, format: function(format, lang){
			var self=this;

			return format.replace(/(\{[GymMwWdDFEahHkKsSxXzZ]{1,4}\})/g, function(part){
				var from;

				switch(part){
					case '{G}':
						return self.getFullYear()>0? 'AD' : 'CE';
						break;
					case '{y}':
						return self.getYear();
					case '{yy}':
						return self.getFullYear();
					case '{M}':
						return self.getMonth()+1;
					case '{MM}':
						return addNull(self.getMonth()+1);
					case '{MMM}':
						return Date.monthShort(self.getMonth(), lang);
					case '{MMMM}':
						return Date.monthLong(self.getMonth(), lang);
					case '{w}':
						from=new Date(self);
						from.setMonth(0, 0);
						return Math.floor((self-from)/6048e5);
					case '{W}':
						from=new Date(self);
						from.setDate(1);
						return Math.floor((self-from)/6048e5);
					case '{D}':
						from=new Date(self);
						from.setMonth(0, 0);
						return Math.floor((self-from)/8.64e7);
					case '{d}':
						return self.getDate();
					case '{dd}':
						return addNull(self.getDate());
					case '{F}':
						return self.getDay();
					case '{E}':
						return Date.dayShort(self.getDay(), lang);
					case '{EE}':
						return Date.dayLong(self.getDay(), lang);
					case '{a}':
						return self.getHours()<13? Date.ampm(0, lang) : Date.ampm(1, lang);
					case '{h}':
						return self.getHours()%12+1;
					case '{hh}':
						return addNull(self.getHours()%12+1);
					case '{H}':
						return self.getHours();
					case '{HH}':
						return addNull(self.getHours());
					case '{k}':
						return self.getHours()+1;
					case '{kk}':
						return addNull(self.getHours()+1);
					case '{K}':
						return self.getHours()%12;
					case '{KK}':
						return addNull(self.getHours()%12);
					case '{m}':
						return self.getMinutes();
					case '{mm}':
						return addNull(self.getMinutes());
					case '{s}':
						return self.getSeconds();
					case '{ss}':
						return addNull(self.getSeconds());
					case '{S}':
						return self.getMilliseconds();
					case '{SS}':
						return addNull(self.getMilliseconds(), 3);
					case '{z}':
						return 'GMT'+UTCDiff(self);
					case '{zz}':
						return 'GMT'+UTCDiff(self, true);
					case '{Z}':
					case '{X}':
						return UTCDiff(self);
					case '{ZZ}':
					case '{XX}':
						return UTCDiff(self, true);
					default :
						return part;
				}
			});

			function addNull(value, num){
				num=num||2;
				var filler = '';
				for(var i=0;i<num;i++)
					filler += '0';
				return (filler+value).substr(-num, num);
			}

			function UTCDiff(time, colon){
				var utcHDiff = time.getHours()-time.getUTCHours(),
					utcMDiff = time.getMinutes()-time.getUTCMinutes(),
					negative = ((utcMDiff<0 && utcHDiff<=0) || utcHDiff<0)? '-' : '+';

				return negative+addNull(utcHDiff)+(colon? ':' : '')+addNull(utcMDiff);
			}
		}
	}
);

function dateBuildSetterGetters(date){
	var proto = {
		year: {
			set: function(year){
				this.setFullYear(year);
			},
			get: function(){
				return this.getFullYear();
			}
		},
		month: {
			set: function(month){
				this.setMonth(month);
			},
			get: function(){
				return this.getMonth();
			}
		},
		date: {
			set: function(date){
				this.setDate(date);
			},
			get: function(){
				return this.getDate();
			}
		},
		hours: {
			set: function(hours){
				this.setHours(hours);
			},
			get: function(){
				return this.getHours();
			}
		},
		minutes: {
			set: function(minutes){
				this.setMinutes(minutes);
			},
			get: function(){
				return this.getMinutes();
			}
		},
		seconds: {
			set: function(seconds){
				this.setSeconds(seconds);
			},
			get: function(){
				return this.getSeconds();
			}
		},
		milliseconds: {
			set: function(milliseconds){
				this.setMilliseconds(milliseconds);
			},
			get: function(){
				return this.getMilliseconds();
			}
		}
	};

	Object.defineProperties(date.prototype, proto);
}

function dateBuildAliases() {
	alias(date, 'day', 'dayLong');
	alias(date, 'month', 'monthLong');
}

dateBuildAliases();
dateBuildCustomLocale();
dateBuildEnhancements(date);
dateBuildSetterGetters(date);
buildWatchMethods(date);
if(!('MAX_SAFE_INTEGER' in number)){
	extend(number, {
		'isSafeInteger': Number.isSafeInteger || function(value){return value<=9007199254740991 && value>=-9007199254740991},
		'MAX_SAFE_INTEGER': Number.MAX_SAFE_INTEGER || 9007199254740991,
		'MIN_SAFE_INTEGER': Number.MIN_SAFE_INTEGER || -9007199254740991
	}, false);
}

	return Ant;
});