# Feasibility gates

**Start here.** Nothing is tested yet. The website does not depend on the AI experiment, so keep the two apart.

## Website

The prototype exists and was checked once on a desktop: see the
[desktop lab check](benchmarks/2026-11-13-slice-0-desktop.md). It now uses real 360-degree photographs.
No gate is ticked, because that check used a simulated WebGL failure, no phone and no deployment, and
nobody else has yet been asked whether the labels are clear.

The site is now deployed: see the [live deployment check](benchmarks/2026-11-17-live-deployment.md).
The fourth gate stays open until the panorama sizes are compared with the hosting plan's limits.

- [ ] Booking flow works without the viewer
- [ ] A sample panorama loads acceptably on mobile
- [ ] Source photos and AI labels are clear
- [ ] Deployed artifact and bandwidth budget fit the current Vercel terms

## AI experiment (offline, one owned or permitted room)

- [ ] Linux, WSL2 or container GPU path verified separately from a Windows GPU query
- [ ] Overlapping, sharp capture produced, as a few listing photos may leave major gaps
- [ ] One default Splatfacto scene trained within available GPU memory
- [ ] Browser-compatible export or rendered walkthrough validated
- [ ] Quality, navigation, frame rate, download size and GPU requirements compared

If it fails the quality threshold, ship the panorama experience and keep the experiment as a documented
research branch. Record the outcome as an ADR. Keep GPU work out of normal pull request checks.
