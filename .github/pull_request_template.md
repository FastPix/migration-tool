# FastPix Migration Tool - Pull Request

## Changes

### What Changed
- [ ] New source platform support
- [ ] Bug fix in an existing source platform
- [ ] Credential validation change
- [ ] Migration / FastPix upload logic change
- [ ] UI or wizard flow change
- [ ] Documentation added or updated
- [ ] Dependency update
- [ ] Refactor / maintenance (no behavior change)
- [ ] Other

### Affected Source Platforms
- [ ] Mux
- [ ] Api.video
- [ ] Cloudflare Stream
- [ ] Amazon S3
- [ ] Vimeo
- [ ] FastPix (destination)
- [ ] None / not platform-specific

### Files Modified
- [ ] `src/app/apicalls/` (API routes)
- [ ] `src/app/components/Utils/fastpix.ts` (shared upload logic — **affects every platform**)
- [ ] `src/app/components/` (UI)
- [ ] README.md
- [ ] CHANGELOG.md
- [ ] TESTING.md
- [ ] Other: _______________

### Summary
**Brief description of changes:**
```
<!-- What was added, fixed, or changed, and why? -->
```

### Related Issue
```
<!-- e.g. Closes #42 -->
```

## Testing

### Verification Performed
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] App loads at `http://localhost:3000` with no console errors
- [ ] Relevant cases from TESTING.md executed

### Migration Tested End-to-End
**Which source platforms did you actually run a migration against?**

| Platform | Tested | Result |
|----------|--------|--------|
| Mux | [ ] | |
| Api.video | [ ] | |
| Cloudflare Stream | [ ] | |
| Amazon S3 | [ ] | |
| Vimeo | [ ] | |

### No Regression on Other Platforms
If you changed anything shared (`fastpix.ts`, `FailedVideos`, `validatecredentials`), explain why the untouched platforms are unaffected:

```
<!-- e.g. "The new field is optional and only set by the Vimeo route; every other
     platform leaves it undefined and falls through to the existing behavior." -->
```

### Not Tested
**Be explicit about what you could not verify and why:**
```
<!-- e.g. "Vimeo success path untested — requires a Standard or higher plan." -->
```

## Security
- [ ] No API keys, tokens, secrets or presigned URLs are committed
- [ ] No credentials are written to logs
- [ ] No credentials appear in screenshots attached to this PR
- [ ] No new secret is sent to a third party beyond the platform it belongs to

## Review Checklist
- [ ] Changes are scoped to what the issue/summary describes
- [ ] Error messages are actionable (tell the user what to do, not just what failed)
- [ ] Code follows existing conventions in the file
- [ ] CHANGELOG.md updated if user-facing behavior changed
- [ ] Documentation updated if setup or prerequisites changed
- [ ] Build artifacts (`.next/`, `tsconfig.tsbuildinfo`) are not committed

### Screenshots (if UI changed)
```
<!-- Before / after screenshots. Blur or crop any credential fields. -->
```

---

**Ready for review!**
