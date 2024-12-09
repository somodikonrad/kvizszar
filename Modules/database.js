var mysql = require('mysql');

var pool  = mysql.createPool({
    connectionLimit : process.env.CONNECTIONLIMIT,
    host            : process.env.DBHOST,
    user            : process.env.DBUSER,
    password        : process.env.DBPASS,
    database        : process.env.DBNAME
});

pool.getConnection((err) => {
    if (err){
        console.log('Error connection to MySQL: ' + err);
    }else{
        console.log('Connected to MySQL database.');
    }
});

module.exports = pool;