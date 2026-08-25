---
name: Bug Report
about: Report a bug or unexpected behavior in the FastPix Migration Tool
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

# Bug Report

Thank you for taking the time to report a bug with the FastPix Migration Tool. To help us resolve your issue quickly and efficiently, please provide the following information:

> [!WARNING]
> **Never paste API keys, access tokens, secret keys, or presigned URLs into this issue.** This tool handles credentials for Mux, Api.video, Cloudflare Stream, Amazon S3, Vimeo and FastPix. Replace every secret with `***` before submitting. If you have already exposed a credential, revoke and regenerate it on that platform.

## Description
**Clear and concise description of the bug:**
```
<!-- Please provide a detailed description of what you're experiencing -->
```

## Environment Information

### System Details
- **Operating System:** [e.g., Windows 10, macOS 14.0, Ubuntu 22.04, etc.]
- **Node.js Version:** [e.g., 18.20.4, 20.11.0, 22.3.0 — run `node -v`]
- **Package Manager:** [e.g., npm 10.8.1, yarn 1.22.22, pnpm, bun]
- **Browser:** [e.g., Chrome 120, Firefox 121, Safari 17, Edge 120, etc.]
- **How are you running it:** [e.g., `npm run dev` locally, `npm run build && npm start`, Docker, Vercel, other host]

### Tool Information
- **Migration Tool Version:** [e.g., 1.0.2 — see `package.json` or CHANGELOG.md]
- **Commit / Branch:** [e.g., `227d450` on `feature/migration-tool`] (if running from source)
- **Next.js Version:** [e.g., 15.0.3]

## Migration Setup

### Platforms
- **Source Platform:**
  - [ ] Mux
  - [ ] Api.video
  - [ ] Cloudflare Stream
  - [ ] Amazon S3
  - [ ] Vimeo
- **Destination Platform:** FastPix

### Source Platform Details
```
<!-- Anything relevant about the source account, with NO credentials:
     - Api.video: sandbox or production?
     - Amazon S3: bucket region, public or private objects?
     - Vimeo: account plan (free/starter/standard/advanced/pro/business/premium), token scopes
     - Mux: do the assets require master access?
     - Approximate number of videos being migrated -->
```

### Import Settings
- **Max Resolution Tier:** [e.g., 480p, 720p, 1080p, 1440p, 2160p]
- **Playback Policy:** [public / private]
- **Encoding Tier:** [e.g., smart]

## Reproduction Steps

1. **Setup Environment:**
   ```bash
   git clone https://github.com/FastPix/migration-tool.git
   cd migration-tool
   npm install
   npm run dev
   ```

2. **Wizard Steps Followed:**
   ```
   <!-- Which step of the wizard did the problem occur on?
        1. Select source platform
        2. Enter source credentials
        3. Select videos / transfer range
        4. Select destination (FastPix)
        5. Enter FastPix credentials
        6. Import settings
        7. Review
        8. Migration status
   -->
   ```

3. **Expected Behavior:**
   ```
   <!-- Describe what you expected to happen -->
   ```

4. **Actual Behavior:**
   ```
   <!-- Describe what actually happened -->
   ```

5. **Error Messages/Logs:**
   ```
   <!-- Paste any error messages, stack traces, or logs here -->
   ```

## Debugging Information

### Failed Videos Table
If the migration completed but some videos failed, paste the rows from the **Failed Videos List** shown on the migration status screen:

```
SL.NO | VIDEO ID   | STATUS CODE | ERROR MESSAGE
1     | 1221100846 | —           | No downloadable MP4: the Vimeo account is on the 'free' plan...
```

### Server Console Output
The migration runs in Next.js API routes, so the useful logs appear in the **terminal running the dev server**, not the browser console. Paste them here:

```
<!-- e.g.
[Vimeo] Fetching videos from Vimeo
[Vimeo] Token scopes: private video_files public — video_files=true
[FastPix] Processing 12 video(s) from platform=vimeo
[FastPix] Failed to create media for videoId=...
-->
```

### Browser Console Output
```
<!-- Paste any client-side errors here -->
```

### Network Requests
```http
# The relevant /apicalls/* request and response (REMOVE all credentials)
POST http://localhost:3000/apicalls/vimeo HTTP/1.1
Content-Type: application/json

{
  "sourcePlatform": { "id": "vimeo", "credentials": { "secretKey": "***" } },
  "destinationPlatform": { "id": "fastPix", "credentials": { "publicKey": "***", "secretKey": "***" } }
}

# Response
{ "success": true, "createdMedia": [], "failedMedia": [ ... ] }
```

### Screenshots
```
<!-- If applicable, please attach screenshots that help explain your issue.
     Blur or crop any credential fields before uploading. -->
```

## Additional Context

### Scope of the Problem
- [ ] Affects one specific video
- [ ] Affects all videos from one source platform
- [ ] Affects all source platforms
- [ ] Affects credential validation only
- [ ] Affects the UI only (migration itself succeeds)

### Workarounds
```
<!-- If you've found any workarounds, please describe them here -->
```

## Priority
Please indicate the priority of this bug:

- [ ] Critical (Blocks production use)
- [ ] High (Significant impact on functionality)
- [ ] Medium (Minor impact)
- [ ] Low (Nice to have)

## Checklist
Before submitting, please ensure:

- [ ] I have searched existing issues to avoid duplicates
- [ ] I have provided all required information
- [ ] I have tested with the latest version of the tool
- [ ] **I have removed every API key, token, secret and presigned URL**
- [ ] I have confirmed my source platform credentials are valid and have the required permissions
- [ ] I have included the server-side console output
- [ ] I have checked the documentation and CHANGELOG.md

---

**Thank you for helping improve the FastPix Migration Tool! 🚀**
