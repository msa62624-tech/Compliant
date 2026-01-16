# Creating a New Repository and Bringing in Old Files

This guide explains how to create a new repository and bringing in files from an existing repository. There are several methods depending on your needs.

---

## Table of Contents

1. [Method 1: Manual Copy (Simplest)](#method-1-manual-copy-simplest)
2. [Method 2: Git Clone and Remove History](#method-2-git-clone-and-remove-history)
3. [Method 3: Git Subtree (Preserve History)](#method-3-git-subtree-preserve-history)
4. [Method 4: Git Filter-Repo (Selective History)](#method-4-git-filter-repo-selective-history)
5. [Method 5: Git Submodule (Reference Only)](#method-5-git-submodule-reference-only)
6. [Best Practices](#best-practices)

---

## Method 1: Manual Copy (Simplest)

**Use when:** You don't need git history, just the current file(s).

### Steps:

1. **Create a new repository on GitHub:**
   ```bash
   # Via GitHub UI or CLI
   gh repo create my-new-repo --public --clone
   # Or manually create on github.com
   ```

2. **Copy files from old repository:**
   ```bash
   # Navigate to old repository
   cd /path/to/old-repo
   
   # Copy specific file(s)
   cp path/to/file.txt /path/to/new-repo/
   
   # Or copy entire directory
   cp -r path/to/directory /path/to/new-repo/
   ```

3. **Initialize and commit in new repository:**
   ```bash
   cd /path/to/new-repo
   git add .
   git commit -m "Initial commit with files from old repository"
   git push origin main
   ```

**Pros:**
- Simple and straightforward
- Clean history
- Full control over what to include

**Cons:**
- Loses all git history
- Manual process

---

## Method 2: Git Clone and Remove History

**Use when:** You want all files but want to start fresh without old commit history.

### Steps:

1. **Clone the old repository:**
   ```bash
   git clone https://github.com/username/old-repo.git new-repo
   cd new-repo
   ```

2. **Remove git history:**
   ```bash
   rm -rf .git
   ```

3. **Initialize new repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit from old-repo"
   ```

4. **Create new remote repository and push:**
   ```bash
   # Create repo on GitHub first, then:
   git remote add origin https://github.com/username/new-repo.git
   git branch -M main
   git push -u origin main
   ```

**Pros:**
- Gets all current files easily
- Fresh start with clean history
- Simple to execute

**Cons:**
- Loses all commit history
- Not selective (gets everything)

---

## Method 3: Git Subtree (Preserve History)

**Use when:** You want to bring specific files/directories WITH their commit history.

### Steps:

1. **Create new repository:**
   ```bash
   mkdir new-repo
   cd new-repo
   git init
   ```

2. **Add old repository as remote:**
   ```bash
   git remote add old-repo https://github.com/username/old-repo.git
   git fetch old-repo
   ```

3. **Extract specific directory with history:**
   ```bash
   # This brings in the entire branch first
   git merge --allow-unrelated-histories old-repo/main
   
   # If you only want a specific subdirectory, use subtree split
   git subtree split --prefix=path/to/directory --branch=temp-branch
   git checkout -b main temp-branch
   git branch -D temp-branch
   ```

4. **Push to new remote:**
   ```bash
   git remote add origin https://github.com/username/new-repo.git
   git push -u origin main
   ```

**Pros:**
- Preserves commit history
- Can be selective about directories
- Native git command

**Cons:**
- More complex
- May bring unwanted history
- Can't easily filter specific files

---

## Method 4: Git Filter-Repo (Selective History)

**Use when:** You need precise control over which files and history to keep.

### Prerequisites:

```bash
# Install git-filter-repo
pip install git-filter-repo
# Or: brew install git-filter-repo (macOS)
```

### Steps:

1. **Clone the old repository:**
   ```bash
   git clone https://github.com/username/old-repo.git new-repo
   cd new-repo
   ```

2. **Filter to keep only specific files/directories:**
   ```bash
   # Keep only specific paths
   git filter-repo --path path/to/keep --path another/file.txt
   
   # Or remove specific paths
   git filter-repo --path-glob '*.txt' --invert-paths
   
   # Or keep only commits touching certain files
   git filter-repo --path path/to/file.txt --prune-empty always
   ```

3. **Create new remote and push:**
   ```bash
   git remote add origin https://github.com/username/new-repo.git
   git push -u origin main
   ```

**Pros:**
- Most powerful and flexible
- Preserves relevant history
- Can filter by path, author, date, etc.
- Recommended by Git team

**Cons:**
- Requires additional tool
- More complex syntax
- Rewrites history (use with caution)

---

## Method 5: Git Submodule (Reference Only)

**Use when:** You want to reference old repository without copying files.

### Steps:

1. **Create new repository:**
   ```bash
   mkdir new-repo
   cd new-repo
   git init
   ```

2. **Add old repository as submodule:**
   ```bash
   git submodule add https://github.com/username/old-repo.git path/to/submodule
   git commit -m "Add old-repo as submodule"
   ```

3. **Push to new remote:**
   ```bash
   git remote add origin https://github.com/username/new-repo.git
   git push -u origin main
   ```

**Pros:**
- Keeps repositories separate
- Can pull updates from old repo
- Maintains clear separation

**Cons:**
- Doesn't copy files (just reference)
- Submodules can be confusing
- Requires both repos to exist

---

## Best Practices

### Before You Start

1. **Decide what you need:**
   - Just the latest files? → Use Method 1 (Manual Copy)
   - Everything with fresh history? → Use Method 2 (Clone & Remove History)
   - Preserve directory with history? → Use Method 3 (Git Subtree)
   - Preserve history for specific files? → Use Method 4 (Git Filter-Repo)
   - Keep separate but linked? → Use Method 5 (Git Submodule)

2. **Check for sensitive data:**
   ```bash
   # Search for potential secrets
   git log --all --source --full-history -- "**/*.env" "**/*secret*" "**/*password*"
   ```

3. **Review file sizes:**
   ```bash
   # Find large files in history
   git rev-list --objects --all | \
     git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
     sed -n 's/^blob //p' | \
     sort --numeric-sort --key=2 | \
     tail -20
   ```

### After Migration

1. **Update documentation:**
   - README.md
   - Links to old repository
   - Installation instructions
   - Dependencies

2. **Set up new repository settings:**
   - Branch protection rules
   - Required status checks
   - Collaborators and permissions
   - Webhooks and integrations

3. **Communicate the change:**
   - Notify team members
   - Update documentation links
   - Archive old repository (if applicable)

### Security Considerations

1. **Remove sensitive data:**
   ```bash
   # Use git-filter-repo to remove sensitive files
   git filter-repo --path path/to/secret.env --invert-paths
   ```

2. **Rotate credentials:**
   - Change API keys
   - Update passwords
   - Generate new tokens

3. **Review .gitignore:**
   ```bash
   # Ensure sensitive files are ignored
   echo ".env" >> .gitignore
   echo "*.key" >> .gitignore
   git add .gitignore
   git commit -m "Update .gitignore"
   ```

---

## Quick Reference Commands

### Copy Single File
```bash
# From old repo
cd /path/to/old-repo
cp path/to/file.txt /tmp/

# To new repo
cd /path/to/new-repo
mv /tmp/file.txt ./
git add file.txt
git commit -m "Add file from old-repo"
```

### Copy Directory
```bash
cp -r /path/to/old-repo/directory /path/to/new-repo/
cd /path/to/new-repo
git add directory
git commit -m "Add directory from old-repo"
```

### Get Specific File from History
```bash
# In new repo, add old repo as remote
git remote add old-repo https://github.com/username/old-repo.git
git fetch old-repo

# Checkout specific file from specific commit
git checkout old-repo/main -- path/to/file.txt
git commit -m "Import file.txt from old-repo"
```

---

## Common Issues and Solutions

### Issue: "Refusing to merge unrelated histories"

**Solution:**
```bash
git merge --allow-unrelated-histories old-repo/main
```

### Issue: Large repository size after migration

**Solution:**
```bash
# Clean up old references
git gc --aggressive --prune=now

# If still large, use filter-repo to remove large files
git filter-repo --strip-blobs-bigger-than 10M
```

### Issue: Want to keep only recent history

**Solution:**
```bash
# Keep only last N commits
git filter-repo --refs HEAD --commit-limit 100
```

---

## Additional Resources

- [GitHub: About repository transfers](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- [Git Documentation: git-filter-repo](https://github.com/newren/git-filter-repo)
- [Git Subtree Documentation](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging)
- [Pro Git Book: Git Basics](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository)

---

## Need Help?

If you encounter issues:

1. Check the [Git documentation](https://git-scm.com/doc)
2. Review GitHub's [repository migration guides](https://docs.github.com/en/migrations)
3. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/git) with the `git` tag
4. Consult your team's version control guidelines

---

**Last Updated:** January 2026
