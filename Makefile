.PHONY: docker-build docker-build-prod docker-push-prod deploy-prod

docker-build:
	docker build -t npulidom/prerender --target=dev .

docker-build-prod:
	docker build -t npulidom/prerender:prod --target=prod .

docker-push:
	docker push npulidom/prerender

docker-push-prod:
	docker push npulidom/prerender:prod

deploy: docker-build docker-push

deploy-prod: docker-build-prod docker-push-prod
