# Shared command interface. Stubs fail until implemented, and run inside WSL2.
# Destructive resets must stay separate commands with clear names.
.PHONY: help dev stop-dev test build 

help:
	@echo "  dev            Run the Next.js development server"
	@echo "  stop-dev       Stop the development server"
	@echo "  test           Run lint, type checks, unit tests and Playwright"
	@echo "  build          Create a production build"

# Run the Next.js development server
dev:
	npm run dev

# Stop the development server
stop-dev:
	@echo "stop-dev is not implemented yet" >&2; exit 1

# Run type checks and the Playwright end-to-end tests. Lint and unit tests join in slices 1 and 2
test:
	npm run typecheck
	npm run test:e2e

# Create a production build
build:
	npm run build

