const mongoose = require('mongoose');
const shimgoose = require('./shimgoose');
const externalapi  = require('./externalapi');

main().catch(err => console.log(err));

async function main() {
  // connect to MongoDB
  await mongoose.connect('mongodb://root:example@localhost:27017/test', {
    authSource: 'admin'
  });
  
  // use shim schema to make sure hooks are intercepted and registered properly
  const tacoSchema = new shimgoose.Schema({
    protein: String,
    spicy: Boolean,
  });

  // these pre/post hooks should continue to work as expected, with caveats
  tacoSchema.pre('findOne', function(next) {
    console.log('pre findOne 1');
    next();
  });
  tacoSchema.pre('findOne', function(next) {
    console.log('pre findOne 2');
    next();
  });
  tacoSchema.post('findOne', function(next) {
    console.log('post findOne 1');
    next()
  });
  tacoSchema.post('findOne', function(next) {
    console.log('post findOne 2');
    next()
  });
  tacoSchema.pre('save', function(next) {
    console.log('pre save 1');
    next();
  });
  tacoSchema.pre('save', function(next) {
    console.log('pre save 2');
    next();
  });
  tacoSchema.post('save', function(next) {
    console.log('post save 1');
    next()
  });
  tacoSchema.post('save', function(next) {
    console.log('post save 2');
    next()
  });
  tacoSchema.post('deleteOne', function(next) {
    console.log('post deleteOne 1');
    next()
  });
  tacoSchema.post('deleteOne', function(next) {
    console.log('post deleteOne 2');
    next()
  });

  // create the shim model using the shim schema
  const Taco = shimgoose.model('Taco', tacoSchema, {
    fetch: externalapi.fetchTacos,
    save: externalapi.saveTaco,
    delete: externalapi.deleteTaco,
  });

  // this find() call will bypass Mongoose and fetch using our API instead
  console.log('attempting to find all tacos');
  try {
    let tacos = await Taco.find();
    console.log('Tacos found:', tacos);
  } catch (err) {
    console.log('shimmed Model.find() failed:', err);
  }

  // this findOne() call will bypass Mongoose and fetch using our API instead
  console.log('attempting to find a taco');
  try {
    let taco = await Taco.findOne({ _id: "62056e13d30a1cb15f585ce6" /* chorizo (external data) */ });
    console.log('Taco found:', taco);
    console.log('doc is instanceof mongoose.Model?', taco instanceof mongoose.Model);
    console.log('doc is instanceof mongoose.Document?', taco instanceof mongoose.Document);
  } catch (err) {
    console.log('shimmed Model.findOne() failed:', err);
  }

  // this save() call will bypass Mongoose and save using our API instead
  console.log('attempting to create a taco (save() returning a promise)');
  try {
    let taco = await Taco.new({ protein: 'alligator', spicy: false }).save();
    console.log('Taco created:', taco);
    console.log('doc is instanceof mongoose.Model?', taco instanceof mongoose.Model);
    console.log('doc is instanceof mongoose.Document?', taco instanceof mongoose.Document);
  } catch (err) {
    console.log('shimmed Document.save() failed:', err);
  }

  // can also use save() with a callback instead of returning a promise
  console.log('attempting to create a taco (save() invoking a callback)');
  Taco.new({protein: 'black bean', spicy: true}).save((err, taco) => {
    if (err) {
      console.log('shimmed Document.save() failed:', err);
    } else {
      console.log('Taco created:', taco);
      console.log('doc is instanceof mongoose.Model?', taco instanceof mongoose.Model);
      console.log('doc is instanceof mongoose.Document?', taco instanceof mongoose.Document);
    }
  })

  // this find() call will bypass Mongoose and fetch using our API instead
  console.log('attempting to find all tacos');
  try {
    let tacos = await Taco.find();
    console.log('Tacos found:', tacos);
  } catch (err) {
    console.log('shimmed Model.find() failed:', err);
  }

  // this deleteOne() call will bypass Mongoose and fetch using our API instead
  console.log('attempting to delete a taco');
  try {
    let result = await Taco.deleteOne({ _id: "62056e13d30a1cb15f585ce6" /* chorizo (external data) */ });
    console.log(result.deletedCount, 'Taco deleted');
  } catch (err) {
    console.log('shimmed Model.deleteOne() failed:', err);
  }

  // this find() call will bypass Mongoose and fetch using our API instead
  console.log('attempting to find all tacos');
  try {
    let tacos = await Taco.find();
    console.log('Tacos found:', tacos);
  } catch (err) {
    console.log('shimmed Model.find() failed:', err);
  }
}
