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
	@echo "dev is not implemented yet" >&2; exit 1

# Stop the development server
stop-dev:
	@echo "stop-dev is not implemented yet" >&2; exit 1

# Run lint, type checks, unit tests and Playwright
test:
	@echo "test is not implemented yet" >&2; exit 1

# Create a production build
build:
	@echo "build is not implemented yet" >&2; exit 1

