var express = require('express');
var router = express.Router();
var pool = require('../db/db_connector');

var auth =  require('../auth/authentication');
var bcrypt = require('bcryptjs');

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

router.get('/films/:filmid', function(req, res){
    var id = req.params.filmid;

    if(id === '' || isNaN(id)) {
        res.status(400);
        res.json({"error": "Usage: /films/:filmid", "msg": "ID non existent"});
    } else if (id){
        var query = {
            sql: 'SELECT * FROM film WHERE film_id = ' + id,
            timeout: 2000
        };

        res.contentType('application/json');
        pool.query(query, function(error, rows, fields){
            if(error){
                res.status(400);
                res.json({'error':'Error, please try again'});
            } else if (rows.length === 0){
                res.status(400);
                res.json({"msg":"ID non existent"});
            } else {
                res.status(200);
                res.json(rows);
            }
        });
    }
});

router.get('/films', function (req, res) {
    var offset = parseInt(req.query.offset) || '';
    var count = parseInt(req.query.count) || '';

    if (offset === '' || count === ''){
        res.status(400);
        res.json({"error":"Usage: /films?offset=number&count=number", "msg":"Both offset and count must be a number greater than 1"});
    } else {
        var max = offset + count - 1;
        var query = {
            sql: 'SELECT * FROM film WHERE film_id BETWEEN ' + offset + ' AND ' + max,
            timeout: 2000
        };

        res.contentType('application/json');
        pool.query(query, function (error, rows, fields) {
            if (error) {
                res.status(400);
                res.json(error);
            } else if(rows.length === 0){
                res.status(400);
                res.json({"Msg":"No result found"});
            } else {
                res.status(200);
                res.json({"totalResultSize":rows.length, "results":rows});
            }
        });
    }
});

router.post('/rentals/:userid/:inventoryid', function(req, res){
    var rentaluser = req.body;
    var userid = req.params.userid;
    var inventid = req.params.inventoryid;

    console.log('UserID = ' + userid);
    console.log('InventoryID = ' + inventid);
    console.log('Staff_ID = ' + rentaluser.staff_id)

    var date;
    date = new Date();
    date = date.getFullYear() + '-' +
        ('00' + (date.getMonth()+1)).slice(-2) + '-' +
        ('00' + date.getDate()).slice(-2) + ' ' +
        ('00' + date.getHours()).slice(-2) + ':' +
        ('00' + date.getMinutes()).slice(-2) + ':' +
        ('00' + date.getSeconds()).slice(-2);
    console.log('The date is ' + date);

    var rental_id_null = null;

    if(userid === '' || inventid === ''){
        res.status(404);
        res.json({'error':'Usage: /rentals/:userid/:inventoryid', 'msg':'ID non existent'})
    } else if(isNaN(userid) || isNaN(inventid)){
        res.status(404);
        res.json({'error':'Usage: /rentals/:userid/:inventoryid', 'msg':'ID non existent'})
    } else if (isNaN(rentaluser.staff_id) || rentaluser.staff_id === undefined) {
        res.status(400);
        res.json({'error':'Usage: /rentals/:userid/:inventoryid', 'msg':'Staff_id is missing, please add'})
    }  else {
        var query1 = {
            sql: 'SELECT SUM((SELECT COUNT(film_id) AS "# of films in inventory" FROM inventory WHERE film_id=' + rentaluser.film_id + ') - (SELECT COUNT(rental_id) AS "# of films rented" FROM rental, inventory WHERE return_date IS NULL AND rental.inventory_id=inventory.inventory_id AND inventory.film_id=' + rentaluser.film_id + ')) AS filmsNotRented;',
            timeout:2000
        }

        var query = {
            sql: 'INSERT INTO `rental`(rental_id, rental_date, inventory_id, customer_id, staff_id, last_update) VALUES (?, ?, ?, ?, ?, ?)',
            values: [rental_id_null, date, inventid, userid, rentaluser.staff_id, date],
            timeout: 2000 //2 seconden
        };
    }

    console.log('FilmID: ' + rentaluser.film_id);
    console.log('Query1: ' + query1.sql);
    console.log('StaffID: ' + rentaluser.staff_id);
    console.log('Values: ' + query.values);
    console.log('Query: ' + query.sql);

    res.contentType('application/json');
    pool.query(query1, function(error, rows, fields){
        if(error){
            res.status(400);
            res.json(error);
        } else if(rows.length === 0) {
            res.status(400);
            res.json({"msg":"Duplicate entry, entry already exists in database"});
        } else {
            console.log(rows[0]);
            if(rows[0].filmsNotRented > 0)
            {
                pool.query(query, function (error, rows, fields) {
                    if (error) {
                        res.status(400);
                        res.json(error);
                    } else if (rows.length === 0) {
                        res.status(400);
                        res.json({"msg": "Unable to rent movie, try again later"});
                    } else {
                        res.status(200);
                        res.json({'msg': 'Successfully added to database'});
                    }
                })
            } else {
                res.status(400);
                res.json({"msg":"Movie not available, try another movie"});
            }
        }
    });
});

