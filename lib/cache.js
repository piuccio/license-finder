var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');

var ENABLED = process.env.DISABLE_CACHE !== 'true';
var FORMAT_JSON = true;
exports.configure = function (opts) {
	if ('enabled' in opts) {
		ENABLED = !!opts.enabled;
	}
	if ('formatJSon' in opts) {
		FORMAT_JSON = !!opts.formatJSon;
	}
};

exports.writeTmp = function (name, content) {
	var filename = path.join(__dirname, '../tmp', name);
	return new Promise(function (resolve, reject) {
		mkdirp(path.dirname(filename), function (err) {
			if (err) {
				reject(err);
			} else {
				fs.writeFile(filename, content, function (err) {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			}
		});
	});
};

exports.promise = function (name, fn) {
	if (ENABLED) {
		return new Promise(function (resolve, reject) {
			var filename = name + '.cache.json';
			readFromCache(filename)
			.then(resolve)
			.catch(function () {
				return callActualFunction(fn)
				.then(function (result) {
					return storeResultAsJSON(filename, result)
					.catch(console.error.bind(console))
					.then(function () { return result; });
				});
			})
			.then(resolve)
			.catch(reject);
		});
	} else {
		return callActualFunction(fn);
	}
};

function readFromCache(name) {
	var filename = path.join(__dirname, '../tmp', name);
	return new Promise(function (resolve, reject) {
		fs.readFile(filename, function (err, data) {
			if (err) {
				reject(err);
			} else {
				try {
					resolve(JSON.parse(data.toString()));
				} catch (ex) {
					reject(new Error('Invalid JSON in ' + filename));
				}
			}
		});
	});
}

function callActualFunction(fn) {
	return Promise.resolve(fn).then(function (callThis) {
		return callThis();
	});
}

function storeResultAsJSON(filename, result) {
	return exports.writeTmp(filename, JSON.stringify(result, null, FORMAT_JSON ? '\t' : ''));
}
