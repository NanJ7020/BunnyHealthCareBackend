const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

//@route    GET api/auth
//@desc     Test route
//@acess    Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    POST api/auth
//@desc     Authenticate user & get token
//@acess    Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      //See if not user
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      //match email and password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid password or email address' }] });
      }
      //Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };

      //Sign
      let token = await jwt.sign(payload, config.get('jwtSecret'), {
        expiresIn: 360000
      });

      res.json({
        token: token,
        user: user
      });

      /*
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 }, //3600 for 1hr
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );*/

      //res.send('User registered');
    } catch (err) {
      res.status(500).send('Server error 1');
    }
  }
);

module.exports = router;
