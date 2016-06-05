# lambda-express
Make AWS lambda behave like an express app

This project is active development and is subject to...development.

## What is this?
AWS' API Gateway and Lambda are revolutionary building blocks for a serverless style architecture. 
Unfortunately, getting the API Gateway and Lambda to work together to handle web requests, such as a REST API speaking JSON is cumbersome, slow, and prone to error.
For years now developers building APIs in node have been able to rapidly develop their projects by using the express.js framework. Express is
simple, powerful, and allows for great flexibility.

This project attempts to hide the complexity of using the API Gateway and Lambda for REST APIs by providing an express.js style abstraction layer.
Develop like you would an express.js app, but run on AWS's Lambda platform without managing a single server.

## Installation
```
npm install lambda-express -g
```

## Usage
```
mkdir myapp
cd myapp
lambda-express init
```

## Configure
Set your environment variables in the .env file created. Make sure you specify the AWS_ROLE_ARN that you want the lambda functions to use. Currently only 1 role is supported per lambda-express project, but this will be configurable on a per lambda basis in the future.

Also, please be sure that your AWS credentials are correctly configured. See for more info: http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files

## Develop
Define the structure of your API in app.js, referencing individual handlers by name. Each handler will become its own lambda function hosted on AWS.

For example:

```
// app.js
module.exports = function(app) {
  app.name("myapp");
  
  app.get("/widgets", "./index_widgets.js");
  app.use("/foo", function(foos) {
    foos.post("/bars", "./create_bars.js");
  });
  app.delete("/widgets/{id}", "./delete_widgets.js");
};
```

```
// index_widgets.js
module.exports = function(req, res) {
  if (req.query.filter === "all") {
    res.json({
      widgets: ["here", "they", "are"]
    });
  } else if (req.query.filter === "some") {
    ...
  } else {
    res.status(404).send({
      error: "Invalid filter provided"
    });
  }
};
```

```
// create_bars.js
var mydb = require("mydb");
module.exports = function(req, res) {
  if (req.get("SOME-HEADER") === "xyz") {
    mydb.insert(req.body.widget);
    res.status(201).location("http://....");
  } else {
      res.status(404).send({
      error: "Missing SOME-HEADER"
    });
  }
};
```

```
// delete_bars.js
var mydb = require("mydb");
module.exports = function(req, res) {
  mydb.delete(req.params.id);
  res.redirect("http://...");
};
```

## Deploy
```
lambda-express deploy app.js
Deployed!
┌─────────┬──────────────────────────────────────────────────────────────────┬─────────────────────────────────┐
│ Methods │ Path                                                             │ Lambda                          │
├─────────┼──────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
│ GET     │ https://dlqz8q...us-east-1.amazonaws.com/production/widgets      │ index_widgets-7bd849-production │
├─────────┼──────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
│ DELETE  │ https://dlqz8q...us-east-1.amazonaws.com/production/widgets/{id} │ index_widgets-1a82a4-production │
├─────────┼──────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
│ POST    │ https://dlqz8q...us-east-1.amazonaws.com/production/foo/bars     │ index_widgets-16864a-production │
└─────────┴──────────────────────────────────────────────────────────────────┴─────────────────────────────────┘
``....

## More tweaking
If you wish to share a lambda function between multiple actions, you can simply define a single instance of it and use it like so.

Note that in the example below, you will need to inspect the path/method/etc in the "index_and_delete_widgets.js" handler file to determine if you are deleting or displaying all wedgets.
```
// app.js
module.exports = function(app) {
  app.name("myapp");
  
  // make lambda to be shared
  var indexAndDelete = app.makeLambda({
    src: "./index_and_delete_widgets.js"
  });
  
  app.get("/widgets", indexAndDelete);
  app.delete("/widgets/{id}", indexAndDelete);
};

```

## Limitations
* Right now, we only are supporting getting JSON requests in and JSON responses out. HTML output and form based inputs will be implemented soon.
* No support for dynamic response headers - due to how the API Gateway works, it is not possible to respond with arbitrary response headers. Response headers must be declared up front. - This is also not yet implemented.
* lambda-express will build from scratch a new API Gateway and associated lambda functions. It will not reuse existing ones. This will be done in the future.
* Not every response code is implemented right now. HTTP codes 200, 201, 301, 302, and 404 are the only ones supported.
* Limited configurability of lambda parameters. In the future, we plan on supporting configuration of timeout, memory, etc on a per lambda basis.
* The interface will look something like
```
var l = app.makeLambda({
  src: "./index_foos.js",
  memory: "128",
  role_arn: "..."
})
```

## Development plan
* Better error handling
* Support custom response headers
* Support HTML and form inputs
* Individually configurable lambda settings
* More HTTP codes


## More Docs coming soon!








