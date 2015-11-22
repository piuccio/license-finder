var files = require('./files');

module.exports = function generateLicenseDescription(filesContent, repo) {
	var license = {
		repo: repo.name,
		hasLicense: false,
		files: [],
		packageJson: null,
		empty: repo.empty,
		created: repo.created_at
	};

	if (filesContent.length > 0) {
		filesContent.forEach(file => {
			if (files.isPackageJson(file.path)) {
				var content = JSON.parse(file.content);
				license.packageJson = inferLicenseFromPackage(content.license);
				if (license.packageJson.name) {
					license.hasLicense = true;
				}
			} else {
				license.files.push(inferLicenseFromFile(file));
				license.hasLicense = true;
			}
		});
	}
	return license;
};

function inferLicenseFromPackage(description) {
	var name = description;
	if (/apache[\s-]2/i.test(name)) {
		name = 'Apache 2.0';
	}

	return {
		name: name,
		text: description
	};
}

function inferLicenseFromFile(file) {
	var content = file.content;
	var license = {
		name: 'unknown',
		text: content.trim(),
		path: file.path
	};
	if (/apache/i.test(content)) {
		var version = content.match(/license-(\d\.\d)/i);
		license.name = 'Apache' + (version ? (' ' + version[1]) : '');
	} else if (/GNU General Public/i.test(content)) {
		var version = content.match(/version (\d)/i);
		license.name = 'GPL' + (version ? (' ' + version[1]) : '');
	} else if (new RegExp('The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software'
			.replace(/ /g, '\\s+'), 'i').test(content)) {
		license.name = 'MIT';
	} else if (/The MIT License/i.test(content)) {
		license.name = 'MIT';
	} else if (/\bmit\b/i.test(file.path)) {
		license.name = 'MIT';
	}
	return license;
}