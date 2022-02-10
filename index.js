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
    return (this.spicy ? 'spicy' : 'plain') + ' ' + this.protein + ' taco';
  };

  tacoSchema.pre('find', function () {
    console.log('Pre-find middleware');
    console.log(this.getFilter());
  });

  const Taco = mongoose.model('Taco', tacoSchema);

  await Taco.deleteMany()

  const plainVeggie = new Taco({ protein: 'veggie', spicy: false });
  console.log(plainVeggie.style());
  const spicyChicken = new Taco({ protein: 'chicken', spicy: true });
  console.log(spicyChicken.style());

  await plainVeggie.save();
  await spicyChicken.save();
  
  let tacos = await Taco.find();
  console.log(tacos);

  tacos = await Taco.find({ protein: /^chi/ });
  console.log(tacos);
}
