#!/bin/bash
npm install
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