router.put('/rentals/:userid/:inventoryid/:rentalid', function(req, res) {
    var userid = req.params.userid;
    var inventid = req.params.inventoryid;
    var rentalid = req.params.rentalid;

    var date;
    date = new Date();
    date = date.getFullYear() +
        ('00' + (date.getMonth()+1)).slice(-2) +
        ('00' + date.getDate()).slice(-2) +
        ('00' + date.getHours()).slice(-2) +
        ('00' + date.getMinutes()).slice(-2) +
        ('00' + date.getSeconds()).slice(-2);
    console.log('The date is ' + date);

    if(userid === '' || inventid === ''){
        res.status(400);
        res.json({'error':'Usage: /apiv1/rentals/:userid/:inventoryid', 'msg':'Please fill in an user- or inventoryid'});
    } else if(isNaN(userid) || isNaN(inventid)) {
        res.status(404);
        res.json({'error': 'Usage: /rentals/:userid/:inventoryid', 'msg': 'ID non existent'})
    } else if (rentalid === '' || isNaN(rentalid)){
        res.status(400);
        res.json({'error':'Usage /rentals/:userid/:inventoryid', 'msg': 'RentalID unknown'})
    } else {
        query = {
            sql: 'UPDATE `rental` SET `return_date`=' + date + ' WHERE `customer_id`=' + userid + ' AND `inventory_id`=' + inventid + ' AND rental_id = ' + rentalid + ';',
            timeout: 2000 //2 seconden
        };
    }

    console.log('Query = ' + query.sql);

    res.contentType('application/json');
    pool.query(query, function(error, rows, fields){
        if(error){
            res.status(400);
            res.json(error);
        } else {
            res.status(200);
            res.json({'msg':'return_date successfully updated'});
        }
    });
});

router.delete('/rentals/:userid/:inventoryid', function(req, res) {
    var userid = req.params.userid;
    var inventid = req.params.inventoryid;

    if(userid === '' || inventid === ''){
        res.status(400);
        res.json({'error':'Usage: /apiv1/rentals/:userid/:inventoryid', 'msg':'Please fill in an user- or inventoryid'});
    } else if(isNaN(userid) || isNaN(inventid)) {
        res.status(404);
        res.json({'error': 'Usage: /rentals/:userid/:inventoryid', 'msg': 'ID non existent'})
    } else {
        var query = {
            sql: 'DELETE FROM `rental` WHERE customer_id = ' + userid + ' AND inventory_id = ' + inventid + ';',
            timeout: 2000 //2 seconden
        }
        res.json({'msg':'Rental deleted successfully'});
    }

    console.log('Query =' + query.sql);

    res.contentType('application/json');
    pool.query(query, function(error, rows, fields){
        if(error){
            res.status(400);
            res.json(error);
        } else {
            res.status(200);
            res.json(rows);
        };
    });
});

router.get('/rentals/:userid', function (req, res){
    var id = req.params.userid;

    if(id === '' || isNaN(id)) {
        res.status(400);
        res.json({"error": "Usage: /rentals/:userid", "msg":"ID is non existent"});
    } else if (id){
        var query = {
            sql:    'SELECT title, rental_id, return_date, inventory.inventory_id, ADDDATE(rental.rental_date, film.rental_duration) AS date_to_return ' +
            'FROM film, inventory, rental, customer ' +
            'WHERE customer.customer_id = ' + id +
            ' AND customer.customer_id = rental.customer_id ' +
            'AND rental.inventory_id = inventory.inventory_id ' +
            'AND inventory.film_id = film.film_id;',
            timeout: 2000
        };

        res.contentType('application/json');
        pool.query(query, function(error, rows, fields){
            if(error){
                res.status(400);
                res.json(error);
            } else if (rows.length === 0){
                res.status(400);
                res.json({"msg":"ID non existent"});
            } else {
                res.status(200);
                res.json(rows);
            }
        });
    }
});


module.exports = router;