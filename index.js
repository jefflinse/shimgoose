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

  // create the shim model using the shim schema
  const Taco = shimgoose.model('Taco', tacoSchema);

  // populate some test data in MongoDB
  // the shim methods can be bypassed by using _mg, the original underlying Mongoose model
  await Taco.deleteMany()
  await Taco.new({ protein: 'beef', spicy: false })._mgDocument.save()
  await Taco.new({ protein: 'chicken', spicy: true })._mgDocument.save()
  console.log('Tacos in MongoDB:', await Taco.find());

  // this findOne call will bypass Mongoose entirely and fetch from our API instead
  console.log('attempting to find a taco');
  try {
    let taco = await Taco.findOne({ _id: "62056e13d30a1cb15f585ce5" /* chorizo (external data) */ });
    console.log('Taco found:', taco._mgDocument);
  } catch (err) {
    console.log('shimmed findOne() failed:', err);
  }

  console.log('attempting to create a taco');
  try {
    let taco = await Taco.new({ protein: 'alligator', spicy: false }).save();
    console.log('Taco created:', taco);
  } catch (err) {
    console.log('shimmed save() failed:', err);
  }

  console.log('Tacos in MongoDB:', await Taco._mgModel.find());
  console.log('Tacos in External:', await Taco.find());
}
