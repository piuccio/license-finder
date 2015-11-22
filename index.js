var github = require('./lib/github');
var Promise = require('bluebird');
var filesUtils = require('./lib/files');
var generateLicenseDescription = require('./lib/license');
var generateResult = require('./lib/store');
var cache = require('./lib/cache');

var user = process.argv[2] || process.env.GTIHUB_USER || 'piuccio';

cache.promise('repository-list-' + user, function () {
	return github.listRepos(user);
})
.then(allRepos => {
	return Promise.map(allRepos, checkLicense, {concurrency: 4});
})
.then(function (result) {
	return generateResult(user, result);
})
.catch(err => {
	console.error(err);
});

function checkLicense(repo) {
	return cache.promise('root-files-' + repo.id, function () {
		return github.listRootFiles(repo);
	}).then(files => {
		if (files.length === 0) {
			repo.empty = true;
		}

		var licenseFiles = filesUtils.filterLicenseFiles(files);
		var packageJson = filesUtils.filterPackageJson(files);

		return cache.promise('files-content-' + repo.id, function () {
			return fetchFileContent(licenseFiles.concat([packageJson]).filter(Boolean));
		})
		.then(filesContent => generateLicenseDescription(filesContent, repo));
	});
}

function fetchFileContent(files) {
	return Promise.map(files, function (file) {
		return github.getFileContent(file).then(content => {
			return {
				path: file.path,
				content: content
			};
		});
	}, {concurrency: 2});
}

