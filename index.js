const mongoose = require('mongoose');

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

// store original Query.exec function
const exec = mongoose.Query.prototype.exec

// redefine Query.exec function to fetch data from our API in some cases,
// and to call the original exec function otherwise
mongoose.Query.prototype.exec = async function(a,b) {
  
  if (this.op === 'findOne') {
    console.log(`intercepting '${this.op}' query execution, fetching from external API instead`);
    let tacos = [];
    try {
      tacos = await fetchTacosFromExternalAPI(this.getQuery()._id)
      if (tacos.length > 0) {
        tacos = tacos.map(taco => {
          taco._id = taco.mongo_id
          return taco
        });
        tacos = tacos.map(taco => new this.model(taco))
      }
    } catch (e) {
      console.log('error fetching tacos from external API', e);
    }
    
    return tacos
  }

  console.log('calling original exec()');
  return exec.apply(this, arguments);
}

main().catch(err => console.log(err));

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

  tacoSchema.methods.style = function () {
    return this._id + ': ' + (this.spicy ? 'spicy' : 'plain') + ' ' + this.protein + ' taco';
  };

  const Taco = mongoose.model('Taco', tacoSchema);

  const [plainBeef, spicyChicken] = await populateData(Taco);

  console.log('attempting to find a taco that only exists in the external API');
  let taco = await Taco.findOne({ _id: "62056e13d30a1cb15f585ce5" /* chorizo (external data) */ });
  console.log(taco);
}

async function populateData(t) {
    // Add some test data
    await t.deleteMany()

    const plainBeef = new t({ protein: 'beef', spicy: false });
    await plainBeef.save();
  
    const spicyChicken = new t({ protein: 'chicken', spicy: true });
    await spicyChicken.save();

    return [plainBeef, spicyChicken];
}


