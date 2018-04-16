# bunsen-ui

## Getting Started.

To serve up a local copy or develop:
```
npm install -g polymer-cli@next
git clone https://github.com/bunsenbrowser/bunsen-ui
cd bunsen-ui
npm install
polymer serve --npm --module-resolution=node
```

To use a local gateway as opposed to the public gateway fallback, run the dat-gateway in bunsen
```
git clone https://github.com/bunsenbrowser/bunsen.git
cd bunsen/www/nodejs_project
npm install
node index.js
```

## Develop
See `src/bunsen-app/bunsen-app.js` for the whole thing! It's a Polymer 3 Web Component. To run and view the app:

```
polymer serve
```

polymer.json has some switches. They do the same as this:

```
polymer serve --npm --module-resolution=node

```

To create a build:

```
polymer build
```

websocket-stream@latest.js gets bundled into shared_bundle_1.js. It is generated using https://wzrd.in/standalone/websocket-stream@latest .
Other users have reported issues getting websocket-stream working with es6 imports. It is avaialble in Bunsen as the global websocketStream.

To publish the build, remember to cd to build/es6 and then run `dat share`.


