const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createDB = require('./database/createDB_Table')
const index = require('./routes/index')
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', index)

app.use(function(req, res, next) {
  next(createError(404));
});

createDB()

module.exports = app;
