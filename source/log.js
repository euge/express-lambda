const util = require("util");
const debug = require("debug");

// ensure we are logging basic info
debug.enable("express-lambda:info");
debug.enable("express-lambda:error");

const make = name => debug("express-lambda:" + name);

module.exports = {
  make,
  info: make("info"),
  error: make("error")
};
