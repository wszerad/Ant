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