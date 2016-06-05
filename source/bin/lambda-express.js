#!/usr/bin/env node

var program = require("commander");
var path = require("path");
var shell = require("shelljs");

program
  .command("deploy <srcFile>")
  .description("Create api gateway and deploy lambda functions")
  .action(function(srcFile) {
    srcFile = path.resolve(process.cwd(), path.normalize(srcFile));
    require("../").load(srcFile).build();
  });

program
  .command("init")
  .description("Initializes a new lambda-express project")
  .action(function() {
    console.log("Initializing project...")
    var samplePath = path.resolve(__dirname, "../../sample");
    var version =  require("../../package.json").version;
    shell.exec(`cp -r "${samplePath}/." "${process.cwd()}"`);
    shell.exec(`npm install lambda-express@${version} --save`, { silent: true });
    console.log("Project initialized.");
    console.log("Please specify the AWS Role ARN in the .env file");
    console.log("Run 'lambda-express deploy app.js' to deploy!");
  });

program.parse(process.argv);
