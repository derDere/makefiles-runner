APP := demo-app

.PHONY: install build start dev debug test test-unit test-e2e lint deploy logs seed docs stop clean

## Installs all dependencies.
install:
	@echo Installing the dependencies of $(APP)...

## Compiles the project.
build: install
	@echo Building $(APP)...

start: build ## Starts the application.
	@echo Starting $(APP)...

## Runs the app with hot reload
## and verbose logging.
dev: build
	@echo Starting the dev server of $(APP)...

debug: build ## Starts the app and waits for the debugger.
	@echo Waiting for the debugger...

## Runs the whole test suite.
test: test-unit test-e2e

test-unit: build ## Runs the unit tests.
	@echo Running the unit tests...

test-e2e: build ## Runs the end-to-end tests.
	@echo Running the end-to-end tests...

## Checks the code style.
lint:
	@echo Linting $(APP)...

## Deploys the build to production.
deploy: build test
	@echo Deploying $(APP)...

## Follows the service logs.
logs:
	@echo Following the logs of $(APP)...

## Fills the database with demo data.
seed:
	@echo Seeding the demo data...

## Generates the documentation.
docs:
	@echo Generating the documentation...

## Stops all running services.
stop:
	@echo Stopping $(APP)...

## Removes all build output.
clean:
	@echo Removing the build output...
