const mongoose = require('mongoose');

// Schema wraps the Mongoose Schema type and keeps track of pre/post hooks manually.
function Schema(definition) {
  this.hooks = {
    pre: {},
    post: {}
  }
  if(definition instanceof mongoose.Schema) {
    var schema = this;

    this._mgSchema = definition;
    definition.s.hooks._pres.forEach((values, key) => {
      values.forEach(_pre => schema.pre(key, _pre.fn));
    });
    definition.s.hooks._posts.forEach((values, key) => {
      values.forEach(_post => schema.post(key, _post.fn));
    });
  } else {
    this._mgSchema = new mongoose.Schema(definition);
  }
}

// Adds a pre-hook to the schema.
// event: string ('findOne', 'save', etc.)
// callback: function(next)
Schema.prototype.pre = function(event, callback) {
if (this.hooks.pre[event] === undefined) {
  this.hooks.pre[event] = [];
}
  this.hooks.pre[event].push(callback);
}

// Adds a post-hook to the schema.
// event: string ('findOne', 'save', etc.)
// callback: function(next)
Schema.prototype.post = function(event, callback) {
  if (this.hooks.post[event] === undefined) {
    this.hooks.post[event] = [];
  }
  this.hooks.post[event].push(callback);
}

// model returns a Document constructor
function model(name, schema, shimFunctions) {
  return new Model(name, schema, shimFunctions);
}

function Model(name, schema, shimFunctions) {
  this.name = name
  this._schema = schema;
  this._mgModel = mongoose.model(this.name, this._schema._mgSchema);

  this._shimFunctions = shimFunctions || {};
}

Model.prototype.new = function(data) {
  let doc = new this._mgModel(data);
  if (data.mongo_id) {
    doc._id = data.mongo_id;
  }

  doc._model = this;
  doc._runDocumentHooks = _runDocumentHooks.bind(doc)
  doc.save = createSaveDocumentShim(this._shimFunctions.save).bind(doc);
  return doc;
}

Model.prototype.deleteMany = async function(filter) {
  return await this._mgModel.deleteMany(filter);
}

Model.prototype.find = async function(filter) {
  let query = this._mgModel.find(filter); // create a mongoose Query
  this._runQueryHooks(query, 'pre', 'find');

  // fetch data from external API
  console.log('invoking external API')
  let data = await this._shimFunctions.fetch(filter)
  if (data.length === 0) {
    return [];
  }

  const tacos = data.map(t => this.new(t));

  this._runQueryHooks(query, 'post', 'find');

  return tacos;
}

Model.prototype.findOne = async function(filter) {
  let query = this._mgModel.findOne(filter); // create a mongoose Query
  this._runQueryHooks(query, 'pre', 'findOne');

  // fetch data from external API
  console.log('invoking external API')
  let data = await this._shimFunctions.fetch(filter._id)
  if (data.length === 0) {
    return null;
  }

  const doc = this.new(data[0]);

  this._runQueryHooks(query, 'post', 'findOne');

  return doc;
}

Model.prototype.deleteOne = async function (filter) {
  let query = this._mgModel.deleteOne(filter); // create a mongoose Query
  this._runQueryHooks(query, 'pre', 'deleteOne');

  // delete data using external API
  console.log('invoking external API')
  try {
    await this._shimFunctions.delete(filter)
    this._runQueryHooks(query, 'post', 'deleteOne');
    return {
      deletedCount: 1,
    }
  } catch (e) {
    return {
      deletedCount: 0,
    }
  }
}

Model.prototype._runQueryHooks = function(query, phase, event) {
  console.log(`running ${this.name} ${phase} ${event} hooks`);

  const hooks = this._schema.hooks[phase][event];
  if (hooks) {
    for (let i = 0; i < hooks.length; i++) {
      const nextFn = () => console.log(`invoked ${this.name} ${phase} ${event} hook #${i}`);
      hooks[i].call(query, nextFn.bind(query));
    }
  }
}

function createSaveDocumentShim(saveEntityFn) {
  return function save(cb) {
    this._runDocumentHooks('pre', 'save');

    // save data to external API
    console.log('invoking external API')
    let result = saveEntityFn(this.toObject())
      .then(data => {
        this._runDocumentHooks('post', 'save');
        if (data)  {
          return this._model.new(data);
        } else {
          return null;
        }
      })

    if (cb) {
      result.then(data => cb(null, data));
      return;
    }

    return result;
  }
}

// Runs hooks synchronously and sequentially. Probably not what we want.
function _runDocumentHooks (phase, event) {
  const hooks = this._model._schema.hooks[phase][event];
  if (hooks) {
    for (let i = 0; i < hooks.length; i++) {
      const nextFn = () => console.log(`invoked ${this._model.name} ${phase} ${event} hook #${i}`);
      hooks[i].call(this, nextFn.bind(this));
    }
  }
}

module.exports = {
  Schema,
  model,
};
