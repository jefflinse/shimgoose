const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect('mongodb://root:example@localhost:27017/test', {
    authSource: 'admin'
  });
  
  const tacoSchema = new mongoose.Schema({
    protein: String,
    spicy: false,
  });

  tacoSchema.methods.style = function () {
    return this._id + ': ' + (this.spicy ? 'spicy' : 'plain') + ' ' + this.protein + ' taco';
  };

  tacoSchema.pre('findOne', function () {
    console.log('findOne() ' + this.getFilter()._id);
  });

  const Taco = mongoose.model('Taco', tacoSchema);

  // Add some test data
  await Taco.deleteMany()

  const plainVeggie = new Taco({ protein: 'veggie', spicy: false });
  await plainVeggie.save();
  console.log(plainVeggie.style());

  const spicyChicken = new Taco({ protein: 'chicken', spicy: true });
  await spicyChicken.save();
  console.log(spicyChicken.style());

  // Queries
  // let tacos = await Taco.find();
  // console.log(tacos);

  console.log('finding one...');
  tacos = await Taco.findOne({ _id: spicyChicken._id });
  console.log(tacos);

  console.log('finding by id...');
  tacos = await Taco.findById(spicyChicken._id);
  console.log(tacos);
}
