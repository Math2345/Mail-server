const express = require("express");
const bodyParser = require('body-parser');
const { Router } = require("express");

const app = express();

// logger
const mixin = { appName: 'My app' };
const pino = require('pino');
const expressPino = require('express-pino-logger');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' || 'error' }, pino.destination({ dest: "./logs/info.log", sync: true }), {
    mixin() {
        return mixin;
    }
});

const expressLogger = expressPino({logger});


// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLogger);

const router = express.Router();

const port = process.env.PORT || 3000;
const filePath = 'db/notification.json';
const log_file = 'logs/info.log';


const notificationsRouters = require('./api/routers/notify_routers');

app.use('/api', notificationsRouters);


module.exports = app;

