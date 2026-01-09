.PHONY: install build develop clean achievements

install:
	sudo dnf install -y ruby ruby-devel rubygems gcc make redhat-rpm-config
	gem install bundler
	bundle install

BASEURL ?= /demianbrecht.com

build:
	bundle exec jekyll build --baseurl "$(BASEURL)"

develop:
	bundle exec jekyll serve --livereload

clean:
	rm -rf _site .jekyll-cache .sass-cache

achievements:
	@echo "GitHub Achievements - Manual Update Instructions"
	@echo "================================================"
	@echo ""
	@echo "1. Visit https://github.com/demianbrecht"
	@echo "2. Check the Achievements section on the profile"
	@echo "3. Update GITHUB_ACHIEVEMENTS in assets/js/posts.js"
	@echo ""
	@echo "Current achievements in posts.js:"
	@grep -A 10 "GITHUB_ACHIEVEMENTS = \[" assets/js/posts.js | head -12
