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