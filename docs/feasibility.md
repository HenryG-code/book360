# Feasibility gates

**Start here.** Nothing is tested yet. The website does not depend on the AI experiment, so keep the two apart.

## Website

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
