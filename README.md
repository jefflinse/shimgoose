# shimgoose

A proof of concept for intercepting MongoDB queries and document changes.

## Quickstart

    git clone https://github.com/jefflinse/shimgoose

    cd shimgoose

    nvm use v14.17.0

    npm install

    docker compose up --detach

    node index.js

You should be rewarded with the following output:

    Query.exec(deleteMany) called
    Query.exec(find) called
    Tacos in MongoDB: [
      {
        _id: new ObjectId("62057d8705da050ba3a42ba4"),
        protein: 'beef',
        spicy: false,
        __v: 0
      },
      {
        _id: new ObjectId("62057d8705da050ba3a42ba6"),
        protein: 'chicken',
        spicy: true,
        __v: 0
      }
    ]
    attempting to find a taco that only exists in the external API
    Query.exec(findOne) called
    intercepting 'findOne' query execution, fetching from external API instead
    Taco found: {
      protein: 'chorizo',
      spicy: true,
      _id: new ObjectId("62056e13d30a1cb15f585ce5")
    }

## Details

The shim works by overriding Mongoose's `Query.exec()` method to fetch and return data from a different data source instead of performing an actual MongoDB query.
