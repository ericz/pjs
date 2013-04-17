default: compress docs

compress:
	@node bin/build.js;

docs:
  @node bin/docs.js;
  