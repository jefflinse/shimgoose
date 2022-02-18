// Some "external" data residing in a 3rd party API
const externalTacoData = {
  "62056e13d30a1cb15f585ce4": { mongo_id: "62056e13d30a1cb15f585ce4", protein: "chicken", spicy: false },
  "62056e13d30a1cb15f585ce5": { mongo_id: "62056e13d30a1cb15f585ce5", protein: "beef", spicy: true },
  "62056e13d30a1cb15f585ce6": { mongo_id: "62056e13d30a1cb15f585ce6", protein: "chorizo", spicy: false },
};

// Simulate an external API call that creates a Taco.
async function createTaco(taco) {
  console.log("external createTaco() API called");
  taco.mongo_id = taco._id
  taco._id = undefined
  externalTacoData[taco.mongo_id] = taco
  return taco
}

// Simulate an external API call that updates a Taco.
async function updateTaco(taco) {
  console.log("external updateTaco() API called");
  taco.mongo_id = taco._id
  taco._id = undefined
  if (externalTacoData[taco.mongo_id] !== undefined) {
    externalTacoData[taco.mongo_id] = taco
  }
  return taco
}

// Simulate an external API call that returns a Taco by its Mongo ID.
async function getOneTaco(mongo_id) {
  console.log("external getOneTaco() API called");
  if (mongo_id) {
    taco = externalTacoData[mongo_id]
    taco._id = taco.mongo_id
    taco.mongo_id = undefined
    return externalTacoData[mongo_id]
  }

  return null
}

async function deleteTaco(mongo_id) {
  console.log("external deleteTaco() API called");
  delete externalTacoData[mongo_id]
  return {}
}

module.exports = {
  getOneTaco,
  createTaco,
  updateTaco,
  deleteTaco,
};
