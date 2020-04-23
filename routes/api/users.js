const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

//@route    POST api/users
//@desc     Register user
//@acess    Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'password is required').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, userName } = req.body;

    try {
      //See if the user exists
      let user = await User.findOne({ email });

      if (user) {
        res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      /*
      const avatar=gravatar.url(email,{
          s:'200',
          r:'pg',
          d:'mm'
      })*/

      user = new User({
        email: email,
        password: password,
        userName: userName
      });

      //Encrypt password
      const salt = await bcypt.genSalt(10);

      user.password = await bcypt.hash(password, salt);

      await user.save();

      //Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };

      let token = await jwt.sign(payload, config.get('jwtSecret'), {
        expiresIn: 360000
      });

      res.json({
        token: token,
        user: user
      });

      //res.send('User registered');
    } catch (err) {
      res.status(500).send('Server error3');
    }
  }
);

module.exports = router;
