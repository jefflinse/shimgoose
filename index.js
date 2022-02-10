const mongoose = require('mongoose');

// store original Query.exec function
const exec = mongoose.Query.prototype.exec

// reassign Query.exec function to fetch data from our API instead
mongoose.Query.prototype.exec = function(a,b) {
  console.log('intercepting query execution');
  console.log(this)

  if (this.op === 'findOne') {
    const content = {
      protein: 'black bean',
      spicy: true,
    };

    return Array.isArray(content)
          ? Promise.resolve(content.map(doc => new this.model(doc)))
          : Promise.resolve(new this.model(content))
  }

  return exec.apply(this, arguments);
}

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

  const Taco = mongoose.model('Taco', tacoSchema);

  const [plainVeggie, spicyChicken] = await populateData(Taco);

  // Taco.findById = function (id, projection, options) {
  //   return Taco.findOne({ _id: id });
  // };

  // Taco.findOne = function(filter, projection, options) {
  //   console.log('findOne() ' + filter._id);
  //   return new Taco({
  //     _id: filter._id,
  //     protein: 'black bean',
  //     spicy: true,
  //   })
  // }

  console.log('calling Taco.findOne()');
  let taco = await Taco.findOne({ _id: spicyChicken._id });
  console.log(taco);
}

async function populateData(t) {
    // Add some test data
    await t.deleteMany()

    const plainVeggie = new t({ protein: 'veggie', spicy: false });
    await plainVeggie.save();
    console.log(plainVeggie.style());
  
    const spicyChicken = new t({ protein: 'chicken', spicy: true });
    await spicyChicken.save();
    console.log(spicyChicken.style());

    return [plainVeggie, spicyChicken];
}