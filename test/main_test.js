var chai = require('chai');
var chaiHttp = require('chai-http');
var mocha = require('mocha');
var server = require('../index');
var chould = chai.should();

chai.use(chaiHttp);

describe('DELETE /rentals/:userid/:inventoryid', function(){
    it('returns DELETE request accepted message with status 200 on DELETE /apiv1/rentals/:userid/:inventoryid', function(done){
        chai.request(server)
            .delete('/api/v1/rentals/83/2')
            .end(function(err, res){
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('msg').equal('Rental deleted successfully');
                done();
            });
    });
    it('returns error when userid is not a number', function(){
        chai.request(server)
            .delete('/api/v1/rentals/b/2')
            .end(function(err, res){
                res.should.have.status(404);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /rentals/:userid/:inventoryid');
                res.body.should.have.property('msg').equal('ID non existent');
                done();
            });
    });
    it('returns error if inventoryid is empty', function(){
        chai.request(server)
            .delete('/api/v1/rentals/b/')
            .end(function(err, res){
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /apiv1/rentals/:userid/:inventoryid');
                res.body.should.have.property('msg').equal('Please fill in an user- or inventoryid');
                done();
            });
    });
});

describe('PUT /rentals/:userid/:inventoryid/:rentalid', function(){
    it('returns put request accepted message with status 200 on PUT /apiv1/rentals/:userid/:inventoryid', function(done){
        chai.request(server)
            .put('/api/v1/rentals/2/1090/16069')
            .send({"rental_id":"1068"})
            .end(function(err, res){
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('msg').equal('return_date successfully updated');
                done();
            });
    });
    it('returns error when userid is not a number', function(){
        chai.request(server)
            .put('/api/v1/rentals/b/2/1060')
            .end(function(err, res){
                res.should.have.status(404);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /rentals/:userid/:inventoryid');
                res.body.should.have.property('msg').equal('ID non existent');
                done();
            });
    });
    it('returns error if inventoryid is empty', function(){
        chai.request(server)
            .put('/api/v1/rentals/b//1090')
            .end(function(err, res){
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /apiv1/rentals/:userid/:inventoryid');
                res.body.should.have.property('msg').equal('Please fill in an user- or inventoryid');
                done();
            });
    });
});

describe('POST /rentals/:userid/:inventoryid', function(){
    it('returns post request accepted message with status 200 on POST /apiv1/rentals/:userid/:inventoryid', function(done){
        chai.request(server)
            .post('/api/v1/rentals/2/1090')
            .send({"film_id":"1", "staff_id":"2"})
            .end(function(err, res){
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('msg').equal('Successfully added to database')
                done();
            });
    });
    it('returns error message and status 400 on POST request without adding staff_id', function(done){
        chai.request(server)
            .post('/api/v1/rentals/2/1090')
            .send('')
            .end(function(err,res){
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('Object');
                res.body.should.have.property('error').equal('Usage: /rentals/:userid/:inventoryid');
                res.body.should.have.property('msg').equal('Staff_id is missing, please add')
                done();
            });
    });
    it('returns error message when movie is no longer available', function(done){
        chai.request(server)
            .post('/api/v1/rentals/2/1090')
            .send({"film_id":"243", "staff_id":"2"})
            .end(function(err, res){
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('msg').equal('Movie not available, try another movie');
                done();
            });
    });
    it('returns error message when staff_id is not a number', function(done){
        chai.request(server)
            .post('/api/v1/rentals/2/1090')
            .send('b')
            .end(function(err,res){
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /rentals/:userid/:inventoryid');
                res.body.should.have.property('msg').equal('Staff_id is missing, please add');
                done();
            });
    });
});

describe('/filmid test', function(){
    it('returns wrong usage error on GET /apiv1/films/:filmid withoud id query', function(done){
        chai.request(server)
            .get('/api/v1/films/:filmid')
            .end(function(err, res){
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /films/:filmid');
                res.body.should.have.property('msg').equal('ID non existent');
                done();
            });
    });

    it('returns wrong usage error on GET /apiv1/films/1001', function(done){
        chai.request(server)
            .get('/api/v1/films/1001')
            .end(function(err, res){
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('msg').equal('ID non existent');
                done();
            });
    });

    it('returns data on GET /apiv1/films/1', function(done){
        chai.request(server)
            .get('/api/v1/films/1')
            .end(function(err, res){
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('Array');
                done();
            });
    });
});

describe('/films test', function () {

    it('returns wrong usage error on GET /apiv1/films without query', function(done) {
        chai.request(server)
            .get('/api/v1/films')
            .end(function(err, res) {
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /films?offset=number&count=number');
                res.body.should.have.property('msg').equal('Both offset and count must be a number greater than 1');
                done();
            });
    });

    it('returns wrong usage error on GET /apiv1/films?offset=1', function(done) {
        chai.request(server)
            .get('/api/v1/films?offset=1')
            .end(function(err, res) {
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /films?offset=number&count=number');
                res.body.should.have.property('msg').equal('Both offset and count must be a number greater than 1');
                done();
            });
    });

    it('returns wrong usage error on GET /apiv1/films?offset=1&count=0', function(done) {
        chai.request(server)
            .get('/api/v1/films?offset=1&count=0')
            .end(function(err, res) {
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error').equal('Usage: /films?offset=number&count=number');
                res.body.should.have.property('msg').equal('Both offset and count must be a number greater than 1');
                done();
            });
    });

    it('returns data on GET /apiv1/films?offset=1&count=10', function(done) {
        chai.request(server)
            .get('/apiv1/films?offset=1&count=10')
            .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                done();
            });
    });
});


describe('Authentication register', function () {

    it('returns an error on POST /apiv1/register without password', function(done) {
        var user = {
            username: "onlyusername"
        };
        chai.request(server)
            .post('/api/v1/register')
            .send(user)
            .end(function(err, res) {
                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('error').equal('Usage: firstname, lastname, email and password must be submitted');
                done();
            });
    });

    it('returns a msg on POST /apiv1/register with valid credentials', function(done) {
        var d = new Date();
        var n = d.getTime();
        var user = {
            username: "newuserthatdoesntexist",
            password: "newuserthatdoesntexist"
        };
        chai.request(server)
            .post('/api/v1/register')
            .send(user)
            .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('msg').equal('User created');
                done();
            });
    });
});


describe('Authentication login', function () {

    it('returns an error on POST /apiv1/login with invalid credentials ', function(done) {
        var user = {
            username: "wrongusername",
            password: "wrongpassword"
        };
        chai.request(server)
            .post('/api/v1/login')
            .send(user)
            .end(function(err, res) {
                res.should.have.status(401);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('error').equal('Invalid credentials, try again');
                done();
            });
    });

    it('returns a token on POST /apiv1/login with valid credentials', function(done) {
        var user = {
            username: "test",
            password: "test"
        };
        chai.request(server)
            .post('/api/v1/login')
            .send(user)
            .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('token');
                done();
            });
    });
});