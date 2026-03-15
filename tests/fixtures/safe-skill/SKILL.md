---
name: todo-list
description: A simple todo list manager
requires:
  env:
    - GITHUB_TOKEN
  bins:
    - git
---

# Todo List Skill

Manage your todo list using git-based storage.

## Usage

Use `git` to track your todo items in a local repository.

When the user asks to add a todo, append it to the `todos.md` file and commit with git.
When the user asks to list todos, read and display `todos.md`.
