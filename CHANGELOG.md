# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2]

### Maintenance
- **Code quality cleanup** across API routes and components to address static analysis findings and improve overall maintainability.
- **Removed hardcoded values** in favour of named constants for clearer, more configurable behaviour (e.g. the Cloudflare download-URL readiness delay).
- **Consistent coding conventions** and minor refactors applied throughout the codebase with no change to existing functionality.

## [1.0.1]
- Support for **private S3 buckets and private objects**. Private content is now migrated along with public content.
- Internal handling of **S3 region** – no longer required as user input during migration setup.
- Migration SDK updated to use the **latest FastPix Node.js Upload SDK** for improved performance and compatibility.

## [1.0.0]

### Features
- **Automated video content migration** to FastPix.
- **Bulk transfer capabilities** for large video datasets.
- **Metadata mapping** during the migration process for consistency and alignment.