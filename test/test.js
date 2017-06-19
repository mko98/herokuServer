const request = require('supertest');
const server = require('../server');
const expect = require('chai').expect;

describe('Correct login API', function() {
    it('Should success if credential is valid', function(done) {
        request(server)
            .post('/api/v1/login')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({ username: 'test', password: 'test' })
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(function(response) {
                expect(response.body).not.to.be.empty;
                expect(response.body).to.be.an('object');
            })
            .end(done);
    });
});

describe('Incorrect login API', function() {
    it('Should success if credential is invalid', function(done) {
        request(server)
            .post('/api/v1/login')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({ username: 'wronguser', password: 'wrongpass' })
            .expect(401)
            .expect('Content-Type', /json/)
            .expect(function(response) {
                expect(response.body).to.include({"error": "Invalid credentials, bye"});
                expect(response.body).to.be.an('object');
            })
            .end(done);
    });
});

// describe('Correct register API', function() {
//     it('Should success if credential is not in database', function(done) {
//         request(server)
//             .post('/api/v1/register')
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .send({ username: 'nieuwegebruiker', password: 'nieuwegebruiker' })
//             .expect(500)
//             .expect('Content-Type', /json/)
//             .expect(function(response) {
//                 expect(response.body).not.to.be.empty;
//                 expect(response.body).to.be.an('object');
//             })
//             .end(done);
//     });
// });
//
// describe('Incorrect register API', function() {
//     it('Should success if credential is already in database', function(done) {
//         request(server)
//             .post('/api/v1/register')
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .send({ username: 'test', password: 'test' })
//             .expect(500)
//             .expect('Content-Type', /json/)
//             .expect(function(response) {
//                 expect(response.body).to.include({"Error": "Deze gebruiker bestaat al"});
//                 expect(response.body).to.be.an('object');
//             })
//             .end(done);
//     });
// });