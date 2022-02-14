// Some "external" data residing in a 3rd party API
const externalTacoData = {
  "62056e13d30a1cb15f585ce4": [{ mongo_id: "62056e13d30a1cb15f585ce4", protein: "chicken", spicy: false }],
  "62056e13d30a1cb15f585ce5": [{ mongo_id: "62056e13d30a1cb15f585ce5", protein: "beef", spicy: true }],
  "62056e13d30a1cb15f585ce6": [{ mongo_id: "62056e13d30a1cb15f585ce6", protein: "chorizo", spicy: false }],
};

// Simulate an external API call that creates a Taco.
async function createTaco(taco) {
  taco.mongo_id = taco._id
  taco._id = undefined
  externalTacoData[taco.mongo_id] = [taco]
  return taco
}

// Simulate an external API call that returns a Taco by its Mongo ID.
async function fetchTacos(mongo_id) {
  if (mongo_id) {
    return externalTacoData[mongo_id]
  }

  return Object.values(externalTacoData).reduce((acc, tacos) => acc.concat(tacos), [])
}

module.exports = {
  createTaco,
  fetchTacos,
};
