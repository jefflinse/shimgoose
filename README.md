# shimgoose

A proof of concept for intercepting MongoDB queries and document changes.

## Quickstart

    git clone https://github.com/jefflinse/shimgoose

    cd shimgoose

    nvm use v14.17.0

    npm install

    docker compose up --detach

    node index.js

## Details

The shim works by overriding Mongoose's `Query.exec()` method to fetch and return data from a different data source instead of performing an actual MongoDB query.
