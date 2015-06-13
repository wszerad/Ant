var assert = require('assert');
var $ = require('../dist/ant.dev.js');

describe('Ant', function(){
	describe('Date', function(){
		it('Getters', function(){
			var base = new Date(2010,2,5,22,45,17,123);

			assert.strictEqual(base*1, 1267825517123, 'Time');
			assert.strictEqual(base.year, 2010, 'Year');
			assert.strictEqual(base.month, 2, 'Month');
			assert.strictEqual(base.date, 5, 'Date');
			assert.strictEqual(base.hours, 22, 'Hour');
			assert.strictEqual(base.minutes, 45, 'Minute');
			assert.strictEqual(base.seconds, 17, 'Second');
			assert.strictEqual(base.milliseconds, 123, 'Millisecond');
		});

		it('Setters', function(){
			var base = new Date(2010,2,5,22,45,17,123);

			base.year+=2;
			assert.strictEqual(base*1, 1330983917123, 'Year');

			base.month-=5;
			assert.strictEqual(base*1, 1317847517123, 'Month');

			base.date+=5;
			assert.strictEqual(base*1, 1318279517123, 'Date');

			base.hours+=10;
			assert.strictEqual(base*1, 1318315517123, 'Hour');

			base.minutes-=20;
			assert.strictEqual(base*1, 1318314317123, 'Minute');

			base.seconds+=20;
			assert.strictEqual(base*1, 1318314337123, 'Second');

			base.milliseconds+=120;
			assert.strictEqual(base*1, 1318314337243, 'Millisecond');
		});

		var formatString = '{y} {yy} {M} {MM} {MMM} {MMMM} {d} {dd} {F} {E} {EE} {h} {hh} {K} {KK} {a} {H} {HH} {k} {kk} {m} {mm} {s} {ss} {S} {SS} {z} {zz} {Z} {ZZ} {X} {XX} {w} {W} {D}';
		it('.format', function(){
			var test = '109 2009 3 03 Mar March 5 05 4 Thu Thursday 7 07 6 06 am 6 06 7 07 4 04 9 09 3 003 GMT+0000 GMT+00:00 +0000 +00:00 +0000 +00:00 9 0 64'.split(' ');
			var base = new Date(2009,2,5,6,4,9,3);
			var lang = '*';
			var result = base.format(formatString, lang).split(' ');

			assert.strictEqual(result[0], test[0], 'short year');
			assert.strictEqual(result[1], test[1], 'full year');
			assert.strictEqual(result[2], test[2], 'month');
			assert.strictEqual(result[3], test[3], 'zero month');
			assert.strictEqual(result[4], test[4], 'short month name');
			assert.strictEqual(result[5], test[5], 'full month year');
			assert.strictEqual(result[6], test[6], 'date');
			assert.strictEqual(result[7], test[7], 'zero date');
			assert.strictEqual(result[8], test[8], 'week day number');
			assert.strictEqual(result[9], test[9], 'week day name short');
			assert.strictEqual(result[10], test[10], 'week day name long');
			assert.strictEqual(result[11], test[11], 'hour (1-12)');
			assert.strictEqual(result[12], test[12], 'hour (01-12)');
			assert.strictEqual(result[13], test[13], 'hour (0-11)');
			assert.strictEqual(result[14], test[14], 'hour (00-11)');
			assert.strictEqual(result[15], test[15], 'am/pm');
			assert.strictEqual(result[16], test[16], 'hour (0-23');
			assert.strictEqual(result[17], test[17], 'hour (00-23)');
			assert.strictEqual(result[18], test[18], 'hour (1-24)');
			assert.strictEqual(result[19], test[19], 'hour (01-24)');
			assert.strictEqual(result[20], test[20], 'minute');
			assert.strictEqual(result[21], test[21], 'zero minute');
			assert.strictEqual(result[22], test[22], 'second');
			assert.strictEqual(result[23], test[23], 'zero second');
			assert.strictEqual(result[24], test[24], 'millisecond');
			assert.strictEqual(result[25], test[25], 'zero millisecond');
			assert(/^GMT(\+|\-)[0-9]{4}$/.test(result[26]), 'UTF diff GMT+0200');
			assert(/^GMT(\+|\-)[0-9]{2}:[0-9]{2}$/.test(result[27]), 'UTF diff GMT+02:00');
			assert(/^(\+|\-)[0-9]{4}$/.test(result[28]), 'UTF diff +0200');
			assert(/^(\+|\-)[0-9]{2}:[0-9]{2}$/.test(result[29]), 'UTF diff +02:00');
			assert(/^(\+|\-)[0-9]{4}$/.test(result[30]), 'UTF diff +0200');
			assert(/^(\+|\-)[0-9]{2}:[0-9]{2}$/.test(result[31]), 'UTF diff +02:00');
			assert.strictEqual(result[32], test[32], 'week of year');
			assert.strictEqual(result[33], test[33], 'week of month');
			assert.strictEqual(result[34], test[34], 'day of year');
		});

		it('Methods', function(){
			var data = {
				'ampm': 'rano,po po³udniu'.split(','),
				'monthsLong': 'Styczeñ,Luty,Marzec,Kwiecieñ,Maj,Czerwiec,Lipiec,Sierpieñ,Wrzesieñ,PaŸdziernik,Listopad,Grudzieñ'.split(','),
				'monthsShort': 'Sty,Lut,Mar,Kwi,Maj,Cze,Lip,Sie,Wrz,PaŸ,Lis,Gru'.split(','),
				'daysLong': 'Niedziela,Poniedzia³ek,Wtorek,Œroda,Czwartek,Pi¹tek,Sobota'.split(','),
				'daysShort': 'Nd,Pn,Wt,Œr,Cz,Pt,Sb'.split(',')
			};
			var lang = 'pl';
			var formatName1 = 'Format';
			var formatString = '{MMMM}';
			var formatName2 = 'Function';
			var base = new Date(2009,2,5,6,4,9,3);

			var time = new Date(),
				clone = Date.clone(time);
			assert(time!==clone && time*1===clone*1, 'clone');

			Date.addLocale(data, lang);
			Date.addFormat(formatName1, formatString, lang);
			Date.addFormat(formatName2, function(lang){
				return this.format('{MMMM}', lang);
			}, lang);

			assert.strictEqual(base.useFormat(formatName1, lang), 'Marzec', 'useFormat(string)');
			assert.strictEqual(base.useFormat(formatName2, lang), 'Marzec', 'useFormat(fuu)');

			assert.strictEqual(Date.locale ,  '*', 'locale');
			Date.setLocale('pl');
			assert.strictEqual(Date.locale ,  'pl', 'setLocale');
			assert.strictEqual(base.useFormat(formatName2), 'Marzec', 'setLocale format');

			assert.deepEqual(Date.getLocale(), data, 'getLocale');
			assert.strictEqual(Date.getFormat(formatName1), formatString, 'getFormat');

			assert.strictEqual(Date.monthShort(11), data.monthsShort[11], 'monthShort');
			assert.strictEqual(Date.monthLong(6), data.monthsLong[6], 'monthLong');
			assert.strictEqual(Date.month(6), data.monthsLong[6], 'month');
			assert.strictEqual(Date.dayShort(0), data.daysShort[0], 'dayShort');
			assert.strictEqual(Date.dayLong(5), data.daysLong[5], 'dayLong');
			assert.strictEqual(Date.day(5), data.daysLong[5], 'day');
			assert.strictEqual(Date.ampm(0), data.ampm[0], 'ampm');
		});

		it('Watch', function(){
			var time = new Date(),
				passed = false,
				listener = function(old, now){
					assert(old*1!==now*1, 'changed');
					passed = !passed;
				},
				noop = function(){};

			assert(time.listen!==true, 'no watchers');
			assert.strictEqual(time.listeners.length, 0, 'has no watchers');

			time.watch(noop);
			time.watch(listener);

			assert(time.listen===true, 'has watchers');

			time.year++;

			assert.strictEqual(time.listeners.length, 2, 'has 2 watchers');
			assert(passed, 'emitted');

			time.unwatch(listener);
			assert.strictEqual(time.listeners.length, 1, 'has 1 watchers');

			time.unwatch(noop);
			assert.strictEqual(time.listeners.length, 0, 'has no watchers');

			assert(time.listen!==true, 'no watchers 2');
		});
	});

	describe('Array', function(){
		it('Methods', function(){
			//create
			var tests = [],
				pattern = [1,2,3];

			tests.push(Array.create([1,2,3]));
			tests.push(Array.create(1,2,3));
			tests.push(Array.create([[1]],[2],3));
			tests.push((function(){return Array.create(arguments);})(1,2,3));

			tests.forEach(function(res, index){
				assert.deepEqual(res, pattern, '.create test: '+index)
			});

			//range
			var index = 0;
			assert.deepEqual(Array.range(0,5,1), [0,1,2,3,4], '.range test: '+index++);
			assert.deepEqual(Array.range(0,5), [0,1,2,3,4], '.range test: '+index++);
			assert.deepEqual(Array.range(0,10,2), [0,2,4,6,8], '.range test: '+index++);
			assert.deepEqual(Array.range(0,-5,-1), [0,-1,-2,-3,-4], '.range test: '+index++);
			assert.deepEqual(Array.range(0,1,0.2), [0,0.2,0.4,0.6,0.8], '.range test: '+index);
		});

		it('prototypes', function(){
			//fill
			assert.deepEqual([].fill(0, 0, 5), [0,0,0,0,0]);
			assert.deepEqual([0,1,2,3,4].fill(5), [5,5,5,5,5]);
			assert.deepEqual([0,1,2,3,4].fill(5, -2, -1), [0,1,2,5,5]);

			var array = Array.range(0,10),
				lastEmit = null;

			array.watch(function(){
				lastEmit = Array.create(arguments);
			});

			//pop
			assert.equal(array.pop(), 9, 'pop');
			assert(lastEmit[0]===9 && lastEmit[1]===undefined && lastEmit[2]===9, 'pop watch');

			//push
			assert.equal(array.push(9), 10, 'push');
			assert(lastEmit[0]===undefined && lastEmit[1]===9 && lastEmit[2]===9, 'push watch');

			//shift
			assert.equal(array.shift(), 0, 'shift');
			assert(lastEmit[0]===0 && lastEmit[1]===undefined && lastEmit[2]===0, 'shift watch');

			//unshift
			assert.equal(array.unshift(0), 0, 'unshift');
			assert(lastEmit[0]===undefined && lastEmit[1]===0 && lastEmit[2]===0, 'unshift watch');

			//splice
			assert.equal(array.splice(0, 1), 0, 'splice');
			assert(lastEmit[0]===0 && lastEmit[1]===undefined && lastEmit[2]===0, 'splice watch');

			//find
		});
	});

});