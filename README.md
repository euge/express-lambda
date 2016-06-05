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
