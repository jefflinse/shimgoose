const mongoose = require('mongoose');
const externalapi  = require('./externalapi');

// Schema wraps the Mongoose Schema type and keeps track of pre/post hooks manually.
function Schema(definition) {
  this._mg = new mongoose.Schema(definition);
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

// Model wraps the Mongoose Model type and keeps a reference to its Schema.
function Model(name, schema) {
  this._schema = schema
  this._mg = mongoose.model(name, this._schema._mg);
}

Model.prototype.findOne = async function(filter) {

  // run pre-hooks
  runHooks(this, 'pre', 'findOne');

  // fetch data from external API
  console.log('invoking external API')
  let data = await externalapi.fetchTacos(filter._id)
  if (data.length === 0) {
    return null;
  }

  // assign ID and create model
  let taco = data[0];
  taco._id = taco.mongo_id
  let t = await this._mg.create(data);

  // run post-hooks
  runHooks(this, 'post', 'findOne');

  return t;
}

// Runs hooks synchronously and sequentially. Probably not what we want.
function runHooks(model, phase, event) {
  const hooks = model._schema.hooks[phase][event];
  if (hooks) {
    hooks.forEach((hook, i) => {
      hook.call(model._mg, () => {
        console.log(`invoked ${model._mg.modelName} ${phase} ${event} hook #${i}`);
      });
    });
  }
}

module.exports = {
  Schema,
  Model,
};
