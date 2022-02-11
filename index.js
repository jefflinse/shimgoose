const mongoose = require('mongoose');
const applyHooks  = require('mongoose/lib/helpers/model/applyHooks');
const promiseOrCallback  = require('mongoose/lib/helpers/promiseOrCallback');

// Some "external" data residing in a 3rd party API
const externalTacoData = {
  "62056e13d30a1cb15f585ce4": [{ mongo_id: "62056e13d30a1cb15f585ce4", protein: "fish", spicy: false }],
  "62056e13d30a1cb15f585ce5": [{ mongo_id: "62056e13d30a1cb15f585ce5", protein: "chorizo", spicy: true }],
  "62056e13d30a1cb15f585ce6": [{ mongo_id: "62056e13d30a1cb15f585ce6", protein: "carne asada", spicy: false }],
  "62056e13d30a1cb15f585ce7": [{ mongo_id: "62056e13d30a1cb15f585ce7", protein: "tofu", spicy: false }],
  "62056e13d30a1cb15f585ce8": [{ mongo_id: "62056e13d30a1cb15f585ce8", protein: "black bean", spicy: true }],
};

// Simulate an external API call that returns tacos.
async function fetchTacosFromExternalAPI(mongo_id) {
  return externalTacoData[mongo_id]
}

// redefine the Query.exec function to fetch data from our API in some cases,
// and to execute the original query otherwise

mongoose.Query.prototype.exec = function exec(op, callback) {
  console.log(`Query.exec(${this.op}) called`);

  const _this = this;
  // Ensure that `exec()` is the first thing that shows up in
  // the stack when cast errors happen.
  const castError = new mongoose.Error.CastError();

  if (typeof op === 'function') {
    callback = op;
    op = null;
  } else if (typeof op === 'string') {
    this.op = op;
  }

  if (this.op == null) {
    throw new Error('Query must have `op` before executing');
  }
  this._validateOp();

  callback = this.model.$handleCallbackError(callback);

  return promiseOrCallback(callback, (cb) => {
    cb = this.model.$wrapCallback(cb);

    if (!_this.op) {
      cb();
      return;
    }

    this._hooks.execPre('exec', this, [], (error) => {
      if (error != null) {
        return cb(_cleanCastErrorStack(castError, error));
      }
      let thunk = '_' + this.op;
      if (this.op === 'update') {
        thunk = '_execUpdate';
      } else if (this.op === 'distinct') {
        thunk = '__distinct';
      }

      // intercept 'findOne' queries and return data from our API instead
      if (this.op === 'findOne') {
        console.log(`intercepting '${this.op}' query execution, fetching from external API instead`);
        let tacos = [];

        // DIRTY WAY
        // execute the underlying MongoDB thunk and discard the result
        this[thunk].call(this, (error, res) => {})
        // DIRTY WAY

        fetchTacosFromExternalAPI(this.getQuery()._id)
          .then(tacos => {
            if (tacos.length > 0) {
              tacos = tacos.map(taco => {
                taco._id = taco.mongo_id;
                return taco;
              });
              tacos = tacos.map(taco => new this.model(taco));
            }
            cb(null, tacos[0] || null);
          })
          .catch(err => {
            console.log('error fetching tacos from external API', e);
            return cb(_cleanCastErrorStack(castError, err));
          })
      } else {
        // execute the MongoDB query
        this[thunk].call(this, (error, res) => {
          if (error) {
            return cb(_cleanCastErrorStack(castError, error));
          }

          this._hooks.execPost('exec', this, [], {}, (error) => {
            if (error) {
              return cb(_cleanCastErrorStack(castError, error));
            }

            cb(null, res);
          });
        });
      }
    });
  }, this.model.events);
};

function _cleanCastErrorStack(castError, error) {
  if (error instanceof mongoose.Error.CastError) {
    castError.copy(error);
    return castError;
  }

  return error;
}

// Populate MongoDB with some sample data
async function populateData(t) {
    // Add some test data
    await t.deleteMany()
    await new t({ protein: 'beef', spicy: false }).save()
    await new t({ protein: 'chicken', spicy: true }).save()
}

main().catch(err => console.log(err));



// --- MAIN ---------------------------------------------------------------------

async function main() {
  // connect to MongoDB
  await mongoose.connect('mongodb://root:example@localhost:27017/test', {
    authSource: 'admin'
  });
  
  // create the schema
  const tacoSchema = new mongoose.Schema({
    protein: String,
    spicy: false,
  });

  // pre/post hooks should continue to work as expected
  tacoSchema.pre('findOne', function() {
    console.log('PRE findOne');
  });
  tacoSchema.post('findOne', function() {
    console.log('POST findOne');
  });


  // create the model
  const Taco = mongoose.model('Taco', tacoSchema);

  // populate some test data in MongoDB
  await populateData(Taco);

  let tacos = await Taco.find()
  console.log('Tacos in MongoDB:', tacos);

  // this findOne call will be intercepted and will return data from our API instead
  console.log('attempting to find a taco that only exists in the external API');
  let taco = await Taco.findOne({ _id: "62056e13d30a1cb15f585ce5" /* chorizo (external data) */ });
  console.log('Taco found:', taco);
}