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