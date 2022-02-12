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

  // create the shim model using the shim schema
  const Taco = new shimgoose.Model('Taco', tacoSchema);

  // populate some test data in MongoDB
  // the shim methods can be bypassed by using _mg, the original underlying Mongoose model
  await Taco._mg.deleteMany()
  await new Taco._mg({ protein: 'beef', spicy: false }).save()
  await new Taco._mg({ protein: 'chicken', spicy: true }).save()
  console.log('Tacos in MongoDB:', await Taco._mg.find());

  // this findOne call will bypass Mongoose entirely and fetch from our API instead
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
	
}
