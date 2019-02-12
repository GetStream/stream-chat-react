.PHONY: netlify
.PHONY: deploy example-build example-deps

EXAMPLES_PATH = examples
EXAMPLES = messaging team livestream chat-root
EXAMPLES_APPS = $(addprefix $(EXAMPLES_PATH)/,$(EXAMPLES))
EXAMPLES_APPS_DEPS = $(addsuffix /node_modules/installed_dependencies,$(EXAMPLES_APPS))
EXAMPLES_APPS_INDEX = $(addsuffix /build/index.html,$(EXAMPLES_APPS))

SOURCES = $(filter(%$(EXAMPLES_PATH)/, $(wildcard *.js) $(wildcard */*.js) $(wildcard */*.scss) $(wildcard */*.png) $(wildcard */*.html) $(wildcard ../client/*/*.js) $(wildcard ../client/*.js))
LIB_SOURCES = $(wildcard *.js) $(wildcard */*.js) $(wildcard */*.scss) $(wildcard */*.png) $(wildcard */*.html) $(wildcard ../client/*/*.js) $(wildcard ../client/*.js)

CHAT_DEPS = ../client/package.json

$(EXAMPLES_APPS_DEPS): %/node_modules/installed_dependencies: %/yarn.lock %/package.json $(SOURCES) yarn.lock
	cd $* && yarn install
	touch $@

.SECONDEXPANSION:
$(EXAMPLES_APPS_INDEX): %/build/index.html: dist/built $(EXAMPLES_APPS_DEPS) %/package.json %/node_modules/installed_dependencies $$(wildcard %/*.js) $$(wildcard %/*/*.js) $$(wildcard %/public/*) $(SOURCES)
	export SKIP_PREFLIGHT_CHECK=true && cd $* && yarn build
	touch $@

node_modules/installed: ../client/yarn.lock
	touch node_modules/installed

../client/node_modules/installed: ../client/yarn.lock
	touch ../client/node_modules/installed

../client/yarn.lock: $(CHAT_DEPS)
	cd ../client && yarn install && yarn link
	yarn link stream-chat-client
	touch $@

yarn.lock: package.json
	yarn install
	touch $@

dist/built: $(LIB_SOURCES) yarn.lock
	yarn build
	touch $@ q

clean:
	cd ../client && yarn unlink && rm -rf node_modules
	yarn unlink stream-chat-client
	rm -rf build
	rm -rf node_modules

example-build: $(EXAMPLES_APPS_INDEX)
example-deps: yarn.lock $(EXAMPLES_APPS_DEPS)
