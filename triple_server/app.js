const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createDB = require('./database/createDB_Table')
const index = require('./routes/index')
const app = express();

// view engine setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', index)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

createDB()

module.exports = app;
