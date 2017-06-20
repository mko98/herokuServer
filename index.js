var express = require('express');
var bodyParser = require('body-parser')
var logger = require('morgan');
var config = require('./config.json');

// applicatie aanmaken
var app = express();
app.use(bodyParser.urlencoded({ 'extended':'true'}))
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));


app.all('*', function(request, response, next){
    console.log(request.method + " " + request.url);
    next();
})

app.use('/api/v1', require('./routes/routes_api_v1'));


app.set('PORT', config.webPort);

app.get('/info', function(request, response) {
    response.send('Server tentamen Programmeren 4');
})

app.get('/about', function(request, response) {
    response.send('Door: Max koning en Cas de Pender');
})

app.all('*', function(request, response) {
    response.status(404);
    response.send('404 - Not found');
})

// server starten
var port = process.env.PORT || app.get('PORT');

app.listen(port, function() {
    console.log('Server app is listening on port ' + port);
})


module.exports = app;