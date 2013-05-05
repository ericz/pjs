default: compress doc demo

compress:
	@node bin/build.js

doc:
	@node bin/docs.js

demo:
	cp dist/p.js demo/nez/js/p.js

.PHONY: demo
.PHONY: doc
.PHONY: compress