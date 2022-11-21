#!/bin/sh

npm rebuild esbuild
npm run build

exec "$@"