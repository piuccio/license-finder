# license finder

Using GitHub API, scans all public repository of a user or group and find whether they contain license information, excluding forks.

# usage

To avoid being rate limited too quickly, export the following environment variables

```
GTIHUB_USER=you_user_name
GITHUB_TOKEN=an_application_token
```

you can also write those in an `.env` file.


Then run

```
node index.js username
```

The report is generated inside `report.html`


# cache

The script caches all requests to github inside `tmp` folder.

* `repository-list.cache.json` contains the list of all repositories.
* `root-files-*.cache.json` contains the list of files in the top directory of each repository.
* `files-content-*.cache.json` contains the text content of all files that might contain license information for each repository.

You can either clean the cache by removing the `tmp` folder or some of its file, or run the script with `DISABLE_CACHE=true`.

Not using the cache might quickly reach the request limit.

# development

```
npm run watch -- username
```

It requires `nodemon` to be installed globally.
