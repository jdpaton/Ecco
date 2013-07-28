.PHONY: test build client server all

build:
	npm install

test:
	npm test

server:
	./bin/ecco -le 3000

client:
	cat package.json | ./bin/ecco 3000

clean:
	@rm -rf ./node_modules

run: server

all: clean build test server
