
require('dotenv').config();
require('./db.js')

const verifyToken = require('./middleware/token.middleware.js');
const adminVerifyToken = require('./middleware/token.admin.middleware.js');

const createError = require('http-errors');
const express = require('express');
const cors = require('cors');

const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1/', authRouter);
app.use('/api/v1/users', adminVerifyToken, require('./routes/users'));

app.use('/api/v1/products', verifyToken, require('./routes/products'));
app.use('/api/v1/orders', verifyToken, require('./routes/orders'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
