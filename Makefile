export

.PHONY: dev-build dev-start clean

DEV_DC = docker-compose -p casperselfie -f docker/docker-compose.dev.yml --env-file ./.env
PROD_DC = docker-compose -f docker/docker-compose.prod.yml --env-file ./.env

dev-build:
	$(DEV_DC) build

dev-start:
	$(DEV_DC) up

prod-build:
	$(PROD_DC) build

prod-start:
	$(PROD_DC) up

clean:
	$(PROD_DC) stop
	$(DEV_DC) stop

