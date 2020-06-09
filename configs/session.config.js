// las configuraciones necesarias a la creación de una sesion
const session = require("express-session")
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');

// se arma una middleware function
// para crear o recoger una sesión existente...

module.exports = app => {
  app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 8*60*60*1000 }, //8 horas
    store: new MongoStore({
      // <== ADDED !!!
      mongooseConnection: mongoose.connection,
      // ttl => time to live
      ttl: 8*60*60*1000 // 8 horas
    })
  })
  )
}
