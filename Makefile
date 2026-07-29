# braindance — build and preview
#
# Common targets:
#   make run        start the dev server with live reload (alias: dev)
#   make build      produce a production build in dist/
#   make preview    serve the production build locally
#   make new-post   scaffold a new MDX entry
#
# Deployment is automatic: pushing to `main` triggers the GitHub Actions
# workflow (.github/workflows/deploy.yml), which builds and publishes to Pages.
#
# Run `make help` for the full list.

.DEFAULT_GOAL := help
SHELL := /bin/bash

NPM  := npm
PORT ?= 4321

# Marker file so install only re-runs when the lockfile actually changes.
NODE_MODULES := node_modules/.package-lock.json

.PHONY: help run dev build preview new-post check clean distclean install

## help: list available targets
help:
	@echo "blog — available targets:"
	@echo
	@grep -E '^## [a-z-]+:' $(MAKEFILE_LIST) \
		| sed -e 's/^## //' \
		| awk -F': ' '{ printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }'
	@echo
	@echo "Variables: PORT=$(PORT)"

$(NODE_MODULES): package.json package-lock.json
	@$(NPM) install
	@touch $@

## install: install dependencies
install: $(NODE_MODULES)

## run: start the dev server with live reload
run: install
	@$(NPM) run dev -- --port $(PORT)

## dev: alias for run
dev: run

## build: produce a production build in dist/
build: install
	@$(NPM) run build

## preview: build, then serve the production output locally
preview: build
	@$(NPM) run preview -- --port $(PORT)

## check: type-check and validate content frontmatter
check: install
	@$(NPM) run check

## new-post: scaffold a new MDX entry (TITLE="My Post")
new-post:
	@./scripts/new-post.sh $(if $(TITLE),"$(TITLE)")

## clean: remove build output and caches
clean:
	@rm -rf dist .astro
	@echo "removed dist/ and .astro/"

## distclean: clean, and remove node_modules
distclean: clean
	@rm -rf node_modules
	@echo "removed node_modules/"
