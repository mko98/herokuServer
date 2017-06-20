var express = require('express');
var router = express.Router();
var pool = require('../db/db_connector');

var auth =  require('../auth/authentication');
var bcrypt = require('bcrypt');

router.all( new RegExp("[^(\/login|\/register)]"), function (req, res, next) {

    console.log("VALIDATE TOKEN")

    var token = (req.header('Token')) || '';

    auth.decodeToken(token, function (err, payload) {
        if (err) {
            console.log('Error handler: ' + err.message);
            res.status((err.status || 401 )).json({error: new Error("Not authorised").message});
        } else {
            next();
        }
    });
});

router.post('/login', function(req, res) {

    var username = req.body.username || '';
    var password = req.body.password || '';

    if (username != '' && password != '') {
        var query_str = {
            sql: query_str = 'SELECT password FROM customer WHERE username=?',
            values: [username],
            timeout: 2000
        }

        pool.getConnection(function (error, connection) {
            if (error) {
                throw error
            }
            connection.query(query_str, function (error, result, fields) {
                connection.release();
                if (error) {
                    throw error
                }

                if (result.length > 0) {
                    bcrypt.compare(password, result[0].password, function (err, response) {
                        if (response === true) {
                            console.log("Correct ingevoerd password");
                            res.status(200).json({"token": auth.encodeToken(username), "username": username});
                        } else {
                            res.status(401).json({"error": "Invalid credentials, bye"})
                        }
                    });
                } else {
                    res.status(401).json({"error": "Invalid credentials, bye"})
                }
            });
        });
    }
});

router.post('/register', function(req, res) {

    var username = req.body.username || '';
    var password = req.body.password || '';

    if (username != '' && password != '') {
        var hash = bcrypt.hashSync(password, 10);
        var query_str = {
            sql: 'INSERT INTO `customer` (username, password) VALUES (?, ?)',
            values: [username, hash],
            timeout: 2000 // 2secs
        };

        pool.getConnection(function (error, connection) {
            if (error) {
                throw error
            }
            connection.query(query_str, function (error, rows, fields) {
                connection.release();
                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        res.status(200).json({"Error": "Deze gebruiker bestaat al"});
                        return;
                    } else {
                        throw error
                    }
                }
                console.log("Gebruiker aangemaakt in database");
                console.log("Password opgeslagen als hash in database");

                // Generate JWT
                res.status(200).json({"token": auth.encodeToken(username), "username": username});
            });
        });
    };
});

router.get('/films/:number&:count', function(request, response) {
    var count = request.params.count;
    var number = request.params.number;
    var query_str = {
        sql: query_str = 'SELECT * FROM film ORDER BY title LIMIT ' + count + ',' + number,
        values: [],
        timeout: 2000
    }
    console.log('Query: ' + query_str.sql + query_str.values + "\n");

    response.contentType('application/json');

    pool.getConnection(function (error, connection) {
        if (error) {
            throw error
        }
        connection.query(query_str, function (error, rows, fields) {
            connection.release();
            if (error) {
                throw error
            }
            response.status(200).json(rows);
        });
    });
});

router.get('/films/:filmid?', function(request, response, next) {
    var filmid = request.params.filmid;
    var query_str;

    if (filmid > 0) {
        query_str = 'SELECT * FROM `1069`.film WHERE film_id = "' + filmid + '";';

        pool.getConnection(function (error, connection) {
            if (error) {
                throw error
            }
            connection.query(query_str, function (error, rows, fields) {
                connection.release();
                if (error) {
                    throw error
                }
                response.status(200).json(rows);
            });
        });
    } else {
        next();
        return;
    }
});

router.get('/rentals/:userid', function(request, response, next) {
    var userid = request.params.userid;
    var query_str;

    if (userid > 0) {
        query_str = 'SELECT title FROM film INNER JOIN inventory ON film.film_id = inventory.film_id INNER JOIN rental ON inventory.inventory_id = rental.inventory_id INNER JOIN customer ON rental.customer_id = customer.customer_id WHERE customer.customer_id = "' + userid + '";';

        pool.getConnection(function (error, connection) {
            if (error) {
                throw error
            }
            connection.query(query_str, function (error, rows, fields) {
                connection.release();
                if (error) {
                    throw error
                }
                response.status(200).json(rows);
            });
        });
    } else {
        next();
        return;
    }
});

router.post('/rentals/:customer_id/:inventory_id', function(request, response) {
    console.log('test rental.');
    var rental = request.body;
    console.log(rental.inventory_id);
    var query_str = {
        sql: 'INSERT INTO `rental` (customer_id, inventory_id) VALUES (?, ?)',
        values : [rental.customer_id, rental.inventory_id],
        timeout : 20000 // 2secs
    };

    console.dir(rental);
    console.log('Query: ' + query_str.sql + "\n" + query_str.values);

    response.contentType('application/json');

    pool.getConnection(function (error, connection) {
        if (error) {
            throw error
        }
        connection.query(query_str, function (error, rows, fields) {
            connection.release();
            if (error) {
                throw error
            }
            response.status(200).json(rows);
        });
    });
});

router.put('/rentals/:inventory_id', function(request, response) {

    var rental = request.body;
    var inventory_id = request.body;
    var query_str = {
        sql:
        // 'UPDATE `country` SET name=? WHERE code=?',
            'UPDATE rental SET inventory_id=? WHERE inventory_id =1 AND customer_id=?',
        values : [ rental.customer_id, rental.inventory_id ],
        timeout : 2000
    };

    console.log('Query: ' + query_str.sql + "\n" + query_str.values + "\n");

    response.contentType('application/json');

    pool.getConnection(function (error, connection) {
        if (error) {
            throw error
        }
        connection.query(query_str, function (error, rows, fields) {
            connection.release();
            if (error) {
                throw error
            }
            response.status(200).json(rows);
        });
    });
});


router.delete('/rentals/:customer_id', function(request, response, next) {
    var customer_id = request.params.customer_id;
    var query_str;

    if (customer_id > 0) {
        query_str = 'DELETE FROM rental WHERE customer_id=' + customer_id +''
        pool.getConnection(function (error, connection) {
            if (error) {
                throw error
            }
            connection.query(query_str, function (error, rows, fields) {
                connection.release();
                if (error) {
                    throw error
                }
                response.status(200).json(rows);
            });
        });
    } else {
        next();
        return;
    }
});

module.exports = router;