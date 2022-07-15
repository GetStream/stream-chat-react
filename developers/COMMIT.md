We follow [Angular's Commit Message Format rules](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format). Even though these are curated sets of rules, the following represent our additions to them:

## Commit message type

The commit type makes up the first part of the commit header:

```shell
<type>(<scope>): <short summary>
```

It must be one of the following:

* **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* **chore**: Changes that do not relate to a fix or feature and don't modify source or test files (for example updating dependencies)
* **ci**: Changes to our CI configuration files and scripts (examples: CircleCi, SauceLabs)
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **revert**: Reverts a previous commit
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test**: Adding missing tests or correcting existing tests
* **deprecate**: Certain parts or APIs are deprecated and scheduled for a removal in a newer major version
