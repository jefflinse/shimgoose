const mongoose = require('mongoose');
const externalapi  = require('./externalapi');

function Schema(definition) {
  this._schema = new mongoose.Schema(definition);
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
  if (this.hooks.pre[event] === undefined) {
    this.hooks.pre[event] = [];
  }
  this.hooks.pre[event].push(callback);
}

function Model(name, schema) {
  this._model = mongoose.model(name, schema);
}

Model.prototype.findOne = async function(filter) {
  let data = await externalapi.fetchTacos(filter._id)
  if (data.length === 0) {
    return null;
  }

  let taco = data[0];
  taco._id = taco.mongo_id
  return await this._model.create(data);
}

Model.prototype.deleteMany = async function() {
  this._model.deleteMany(arguments)
}

module.exports = {
  Schema,
  Model,
};
