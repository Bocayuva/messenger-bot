require('dotenv').config();

const webhook = require('./controllers/webhook');

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();


app.use(bodyParser.json());
app.get('/', function (req, res) {
  console.log('________________________');
  console.log('_____ Hello World! _____');
  console.log('________________________');
  res.send('Hello World!');
});
app.get('/webhook', webhook.facebookVerification);
app.post('/webhook', webhook.facebook);

const server = http.createServer(app);
server.listen(443, () => console.log('ADCC has started | port:', 443));
