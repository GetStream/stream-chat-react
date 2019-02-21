.PHONY: netlify
.PHONY: deploy example-build example-deps

EXAMPLES_PATH = examples
EXAMPLES = messaging team livestream commerce
EXAMPLES_APPS = $(addprefix $(EXAMPLES_PATH)/,$(EXAMPLES))
EXAMPLES_APPS_DEPS = $(addsuffix /node_modules/installed_dependencies,$(EXAMPLES_APPS))
EXAMPLES_APPS_INDEX = $(addsuffix /build/index.html,$(EXAMPLES_APPS))

SOURCES = $(filter(%$(EXAMPLES_PATH)/, $(wildcard *.js) $(wildcard */*.js) $(wildcard */*.scss) $(wildcard */*.png) $(wildcard */*.html) $(wildcard ../client/*/*.js) $(wildcard ../client/*.js))
LIB_SOURCES = $(wildcard *.js) $(wildcard */*.js) $(wildcard */*.scss) $(wildcard */*.png) $(wildcard */*.html) $(wildcard ../client/*/*.js) $(wildcard ../client/*.js)

CHAT_DEPS = ../client/package.json

example-deps: $(EXAMPLES_APPS_DEPS)
example-build: $(EXAMPLES_APPS_INDEX)

$(EXAMPLES_APPS_DEPS): %/node_modules/installed_dependencies: %/yarn.lock %/package.json $(SOURCES) node_modules/installed_dependencies
	cd $* && yarn install
	touch $@

.SECONDEXPANSION:
$(EXAMPLES_APPS_INDEX): %/build/index.html: dist/built %/package.json %/node_modules/installed_dependencies $$(wildcard %/*.js) $$(wildcard %/*/*.js) $$(wildcard %/public/*) $(SOURCES)
	export SKIP_PREFLIGHT_CHECK=true && cd $* && yarn build
	touch $@

node_modules/installed_dependencies: yarn.lock package.json
	yarn install
	touch $@

dist/built: $(LIB_SOURCES) node_modules/installed_dependencies
	yarn build
	touch $@ q

clean:
	rm -rf $(addsuffix /node_modules,$(EXAMPLES_APPS))
	rm -rf build
	rm -rf node_modules

