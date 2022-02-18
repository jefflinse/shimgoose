// Instead of importing mongoose directly, import it via the shim.
const { mongoose, registerModelShims } = require('./shim/mongoose');

// A fake external "Tacos" API just for demonstration purposes.
const externalapi  = require('./externalapi');

// Register CRUD functions for the model.
registerModelShims('Taco', {
  'getOne': function(id) {
    return externalapi.getOneTaco(id);
  },
  'create': function(obj) {
    return externalapi.createTaco(obj);
  },
  'update': function(obj) {
    return externalapi.updateTaco(obj);
  },
  'delete': function(id) {
    return externalapi.deleteTaco(id);
  },
});

main().catch(err => console.log(err));

async function main() {

  // Note that we do not need to connect to the database here.
  // No actual MongoDB operations are involved.

  // create the schema as usual
  const tacoSchema = new mongoose.Schema({
    protein: String,
    spicy: Boolean,
  });

  // these pre/post hooks should continue to work as expected
  tacoSchema.pre('findOne', function(next) {
    console.log('pre findOne 1');
    next();
  });
  tacoSchema.post('findOne', function(doc, next) {
    console.log('post findOne 1');
    next()
  });
  tacoSchema.pre('save', function(next) {
    console.log('pre save 1');
    next();
  });
  tacoSchema.post('save', function(doc, next) {
    console.log('post save 1');
    next()
  });
  tacoSchema.pre('deleteOne', function(next) {
    console.log('post deleteOne 1');
    next()
  });
  tacoSchema.post('deleteOne', function(doc, next) {
    console.log('post deleteOne 1');
    next()
  });
  tacoSchema.pre('remove', function(next) {
    console.log('pre remove 1');
    next()
  });
  tacoSchema.post('remove', function(doc, next) {
    console.log('post remove 1');
    next()
  });

  // create the model as usual
  const Taco = mongoose.model('Taco', tacoSchema);

  let taco;

  // this findOne() call will bypass Mongoose and fetch using our API instead
  console.log('attempting to find a taco');
  try {
    taco = await Taco.findOne({ _id: "62056e13d30a1cb15f585ce6" /* chorizo (external data) */ });
    console.log('Taco found:', taco);
  } catch (err) {
    console.log('shimmed Model.findOne() failed:', err);
  }

  // this save() call will bypass Mongoose and save using our API instead
  console.log('attempting to create a taco');
  try {
    taco = await new Taco({ protein: 'alligator', spicy: false }).save();
    console.log('Taco created:', taco);
  } catch (err) {
    console.log('shimmed Document.save() failed:', err);
  }

  // this save() call will bypass Mongoose and save using our API instead
  console.log('attempting to update a taco');
  try {
    taco.spicy = true;
    await taco.save();
    console.log('Taco updated:', taco);
  } catch (err) {
    console.log('shimmed Document.save() failed:', err);
  }

  // this deleteOne() call will bypass Mongoose and delete using our API instead
  console.log('attempting to delete a taco');
  try {
    await taco.delete();
    console.log('Taco deleted');
  } catch (err) {
    console.log('shimmed Query.remove() failed:', err);
  }
}
