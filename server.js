var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.logger());
//app.use(express.favicon());
app.use(function(req, res){
  res.send('Not implemented');
});

app.listen(80);
console.log("server started at localhost......");