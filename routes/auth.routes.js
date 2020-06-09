const { Router } = require('express')
const bcrypt = require("bcryptjs")
const User = require("../models/User.model")
const saltRounds = 10;
const mongoose = require("mongoose")

const router = new Router();

router.get('/signup', (req, res) => res.render('auth/signup'))

router.get('/userProfile', (req, res) => {
  console.log("usuario logueado: ", req.session.currentUser)

  res.render('users/user-profile', {user: req.session.currentUser})
})

router.post('/signup', (req, res, next) => {

  const { username, email, password } = req.body

  if (!username || !email || !password) {
    res.render('auth/signup', { errorMessage: 'Las informaciones username, email y contraseña son mandatorias' });
    return;
  }

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

  if (!regex.test(password)) {
    res.render('auth/signup', { errorMessage: 'contraseña debe tener por lo menos 6 ch, 1 a-z 1 A-Z' });
    return;
  }

  bcrypt.genSalt(saltRounds)
    .then(salt => bcrypt.hash(password, salt))
    .then(hashedPassword => {
      console.log("la hash es: ", hashedPassword)
      //console.log(req.body)
      // Crear el usuario en la base de datos
      return User.create({
        username: username,
        email: email,
        passwordHash: hashedPassword
      })
    })
    .then(user => {
      console.log("Usuario creado con éxito. Datos: ", user)
      req.session.currentUser = user
      res.redirect("/userProfile")
    })
    .catch(error => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).render('auth/signup', {
          errorMessage: error.message
        });

      } else if (error.code === 11000) {
        // error de duplicidad sea del username o sea del email
        res.status(400).render('auth/signup', {
            errorMessage: 'username o correo ya existen...'
          });
      } else {
        next(error);
      }

    })

})

router.get('/login', (req, res) => {
  console.log("La session existe? ", req.session)
  res.render('auth/login')
});

router.post('/login', (req, res, next) => {
  const { email, password } = req.body;

  if (email === '' || password === '') {
    res.render('auth/login', {
      errorMessage: 'Please enter both, email and password to login.'
    });
    return;
  }

  User.findOne({ email })
  .then(user => {
    if (!user) {
      res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.' });
      return;

    } else if (bcrypt.compareSync(password, user.passwordHash)) {
      req.session.currentUser = user
      res.redirect('/userProfile')

    } else {
      res.render('auth/login', { errorMessage: 'Incorrect password.' });
      
    }
  })
  .catch(error => next(error));
});

router.post("/logout", (req, res, next) => {
  req.session.destroy()
  res.redirect('/')
})

module.exports = router