var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
// const db = require('./models');
var indexRouter = require('./routes/index');
var loanRouter = require('./routes/loan.routes');
var authRouter = require('./routes/auth.router');
const sequelize = require('./utils/database');
const swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('./swagger.json');
const cron = require('node-cron');
const cronJobs = require('./utils/cron');

const Loan = require('./models/loan.model');
const User = require('./models/user.model');

var app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * CRON JOBS START
 */

// RUNS EVERY DAY AT 01:30 AM
cron.schedule('30 1 * * *', () => {
  cronJobs.updateLoans();
});

 /**
  * CRON JOBS END
  */

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Endpoint for Heroku pinging
app.get('/', (req, res) => {
  return res.send('Hello');
});

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/form', indexRouter);
app.use('/api/loans', loanRouter);
app.use('/api/auth', authRouter);
// app.use('/loan', loanRouter);

Loan.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
User.hasMany(Loan);

// DB
sequelize.sync().then(() => {
  console.log('Re-sync db.');
}).catch(err => {
  console.log(err);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
