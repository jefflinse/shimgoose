const mongoose = require('mongoose');
const externalapi  = require('./externalapi');

// Schema wraps the Mongoose Schema type and keeps track of pre/post hooks manually.
function Schema(definition) {
  this._mgSchema = new mongoose.Schema(definition);
  this.hooks = {
    pre: {},
    post: {}
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
function model(name, schema) {
  return new Model(name, schema);
}

function Model(name, schema) {
  this.name = name
  this._schema = schema;
  this._mgModel = mongoose.model(this.name, this._schema._mgSchema);
}

Model.prototype.new = function(data) {
  return new Document(this, data);
}

Model.prototype.deleteMany = async function(filter) {
  return await this._mgModel.deleteMany(filter);
}

Model.prototype.find = async function(filter) {
  let query = this._mgModel.find(filter); // create a mongoose Query
  this._runQueryHooks(query, 'pre', 'find');

  // fetch data from external API
  console.log('invoking external API')
  let data = await externalapi.fetchTacos()
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
  let data = await externalapi.fetchTacos(filter._id)
  if (data.length === 0) {
    return null;
  }

  const doc = this.new(data[0]);

  this._runQueryHooks(query, 'post', 'findOne');

  return doc;
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

function Document(model, data) {
  this._model = model
  this._mgDocument = new this._model._mgModel(data);
}

Document.prototype.save = function(cb) {
  this._runDocumentHooks('pre', 'save');

  // save data to external API
  console.log('invoking external API')
  return externalapi.createTaco(this._mgDocument.toObject())
    .then(data => {
      this._runDocumentHooks('post', 'save');
      if (cb) {
        cb(null, data);
        return
      }

      return Promise.resolve(data);
    })
}

// Runs hooks synchronously and sequentially. Probably not what we want.
Document.prototype._runDocumentHooks = function(phase, event) {
  const hooks = this._model._schema.hooks[phase][event];
  if (hooks) {
    for (let i = 0; i < hooks.length; i++) {
      const nextFn = () => console.log(`invoked ${this._model.name} ${phase} ${event} hook #${i}`);
      hooks[i].call(this._mgDocument, nextFn.bind(this._mgDocument));
    }
  }
}

module.exports = {
  Schema,
  model,
};
