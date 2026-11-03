# Threat model

Initial draft. Update it as the implementation takes shape.

**Valuable data:** minimal in the static demo. Trust in labelling matters most, along with any private content in media.

**Entry points:** public pages, URL filter parameters, static assets, preview builds.

| Threat | Planned mitigation |
|---|---|
| Secrets in client bundles | No secrets in the demo, with bundles inspected before release |
| Contributor code running in Vercel previews | Fork Protection on, builds reviewed, no sensitive preview variables |
| Private details in sample media | Permitted photos only, with EXIF and GPS metadata reviewed and no private addresses |
| Personal details in screenshots or logs | Synthetic booking data only |
| Misleading generated content | Clear AI-preview labels and discoverable original photos |
| Unsafe URL parameters | Runtime validation with Zod |
