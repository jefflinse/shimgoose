const mongoose = require('mongoose');

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

// store the original Query.exec function so we can forward any non-intercepted calls to MongoDB
const exec = mongoose.Query.prototype.exec

// redefine the Query.exec function to fetch data from our API in some cases,
// and to call the original exec function otherwise
mongoose.Query.prototype.exec = async function() {
  return new Promise( async (resolve,reject)  => {
    console.log(`Query.exec(${this.op}) called`);

    if (this.op === 'findOne') {
      console.log(`intercepting '${this.op}' query execution, fetching from external API instead`);
      let tacos = [];
      try {
        tacos = await fetchTacosFromExternalAPI(this.getQuery()._id)
        if (tacos.length > 0) {
          tacos = tacos.map(taco => {
            taco._id = taco.mongo_id
            resolve(taco)
          });
          tacos = await tacos.map(taco => new this.model(taco))
        }
      } catch (e) {
        console.log('error fetching tacos from external API', e);
      }

      resolve(tacos[0] || null);
    }

    // non-intercepted queries will be forwarded to MongoDB
    resolve(exec.apply(this, arguments));
  });
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

  const burritoSchema = new mongoose.Schema( {
    protein: String,
    spicy: false,
  });

  console.log('before hooks');

  // pre/post hooks should continue to work as expected
  tacoSchema.pre('findOne', function(next) {
    console.log('pre findOne');
    next();
  });
  tacoSchema.post('findOne', function() {
    console.log('post findOne');
  });


  // create the model
  const Taco = mongoose.model('Taco', tacoSchema);

  // populate some test data in MongoDB
  await populateData(Taco);

  let tacos = await Taco.find()
  console.log('Tacos in MongoDB:', tacos);

  // this findOne call will be intercepted and will return data from our API instead
  console.log('attempting to find a taco that only exists in the external API');
  let taco = await Taco.findOne({ _id: "62056e13d30a1cb15f585ce5" /* chorizo (external data) */ })
      .populate('burritoSchema')
      .lean()
      .exec(testFunction());
  console.log('Taco found:', taco);
}

function testFunction() {
  console.log('testFunction 1234');
}
