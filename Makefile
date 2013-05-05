default: compress doc demo

compress:
	@node bin/build.js

doc:
	@node bin/docs.js

demo:
	cp dist/p.js demo/nez/js/p.js
	cp static/render.html demo/nez/render.html

.PHONY: demo
.PHONY: doc
.PHONY: compress