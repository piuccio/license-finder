var fs = require('fs');
var cache = require('./cache');
var nunjucks = require('nunjucks');
nunjucks.configure('views', { autoescape: true });

module.exports = function (user, repositories) {
	var stats = {
		hasEmptyRepos: false,
		count: repositories.length,
		withLicense: 0,
		licenses: {},
		files: {
			'package.json': {
				repos: []
			}
		},
		mixed: []
	};
	var reposWithLicenses = repositories.map(function (repo) {
		var licenses = [];
		if (repo.hasLicense) {
			stats.withLicense += 1;
			if (repo.packageJson && repo.packageJson.name) {
				licenses.push({
					name: repo.packageJson.name,
					file: 'package.json'
				});
				stats.files['package.json'].repos.push(repo.repo);
				if (!stats.licenses[repo.packageJson.name]) {
					stats.licenses[repo.packageJson.name] = {
						repos: []
					};
				}
				if (stats.licenses[repo.packageJson.name].repos.indexOf(repo.repo) === -1) {
					stats.licenses[repo.packageJson.name].repos.push(repo.repo);
				}
			}
			repo.files.forEach(function (file) {
				licenses.push({
					name: file.name,
					file: file.path
				});
				if (!stats.licenses[file.name]) {
					stats.licenses[file.name] = {
						repos: []
					};
				}
				if (stats.licenses[file.name].repos.indexOf(repo.repo) === -1) {
					stats.licenses[file.name].repos.push(repo.repo);
				}
				if (!stats.files[file.path]) {
					stats.files[file.path] = {
						repos: []
					};
				}
				stats.files[file.path].repos.push(repo.repo);
			});
		}

		if (licenses.length > 0) {
			var uniqueLicenses = licenses.reduce(function (result, license) {
				if (result.indexOf(license.name) === -1) {
					result.push(license.name);
				}
				return result;
			}, []);

			if (uniqueLicenses.length > 1) {
				stats.mixed.push({
					repo: repo.repo,
					licenses: uniqueLicenses
				});
			}
		}

		if (repo.empty) {
			stats.hasEmptyRepos = true;
		}

		return Object.assign({
			licenses: licenses,
			unique: uniqueLicenses || []
		}, repo);
	});
	stats.licenses = sortObject(stats.licenses);
	stats.files = sortObject(stats.files);

	var result = {
		user: user,
		statistics: stats,
		repositories: reposWithLicenses
	};

	cache.writeTmp('out.json', JSON.stringify(result, null, '\t'))
	.then(function () {
		console.log('JSON report created in tmp/out.json');
	})
	.catch(function (err) {
		console.error('Unable to write output JSON', err);
	});
	fs.writeFile('report.html', nunjucks.render('index.html', result), function (err) {
		if (err) {
			console.error('Unable to write output HTML', err);
		} else {
			console.log('HTML report created in report.html');
		}
	});
};

function sortObject(object) {
	return Object.keys(object).map(function (key) {
		return Object.assign({
			name: key
		}, object[key]);
	}).sort(function (a, b) {
		return b.repos.length - a.repos.length;
	});
}
