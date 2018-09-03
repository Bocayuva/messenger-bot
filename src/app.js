require('dotenv').config();

const webhook = require('./controllers/webhook');

// Imports dependencies and set up http server
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http');
app.use(bodyParser.json());
app.get('/webhook', webhook.facebookVerification);
app.post('/webhook', webhook.facebook);

const server = http.createServer(app);
server.listen(3000, () => console.log('ADCC has started | port:', 3000));
