const util = require("util");
const debug = require("debug");

// ensure we are logging basic info
debug.enable("lambda-express:info");
debug.enable("lambda-express:error");

const make = name => debug("lambda-express:" + name);

module.exports = {
  make,
  info: make("info"),
  error: make("error")
};
