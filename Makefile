develop:
	npx webpack serve

install:
	npm ci

build:
	NODE_ENV=production npx webpack

test:
	npm test

lint:
	npx eslint .

# Linting with fix option
fix: 
	npx eslint . --fix

# Make build for Windows
winbuild:
	set NODE_ENV=production && npx eslint . --fix && npx webpack
