module.exports = function(app) {
  app.name("myapp");
  app.get("/widgets", "./index_widgets");
}