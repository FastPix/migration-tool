---
name: Question/Support
about: Ask questions or get help with the FastPix Migration Tool
title: '[QUESTION] '
labels: ['question', 'needs-triage']
assignees: ''
---

# Question/Support

Thank you for reaching out! We're here to help you with the FastPix Migration Tool. Please provide the following information:

> [!WARNING]
> **Never paste API keys, access tokens, secret keys, or presigned URLs into this issue.** Replace every secret with `***` before submitting. If you have already exposed a credential, revoke and regenerate it on that platform.

## Question Type
- [ ] How to use a specific feature
- [ ] Source platform setup (credentials, API scopes, permissions, plan requirements)
- [ ] Configuration question
- [ ] Migration failed and I don't understand why
- [ ] Performance question (large libraries, throughput)
- [ ] Self-hosting / deployment help
- [ ] Troubleshooting help
- [ ] Other: _______________

## Question
**What would you like to know?**
```
<!-- Please provide a clear, specific question -->
```

## What You've Tried
**What have you already attempted to solve this?**
```
<!-- Describe the steps you've taken, and paste any relevant config or output
     with credentials redacted -->
```

## Current Setup
**Describe your current setup:**

### Environment
- **Operating System:** [e.g., Windows 10, macOS 14.0, Ubuntu 22.04, etc.]
- **Node.js Version:** [e.g., 18.20.4, 20.11.0, 22.3.0 — run `node -v`]
- **Package Manager:** [e.g., npm, yarn, pnpm, bun]
- **Browser:** [e.g., Chrome 120, Firefox 121, Safari 17, Edge 120, etc.]
- **Migration Tool Version:** [e.g., 1.0.2 — see `package.json` or CHANGELOG.md]
- **How are you running it:** [e.g., `npm run dev` locally, `npm run build && npm start`, Docker, Vercel]

### Migration Configuration
- **Source Platform:**
  - [ ] Mux
  - [ ] Api.video
  - [ ] Cloudflare Stream
  - [ ] Amazon S3
  - [ ] Vimeo
- **Destination Platform:** FastPix
- **Approximate library size:** [e.g., 15 videos, 2,000 videos]
- **Max Resolution Tier:** [e.g., 1080p]
- **Playback Policy:** [public / private]

### Source Platform Details
```
<!-- Relevant account details, with NO credentials:
     - Api.video: sandbox or production?
     - Amazon S3: bucket region, public or private objects?
     - Vimeo: account plan and token scopes
     - Mux: do the assets require master access?
     - Cloudflare Stream: account ID present and token permissions? -->
```

## Expected Outcome
**What are you trying to achieve?**
```
<!-- Describe your end goal -->
```

## Error Messages (if any)

### Failed Videos Table
```
<!-- Rows from the Failed Videos List on the migration status screen -->
SL.NO | VIDEO ID | STATUS CODE | ERROR MESSAGE
```

### Server Console Output
The migration runs in Next.js API routes, so the useful logs appear in the **terminal running the server**, not the browser console:

```
<!-- Paste the [Platform] / [FastPix] log lines here -->
```

## Additional Context

### Use Case
**What are you migrating and why?**

- [ ] One-off bulk migration to FastPix
- [ ] Evaluating FastPix before committing
- [ ] Incremental / ongoing migration
- [ ] Consolidating multiple source platforms
- [ ] Other: _______________

### Timeline
**When do you need this resolved?**

- [ ] ASAP (blocking a migration in progress)
- [ ] This week
- [ ] This month
- [ ] No rush

### Resources Checked
**What resources have you already checked?**

- [ ] README.md
- [ ] CHANGELOG.md
- [ ] TESTING.md
- [ ] FastPix Documentation
- [ ] Source platform's own API documentation
- [ ] GitHub Issues
- [ ] Other: _______________

## Priority
Please indicate the urgency:

- [ ] Critical (Blocking production deployment)
- [ ] High (Blocking development)
- [ ] Medium (Would like to know soon)
- [ ] Low (Just curious)

## Checklist
Before submitting, please ensure:

- [ ] I have provided a clear question
- [ ] I have described what I've tried
- [ ] I have included my current setup
- [ ] I have checked existing documentation
- [ ] I have provided sufficient context
- [ ] **I have removed every API key, token, secret and presigned URL**

---

**We'll do our best to help you get unstuck! 🚀**

**For urgent issues, please also consider:**
- [FastPix Documentation](https://fastpix.com/docs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/fastpix)
- [GitHub Issues](https://github.com/FastPix/migration-tool/issues)
