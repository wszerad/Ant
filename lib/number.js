if(!('MAX_SAFE_INTEGER' in number)){
	extend(number, {
		'isSafeInteger': Number.isSafeInteger || function(value){return value<=9007199254740991 && value>=-9007199254740991},
		'MAX_SAFE_INTEGER': Number.MAX_SAFE_INTEGER || 9007199254740991,
		'MIN_SAFE_INTEGER': Number.MIN_SAFE_INTEGER || -9007199254740991
	}, false);
}