module.exports = {
  "extends": "airbnb-base",
  "rules": {
    "no-console": 0,
    "no-underscore-dangle": ["error", { allow: ["_id"] }],
    "class-methods-use-this": 0,
    "import/extensions": 0,
    "no-bitwise": ["error", { "int32Hint": true }],
  }
};
