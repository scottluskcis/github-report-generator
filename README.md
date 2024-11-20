# ts-node-project-setup

Foundation for setting up a Typescript project that has support for linting, testing, and debugging. This is a simple example, feel free to fork or even add pull requests to this project to share with others.

I typically use [pnpm](https://pnpm.io/) as a Package Manager but everything will work with `npm` as well. Anywhere you see reference to `pnpm` and some command it just means it is using `pnpm`. Examples of both `pnpm` and `npm` are provided.

## Setup

1. Install your IDE of choice, such as [Visual Studio Code](https://code.visualstudio.com/)
2. Clone [this repository](https://github.com/scottluskcis/ts-node-project-setup.git) locally
3. Run `pnpm install` or `npm install`
4. Run `pnpm dev` or `npm run dev` to run the simple example

## Build

Run `pnpm build` or `npm run build` to generate the `dist` folder with files for build

## Tests

A simple test is provided here and is setup using [Jest](https://jestjs.io/). You can run the test either running `pnpm test` or `npm run test`.

## Linting

Linting is configured for the project, run `pnpm lint` or `npm run lint`

## Debugging

A sample launch configuration has been added to use if you are using Visual Studio Code [here](.vscode/launch.json). Use VS Code Run and Debug and launch the dev configuration. Note that the launch is setup to use `pnpm` currently but you can alter this by modifying the following values to work with npm

```json
"runtimeArgs": ["run", "dev"],
"runtimeExecutable": "npm",
```
