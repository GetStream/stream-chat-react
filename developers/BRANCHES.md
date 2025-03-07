# Branches

We have one (base) branch, `master`. If you want to implement a solution, you are required to create branches from `master` or its derivatives. The `master` branch serves for release and should receive updates only through squash-merging feature branches - each of these squashed-commits should be up to date with `master` branch and should be passing CI requirements.

The branch architecture in this repository is as follows:

```shell
NPM <--- master <--- branch_solution_x
                <--- branch_solution_y
                <--- branch_solution_x
                ...
```
