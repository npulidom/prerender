.PHONY: deploy docker-build-dev

# Build ID
BUILD_ID=$(shell git log -1 --pretty=%h)

docker-build-dev:
	docker build -t npulidom/prerender:dev --build-arg BUILD_ID="$(BUILD_ID)" --target=dev .

docker-build-prod:
	docker build -t npulidom/prerender --build-arg BUILD_ID="$(BUILD_ID)" --target=prod .

docker-push:
	docker push npulidom/prerender

deploy: docker-build-prod docker-push
