"use strict";

const padding = {
  "201": "",
  "301": " ",
  "302": "  "
};
const locationRegex = "https://.*|http://.*|/.*";
const responseDelimeter = "__lambdaexpress_delim__";

module.exports = {
  responseDelimeter: responseDelimeter,
  padding: padding,
  regex: {
    "404": "STATUS404" + responseDelimeter + ".*",
    "201": padding["201"] + locationRegex,
    "301": padding["301"] + locationRegex,
    "302": padding["302"] + locationRegex
  }
};
