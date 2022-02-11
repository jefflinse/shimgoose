const mongoose = require('mongoose');
const shimgoose = require('./shimgoose');

main().catch(err => console.log(err));

async function main() {
  // connect to MongoDB
  await mongoose.connect('mongodb://root:example@localhost:27017/test', {
    authSource: 'admin'
  });
  
  // use shim schema to make sure hooks are intercepted and registered properly
  const tacoSchema = new shimgoose.Schema({
    protein: String,
    spicy: false,
  });

  // these pre/post hooks should continue to work as expected
  tacoSchema.pre('findOne', function(next) {
    console.log('pre findOne');
    next();
  });
  tacoSchema.post('findOne', function() {
    console.log('post findOne');
  });

  // create the model using the shim, passing the original Mongoose schema
  const Taco = new shimgoose.Model('Taco', tacoSchema._schema);

  // populate some test data in MongoDB
  // the shim methods can be bypassed by using the original underlying Mongoose model
  await populateData(Taco._model);

  let tacos = await Taco._model.find()
  console.log('Tacos in MongoDB:', tacos);

  // this findOne call will be intercepted and will return data from our API instead
  console.log('attempting to find a taco that only exists in the external API');
  try {
    let taco = await Taco.findOne({ _id: "62056e13d30a1cb15f585ce5" /* chorizo (external data) */ });
    console.log('Taco found:', taco);
  } catch (err) {
    console.log('shimmed findOne() failed:', err);
  }
}


// Populate MongoDB with some sample data
async function populateData(t) {
	// Add some test data
	await t.deleteMany()
	await new t({ protein: 'beef', spicy: false }).save()
	await new t({ protein: 'chicken', spicy: true }).save()
}