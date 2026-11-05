# Artificial Culture: public website

Public static website and development notes by Sympath.

Live: https://maxjonata.github.io/artificial-culture-site/

This repository contains only public website artifacts. The product implementation is maintained separately.

## CI/CD

Pushes and pull requests run `npm ci`, `npm test`, release-message validation and `npm run build` on GitHub. Only a successful default-branch run may publish the `dist/` artifact to GitHub Pages. Pull requests never deploy. Pages source must be **GitHub Actions**.

This is a static website: the build validates local assets, generates the release feed and packages only public website files. Product C++ compilation belongs to the product repository.

## Major and minor releases

Use `release(project): vX.Y.Z` with exactly one fenced `patch-notes` JSON block in the commit body. Copy `.github/RELEASE_COMMIT_TEMPLATE.txt`. Save the identical object at `releases/<project>/v<version>.json`. A mismatched message, invalid schema, missing translation, incorrect semver kind, reused version with conflicting contents or changed historical release fails CI. The build merges versioned notes with the existing historical feed. Only approved public fields are consumed; other commit text is not published.

Product repositories may vendor `scripts/release.mjs` and `scripts/publish-public-release.mjs`. Run the publisher only after their actual builds/tests pass on trusted main/master pushes, with full Git history. Set `PUBLIC_SITE_REPOSITORY=maxjonata/artificial-culture-site` and secret `PUBLIC_SITE_TOKEN`, granting Contents write only for this website repository. Do not pass the secret into PR jobs. Missing credentials fail the release submission clearly; normal commits need no publishing credential. The standard `GITHUB_TOKEN` cannot write a different repository.

## Updating the website

Build the maintained Vite website in the private project and copy only its public output into this repository, preserving scripts, tests, releases, package files and .github. Keep root `updates.json` as unversioned historical notes; the build adds versioned entries into `dist/updates.json`. Do not copy generated `dist/updates.json` back into the historical file. Commit and push; the repository CI validates and deploys the website automatically. No manual Cloudflare upload is involved for this GitHub Pages site.
