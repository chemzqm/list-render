dev:
	@open http://localhost:3000/example/example.html
	@gulp

doc:
	@ghp-import example -n -p

clean:
	rm -fr build components template.js

.PHONY: clean
