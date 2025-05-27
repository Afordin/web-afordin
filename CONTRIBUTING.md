# Contributing to this project

Thank you for your interest in contributing! To ensure smooth and efficient collaboration, please follow these guidelines.

## Table of Contents

- [How to contribute](#-how-to-contribute)
- [Code of Conduct](#-code-of-conduct)
- [How to Report Issues](#-how-to-report-issues)
- [How to Propose New Features](#-how-to-propose-new-features)
- [How to Fork](#-how-to-fork)
- [How to Submit a Pull Request](#-how-to-submit-a-pull-request)
- [Submitting Issues](#-submitting-issues)

## How to contribute

Thank you for your interest in contributing! To ensure smooth and efficient collaboration, please follow these guidelines.

1. **Explore the Project**: Review the [README](./README.md), structure, and code to understand the project.
2. **Check Open Issues**: Visit the [Issues section](https://img.shields.io/github/issues/Afordin/web-afordin) to see how you can help, or open a new issue to suggest a feature or report a bug.
3. **Fork and clone**: Fork the repository and clone it to your local machine.

## Code of Conduct

We are committed to maintaining a respectful and welcoming collaboration environment.

## How to Report Issues

If you find a bug or issue:

1. **Search Existing Issues**: Check if the issue has already been reported.
2. **Open a New Issue**: If it's a new issue, open one in the [Issues section](https://github.com/Afordin/web-afordin/issues) with a clear and concise description.

## How to Propose New Features

To propose a new feature:

1. **Open an Issue**: Before starting work, open a new issue in the [Issues section](https://github.com/Afordin/web-afordin/issues).
2. **Get Feedback**: Wait for feedback and suggestions from collaborators or maintainers before proceeding.

## How to Fork

To contribute to Afordin, first you need to fork the repository:

1. **Go to the Repository on GitHub**: Visit [Web Afordin](https://github.com/Afordin/web-afordin).
2. **Click Fork**: In the top right corner of the repository page, click the **Fork** button. This creates a copy of the repository in your GitHub account.
3. **Clone Your Fork**: Open a terminal on your local machine and run the following command to clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/web-afordin.git
```

## How to Submit a Pull Request

To submit a pull request (PR):

1. **Sync Your Repository**: Make sure your branch is up to date with the main branch of the original repository.
2. **Create a New Branch**: Make your changes in a separate branch and commit them with clear messages.
3. **Test Your Changes**: Make sure your changes don’t introduce any errors and that everything works as expected.
4. **Open the Pull Request**: Submit a PR from your branch to the main branch of the repository, including a detailed description of your changes.
5. **Wait for Review**: Maintainers will review your PR and provide feedback. Make any necessary modifications.

## Before sending a Pull Request

To avoid conflicts and ensure your fork is up-to-date with the original repository, **follow these steps carefully:**

### 1. Stash Any Local Changes (Optional)

If you have uncommitted changes and don't want to lose them:

```bash
  git stash
```

### 2. Add the Original Repository as upstream (Only Once)

If you haven’t added the original repo as a remote yet:

```bash
git remote add upstream https://github.com/Afordin/web-afordin.git
```

### 3. Switch to Your main Branch

Ensure you are on your fork’s main branch:

```bash
git checkout main
```

### 4. Sync with the Original Repo (upstream)

Pull the latest changes from the original repository:

```bash
git fetch upstream
git rebase upstream/main
```

### 5. Push the Updated Main Branch to Your Fork

Update your forked repo on GitHub:

```bash
git push origin main
```

### 6. Switch to Your Feature/PR Branch

Replace your-branch with the name of your working branch:

```bash
git checkout your-branch
```

### 7. Rebase Your Branch onto the Updated main

This helps avoid merge conflicts in your PR:

```bash
git rebase main
```

### 8. (Optional) Pop Your Stashed Changes Back

If you stashed earlier:

```bash
git stash pop
```

### 9. Push Your Branch

Push your rebased branch to your forked repo:

```bash
git push origin your-branch
```

If you rebased and already had pushed before, you may need to force push:

```bash
git push origin your-branch --force
```

### 10. Compare and Pull Request

Go to your fork on GitHub, and you should see a "Compare & pull request" button.
Click it, add a clear title and description for your PR, then submit it.

## Submitting Issues

To ensure your issue is handled efficiently:

1. **Provide Detailed Information**: Include relevant details about the bug or feature request. This can include steps to reproduce the issue, screenshots, or code examples.
2. **Use Appropriate Labels**: If possible, use the provided labels to categorize your issue (such as bug, enhancement, etc.).
3. **Be Clear and Concise**: Write a clear and to-the-point description so maintainers can quickly understand the issue or request.
4. **Check Existing Issues**: Before opening a new issue, review existing ones to ensure the same problem or request hasn't already been reported.

---

Thank you for your interest and contribution to Afordin. Your help is very valuable!
