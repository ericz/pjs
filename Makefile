default: compress doc

compress:
	@node bin/build.js

doc:
	@node bin/docs.js