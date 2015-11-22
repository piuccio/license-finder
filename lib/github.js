require('dotenv').load();
var got = require('got');

function github (path) {
	path = path.url ? path.url : ('https://api.github.com/' + path + '?per_page=100');
	console.log('getting', path);
	return got(path, {
		auth: process.env.GTIHUB_USER + ':' + process.env.GITHUB_TOKEN
	}).then(response => {
		var remaining = response.headers['x-ratelimit-remaining'];
		if (remaining === 20) {
			console.warn('Watch out, you only have 20 requests left before GitHub rate limits you');
		} else if (remaining === 0) {
			console.error('You\'ve been rate limited.\n' +
			'You\'ll be able to make new requests at' + (new Date(Number(response.headers['x-ratelimit-reset']) * 1000)));
		}
		return {
			headers: response.headers,
			body: JSON.parse(response.body)
		};
	});
}

function asArray (path) {
	function getPage(path, array) {
		return github(path).then(result => {
			array.push.apply(array, result.body);
			var next = followLink(result.headers.link);
			if (next) {
				return getPage({
					url: next
				}, array);
			} else {
				return array;
			}
		});
	}
	return getPage(path, []);
}

function followLink (tag) {
	if (tag) {
		var links = tag.split(',');
		return links.filter(link => link.indexOf('rel="next"') > 0)
			.map(link => {
				var match = link.match(/<(.+)>;/);
				return match[1];
			})
			[0];
	}
}

exports.listRepos = function(user) {
	return asArray('users/' + user + '/repos')
	.then(all => {
		return all.filter(repo => repo.fork === false);
	});
};

exports.listRootFiles = function(repo) {
	if (repo.size) {
		return github({
			url: repo.trees_url.replace('{/sha}', '/' + repo.default_branch)
		})
		.then(response => response.body.tree)
		.catch(function (error) {
			if (error.statusCode === 409) {
				return [];
			} else {
				throw error;
			}
		});
	} else {
		return Promise.resolve([]);
	}
};

exports.getFileContent = function(file) {
	return github({
		url: file.url
	}).then(response => {
		var buffer = new Buffer(response.body.content, response.body.encoding);
		return buffer.toString('utf8');
	});
};
