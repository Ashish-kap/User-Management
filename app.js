// Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const util = require('util');

// Create express app
const app = express();

// Middleware
app.use(bodyParser.json());

// Create database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Srigbok@157',
  database: 'user_management'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }

  console.log('Connected to database');
});

// Promisify query method
const query = util.promisify(db.query).bind(db);

// Create User model
class User {
  constructor(id, firstName, lastName, email, phone) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phone = phone;
  }
}

// Create users table
const createUsersTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT(11) NOT NULL AUTO_INCREMENT,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(10) NOT NULL,
        PRIMARY KEY (id)
      )
    `);

    console.log('Users table created');
  } catch (err) {
    console.error('Error creating users table:', err);
  }
};

createUsersTable();

// Register User
app.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const result = await query('INSERT INTO users (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)', [firstName, lastName, email, phone]);

    const user = new User(result.insertId, firstName, lastName, email, phone);

    res.status(201).json(user);
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user');
  }
});

// Get User by ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM users WHERE id = ?', [id]);

    if (result.length === 0) {
      res.status(404).send('User not found');
    } else {
      const user = new User(result[0].id, result[0].first_name, result[0].last_name, result[0].email, result[0].phone);
      res.json(user);
    }
  } catch (err) {
    console.error('Error getting user by ID:', err);
    res.status(500).send('Error getting user by ID');
  }
});

// Update User
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone } = req.body;
    const result = await query('UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?', [firstName, lastName, email, phone, id]);

    if (result.affectedRows === 0) {
      res.status(404).send('User not found');
    } else {
      const user = new User(id, firstName, lastName, email, phone);
      res.json(user);
    }
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send('Error updating user');
  }
});

// Delete/Disable User
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      res.status(404).send('User not found');
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send('Error deleting user');
  }
});

// List All Users with filters
app.get('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.query;

    let sql = 'SELECT * FROM users';

    if (firstName || lastName || email || phone) {
      sql += ' WHERE';
      if (firstName) {
        sql += ` first_name LIKE '%${firstName}%'`;
        if (lastName || email || phone) {
          sql += ' AND';
        }
      }
      if (lastName) {
        sql += ` last_name LIKE '%${lastName}%'`;
        if (email || phone) {
          sql += ' AND';
        }
      }
      if (email) {
        sql += ` email LIKE '%${email}%'`;
        if (phone) {
          sql += ' AND';
        }
      }
      if (phone) {
        sql += ` phone LIKE '%${phone}%'`;
      }
    }

    const result = await query(sql);

    const users = result.map(user => new User(user.id, user.first_name, user.last_name, user.email, user.phone));

    res.json(users);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).send('Error listing users');
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});


