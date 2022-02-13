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
  toFind = this.new(filter)
  toFind._runHooks('pre', 'find');

  // fetch data from external API
  console.log('invoking external API')
  let data = await externalapi.fetchTacos()
  if (data.length === 0) {
    return [];
  }

  let tacos = data.map(t => {
    let taco = this.new(t);
    taco._runHooks('post', 'find');
    return taco
  });

  return tacos;
}

Model.prototype.findOne = async function(filter) {
  toFind = this.new(filter)
  toFind._runHooks('pre', 'findOne');

  // fetch data from external API
  console.log('invoking external API')
  let data = await externalapi.fetchTacos(filter._id)
  if (data.length === 0) {
    return null;
  }

  let doc = this.new(data[0]);
  doc._runHooks('post', 'findOne');

  return doc;
}

function Document(model, data) {
  this._model = model
  this._mgDocument = new this._model._mgModel(data);
}

Document.prototype.save = function(cb) {
  this._runHooks('pre', 'save');

  // save data to external API
  console.log('invoking external API')
  return externalapi.createTaco(this._mgDocument.toObject())
    .then(data => {
      this._runHooks('post', 'save');
      if (cb) {
        cb(null, data);
        return
      }

      return Promise.resolve(data);
    })
}

// Runs hooks synchronously and sequentially. Probably not what we want.
Document.prototype._runHooks = function(phase, event) {
  const hooks = this._model._schema.hooks[phase][event];
  if (hooks) {
    hooks.forEach((hook, i) => {
      hook.call(this._mgDocument, () => {
        console.log(`invoked ${this._model.name} ${phase} ${event} hook #${i}`);
      });
    });
  }
}

module.exports = {
  Schema,
  model,
};
