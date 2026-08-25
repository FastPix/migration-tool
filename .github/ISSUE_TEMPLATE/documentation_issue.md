---
name: Documentation Issue
about: Report problems with the FastPix Migration Tool documentation
title: '[DOCS] '
labels: ['documentation', 'needs-triage']
assignees: ''
---

# Documentation Issue

Thank you for helping improve the FastPix Migration Tool documentation! Please provide the following information:

## Issue Type
- [ ] Missing documentation
- [ ] Incorrect information
- [ ] Unclear explanation
- [ ] Broken links
- [ ] Outdated content
- [ ] Missing prerequisite (e.g. a required platform plan, permission or API scope)
- [ ] Other: _______________

## Description
**Clear description of the documentation issue:**
```
<!-- What's wrong with the documentation? -->
```

## Current Documentation
**What does the current documentation say?**
```
<!-- Paste the current documentation content -->
```

## Expected Documentation
**What should the documentation say instead?**
```
<!-- Describe what the correct documentation should be -->
```

## Location
**Where is this documentation issue located?**

- [ ] README.md
- [ ] CHANGELOG.md
- [ ] TESTING.md
- [ ] In-app copy (wizard labels, help text, error messages)
- [ ] GitHub repository documentation
- [ ] External documentation (https://fastpix.com/docs)
- [ ] Code comments
- [ ] Other: _______________

**Specific file and section:**
```
<!-- e.g., README.md line 20, section "Getting Started",
     or src/app/apicalls/vimeo/route.ts error message, or external docs URL -->
```

## Affected Platform
**Is this specific to one source platform?**

- [ ] Not platform-specific
- [ ] Mux
- [ ] Api.video
- [ ] Cloudflare Stream
- [ ] Amazon S3
- [ ] Vimeo
- [ ] FastPix (destination)

## Impact
**How does this documentation issue affect users?**

- [ ] Blocks new users from getting started
- [ ] Causes confusion for existing users
- [ ] Leads to incorrect implementation
- [ ] Leads users to a setup that cannot work (e.g. an unsupported plan or missing API scope)
- [ ] Creates support requests
- [ ] Other: _______________

## Proposed Fix
**How would you like this documentation issue to be resolved?**

````markdown
<!-- Example of how the documentation should be written -->

## Vimeo prerequisites

Before migrating from Vimeo, confirm all of the following:

1. **Plan** — file download links are available on Standard, Advanced, Pro,
   Business, Premium or Enterprise plans only. Free and Starter accounts do not
   expose them, and no token configuration works around this.
2. **Token scopes** — generate a personal access token at
   https://developer.vimeo.com/apps with `public`, `private` and `video_files`
   all enabled. All three are required.
3. **Per-video setting** — downloads must be enabled on each video
   (Settings → Privacy → Download).
````

## Additional Context

### Screenshots
```
<!-- If applicable, include screenshots of the documentation issue.
     Blur or crop any credential fields before uploading. -->
```

### Related Issues
- **GitHub Issues:** [Link to any related issues]
- **User Feedback:** [Link to user complaints or confusion]

### Testing
**How did you discover this issue?**

- [ ] While following the documentation
- [ ] A migration failed and the docs didn't explain why
- [ ] User reported confusion
- [ ] Setup didn't work as documented
- [ ] Other: _______________

## Priority
Please indicate the priority of this documentation issue:

- [ ] Critical (Blocks users from using the tool)
- [ ] High (Causes significant confusion)
- [ ] Medium (Minor clarity issue)
- [ ] Low (Cosmetic improvement)

## Checklist
Before submitting, please ensure:

- [ ] I have identified the specific documentation issue
- [ ] I have provided the current and expected content
- [ ] I have explained the impact on users
- [ ] I have proposed a clear fix
- [ ] I have checked if this is already reported
- [ ] I have provided sufficient context
- [ ] I have removed any sensitive information

---

**Thank you for helping improve the FastPix Migration Tool documentation! 📚**
