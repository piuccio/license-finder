exports.filterLicenseFiles = function(files) {
	return files
		.filter(file => /licen[sc]/i.test(file.path));
};

exports.filterPackageJson = function(files) {
	return files.filter(file => exports.isPackageJson(file.path))[0];
};

exports.isPackageJson = function(file) {
	return /package\.json/i.test(file);
};
