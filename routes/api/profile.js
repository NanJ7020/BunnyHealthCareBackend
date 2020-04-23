const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route    GET api/profile/me
//@desc     Get current users profile
//@acess    Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).send('Server Error4');
  }
});

//@route    POST api/profile
//@desc     Create or update user profile
//@acess    Private
router.post(
  '/',
  [
    auth,
    [
      check('zipcode', 'Zip code is 5 digits number')
        .not()
        .isEmpty()
        .isNumeric()
        .isLength({ min: 5 }),
      check('state', 'State is required')
        .not()
        .isEmpty(),
      check('city', 'City is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { zipcode, state, city } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (zipcode) profileFields.zipcode = zipcode;
    if (state) profileFields.state = state;
    if (city) profileFields.city = city;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      //Create
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      res.status(500).send('Server Error7');
    }
  }
);

//@route    GET api/profile
//@desc     Get all profiles
//@acess    Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name']);
    res.json(profiles);
  } catch (err) {
    res.status(500).send('Server Error8');
  }
});

//@route    GET api/profile/user/:user_id
//@desc     Get profile by user ID
//@acess    Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name']);

    if (!profile)
      return res.status(400).json({ msg: 'There is no profile for this user' });

    res.json(profile);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error9');
  }
});

//@route    DELETE api/profile
//@desc     Delete profile, user & posts
//@acess    Public
router.delete('/', auth, async (req, res) => {
  try {
    //Remove Posts
    await Post.deleteMany({ user: req.user.id });
    //Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).send('Server Error8');
  }
});

//@route    PUT api/profile/pets
//@desc     Add pet profile
//@acess    Private
router.put(
  '/pets',
  [
    auth,
    [
      check('petName', 'Pet name is required')
        .not()
        .isEmpty(),
      check('gender', 'Pet gender is required')
        .not()
        .isEmpty(),
      check('age', 'Pet age is required')
        .not()
        .isEmpty(),
      check('weight', 'Pet weight is required')
        .not()
        .isEmpty(),
      check('breed', 'Pet breed is required')
        .not()
        .isEmpty(),

      check('spayed_neutered', 'spayed or neutered is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { petName, gender, age, weight, breed, spayed_neutered } = req.body;

    const newPet = {
      petName: petName,
      gender: gender,
      age: age,
      weight: weight,
      breed: breed,
      spayed_neutered: spayed_neutered
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //check pet duplicate
      let pets = profile.pets;

      for (let pet of pets) {
        if (pet.petName == petName) {
          return res.status(400).json({ msg: 'pet duplicate' });
        }
      }

      profile.pets.unshift(newPet);

      await profile.save();

      res.json(profile);
    } catch (err) {
      res.status(500).send('Server Error1');
    }
  }
);

//update existed pet info
//@route    PUT api/profile/pets/:pet_id
//@desc     update pet profile
//@acess    Private
router.put(
  '/pets/:pet_id',
  [
    auth,
    [
      check('petName', 'Pet name is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { petName, gender, age, weight, breed, spayed_neutered } = req.body;

    const petInfo = {
      petName,
      gender,
      age,
      weight,
      breed,
      spayed_neutered
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //check pet exist
      let found = false;
      for (let pet of profile.pets) {
        if (pet._id == req.params.pet_id) {
          found = true;

          pet.petName = petName;
          pet.gender = gender;
          pet.age = age;
          pet.weight = weight;
          pet.breed = breed;
          pet.spayed_neutered = spayed_neutered;

          break;
        }
      }
      if (found == false) {
        return res.status(400).json({ msg: 'pet does not exist' });
      }
      //profile.pets.unshift(newPet);

      await profile.save();

      res.json(profile);
    } catch (err) {
      res.status(500).send('Server Error2');
    }
  }
);

//@route    DELETE api/profile/pets/:pet_id
//@desc     Delete pet from pets(pet list)
//@acess    Private
router.delete('/pets/:pet_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.pets
      .map(item => item.id)
      .indexOf(req.params.pet_id);

    profile.pets.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/profile/history
//@desc     Add profile history
//@acess    Private
router.put(
  '/history',
  [
    auth,
    [
      check('pet', 'Pet name is required')
        .not()
        .isEmpty(),
      check('hospital', 'hospital is required')
        .not()
        .isEmpty(),
      check('address', 'Address is required')
        .not()
        .isEmpty(),
      check('zipcode', 'Zip Code is required')
        .not()
        .isEmpty(),
      check('reasonForHospital', 'Reason for hospital is required')
        .not()
        .isEmpty(),
      check('visitTime', 'Vistit time is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      pet,
      weight,
      hospital,
      address,
      zipcode,
      reasonForHospital,
      visitTime
    } = req.body;

    const newHistory = {
      pet,
      weight,
      hospital,
      address,
      zipcode,
      reasonForHospital,
      visitTime
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.history.unshift(newHistory);

      await profile.save();

      res.json(profile);
    } catch (err) {
      res.status(500).send('Server Error111');
    }
  }
);

//@route    DELETE api/profile/history/:history_id
//@desc     Delete history from profile
//@acess    Private
router.delete('/history/:history_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.history
      .map(item => item.id)
      .indexOf(req.params.history_id);

    profile.history.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
