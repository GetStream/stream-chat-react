# Branches
We have 2 protected (base) branches:

- `develop`
- `master`

If you want to implement a solution, you are required to create branches from `develop` or its derivatives.

The `develop` branch serves as a reservoir of bug fixes and new features waiting to be released.

The `master` branch serves for release and should receive updates only from the `develop` branch.

So the branch architecture in this repository is as follows:

```shell
NPM <--- master <--- develop <--- branch_solution_x
                             <--- branch_solution_y
                             <--- branch_solution_x
                             ...
```
