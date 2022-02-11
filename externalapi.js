// Some "external" data residing in a 3rd party API
const externalTacoData = {
  "62056e13d30a1cb15f585ce4": [{ mongo_id: "62056e13d30a1cb15f585ce4", protein: "fish", spicy: false }],
  "62056e13d30a1cb15f585ce5": [{ mongo_id: "62056e13d30a1cb15f585ce5", protein: "chorizo", spicy: true }],
  "62056e13d30a1cb15f585ce6": [{ mongo_id: "62056e13d30a1cb15f585ce6", protein: "carne asada", spicy: false }],
  "62056e13d30a1cb15f585ce7": [{ mongo_id: "62056e13d30a1cb15f585ce7", protein: "tofu", spicy: false }],
  "62056e13d30a1cb15f585ce8": [{ mongo_id: "62056e13d30a1cb15f585ce8", protein: "black bean", spicy: true }],
};

// Simulate an external API call that returns a Taco by its Mongo ID.
async function fetchTacos(mongo_id) {
  return externalTacoData[mongo_id]
}

module.exports = {
  fetchTacos,
};
