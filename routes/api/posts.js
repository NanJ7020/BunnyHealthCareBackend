const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route    POST api/posts
//@desc     Create a post
//@acess    Private
router.post(
  '/',
  [auth, [check('yelpID', 'Yelp ID is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const {
        yelpID,
        vetName,
        postTitle,
        image_url,
        address,
        phone,
        useful,
        nailTrim,
        fleaCheck,
        spay_neutered,
        laboratory,
        GI_stasis,
        date,
      } = req.body;
      const postFields = {};

      postFields.userName = user.userName;
      postFields.user = req.user.id;
      if (address) postFields.address = address;
      if (postTitle) postFields.postTitle = postTitle;
      if (yelpID) postFields.yelpID = yelpID;
      if (vetName) postFields.vetName = vetName;
      if (image_url) postFields.image_url = image_url;
      if (phone) postFields.phone = phone;
      if (date) postFields.date = date;

      const post = new Post(postFields);

      if (useful) {
        post.useful = [{ user: req.user.id }];
      }
      if (nailTrim) {
        post.nailTrim = [{ user: req.user.id }];
      }
      if (fleaCheck) {
        post.fleaCheck = [{ user: req.user.id }];
      }
      if (laboratory) {
        post.laboratory = [{ user: req.user.id }];
      }
      if (spay_neutered) {
        post.spay_neutered = [{ user: req.user.id }];
      }
      if (GI_stasis) {
        post.GI_stasis = [{ user: req.user.id }];
      }

      await post.save();

      res.json(post);
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  }
);

//@route    GET api/posts
//@desc     Get all post
//@acess    public
router.get('/', async (req, res) => {
  try {
    const currentPage = req.query.page || 1;
    const perPage = 5;
    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .sort({ date: -1 });
    const count = await Post.find().countDocuments();
    res.json({
      posts: posts,
      count: count,
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    GET api/posts/user/:user_id
//@desc     Get post by user id
//@acess    public
router.get('/user/:user_id', async (req, res) => {
  try {
    const currentPage = req.query.page || 1;
    const perPage = 10;

    const posts = await Post.find({ user: req.params.user_id })
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .sort({
        date: -1,
      });
    const count = await Post.find({
      user: req.params.user_id,
    }).countDocuments();
    res.json({
      posts: posts,
      count: count,
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route    GET api/posts/post/:post_id
//@desc     Get post by post id
//@acess    public
router.get('/post/:post_id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route    DELETE api/posts/post/:post_id
//@desc     Delete post by post id
//@acess    private
router.delete('/post/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/useful/:post_id
//@desc     click useful by post id
//@acess    private
router.put('/useful/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.useful.filter((useful) => useful.user.toString() === req.user.id)
        .length > 0
    ) {
      return res.status(400).json({ msg: 'Post already useful' });
    }

    post.useful.unshift({ user: req.user.id });

    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/notuseful/:post_id
//@desc     not useful by post id
//@acess    private
router.put('/notuseful/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.useful.filter((useful) => useful.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been useful' });
    }

    const removeIndex = post.useful
      .map((useful) => useful.user.toString())
      .indexOf(req.user.id);

    post.useful.splice(removeIndex, 1);

    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/nailTrim/:post_id
//@desc     click nailTrim by post id
//@acess    private
router.put('/nailTrim/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.nailTrim.filter(
        (nailTrim) => nailTrim.user.toString() === req.user.id
      ).length > 0
    ) {
      return res.status(400).json({ msg: 'Nail trim checked' });
    }

    post.nailTrim.unshift({ user: req.user.id });

    await post.save();

    res.json(post.nailTrim);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/notnailTrim/:post_id
//@desc     not nailTrim by post id
//@acess    private
router.put('/notnailTrim/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.nailTrim.filter(
        (nailTrim) => nailTrim.user.toString() === req.user.id
      ).length === 0
    ) {
      return res.status(400).json({ msg: 'Nail Trim canceled' });
    }

    const removeIndex = post.nailTrim
      .map((nailTrim) => nailTrim.user.toString())
      .indexOf(req.user.id);

    post.nailTrim.splice(removeIndex, 1);

    await post.save();

    res.json(post.nailTrim);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/fleaCheck/:post_id
//@desc     click fleaCheck by post id
//@acess    private
router.put('/fleaCheck/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.fleaCheck.filter(
        (fleaCheck) => fleaCheck.user.toString() === req.user.id
      ).length > 0
    ) {
      return res.status(400).json({ msg: 'Flea Checking checked' });
    }

    post.fleaCheck.unshift({ user: req.user.id });

    await post.save();

    res.json(post.fleaCheck);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/notfleaCheck/:post_id
//@desc     not fleaCheck by post id
//@acess    private
router.put('/notfleaCheck/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.fleaCheck.filter(
        (fleaCheck) => fleaCheck.user.toString() === req.user.id
      ).length === 0
    ) {
      return res.status(400).json({ msg: 'Flea Checking canceled' });
    }

    const removeIndex = post.fleaCheck
      .map((fleaCheck) => fleaCheck.user.toString())
      .indexOf(req.user.id);

    post.fleaCheck.splice(removeIndex, 1);

    await post.save();

    res.json(post.fleaCheck);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/spay_neutere/:post_id
//@desc     click spay_neutere by post id
//@acess    private
router.put('/spay_neutere/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.spay_neutere.filter(
        (spay_neutere) => spay_neutere.user.toString() === req.user.id
      ).length > 0
    ) {
      return res.status(400).json({ msg: 'Spay or neutere checked' });
    }

    post.spay_neutere.unshift({ user: req.user.id });

    await post.save();

    res.json(post.spay_neutere);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/notspay_neutere/:post_id
//@desc     not spay_neutere by post id
//@acess    private
router.put('/notspay_neutere/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.spay_neutere.filter(
        (spay_neutere) => spay_neutere.toString() === req.user.id
      ).length === 0
    ) {
      return res.status(400).json({ msg: 'Spay or neutere canceled' });
    }

    const removeIndex = post.spay_neutere
      .map((spay_neutere) => spay_neutere.user.toString())
      .indexOf(req.user.id);

    post.spay_neutere.splice(removeIndex, 1);

    await post.save();

    res.json(post.spay_neutere);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/laboratory/:post_id
//@desc     click laboratory by post id
//@acess    private
router.put('/laboratory/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.laboratory.filter(
        (laboratory) => laboratory.user.toString() === req.user.id
      ).length > 0
    ) {
      return res.status(400).json({ msg: 'Laboratory checked' });
    }

    post.laboratory.unshift({ user: req.user.id });

    await post.save();

    res.json(post.laboratory);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/notlaboratory/:post_id
//@desc     not laboratory by post id
//@acess    private
router.put('/notlaboratory/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.laboratory.filter(
        (laboratory) => laboratory.toString() === req.user.id
      ).length === 0
    ) {
      return res.status(400).json({ msg: 'Laboratory canceled' });
    }

    const removeIndex = post.laboratory
      .map((laboratory) => laboratory.user.toString())
      .indexOf(req.user.id);

    post.laboratory.splice(removeIndex, 1);

    await post.save();

    res.json(post.laboratory);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/GI_stasis/:post_id
//@desc     click GI_stasis by post id
//@acess    private
router.put('/GI_stasis/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.GI_stasis.filter(
        (GI_stasis) => GI_stasis.user.toString() === req.user.id
      ).length > 0
    ) {
      return res.status(400).json({ msg: 'GI stasis checked' });
    }

    post.GI_stasis.unshift({ user: req.user.id });

    await post.save();

    res.json(post.GI_stasis);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/notGI_stasis/:post_id
//@desc     not GI_stasis by post id
//@acess    private
router.put('/notGI_stasis/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (
      post.GI_stasis.filter((GI_stasis) => GI_stasis.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'GI stasis canceled' });
    }

    const removeIndex = post.GI_stasis.map((GI_stasis) =>
      GI_stasis.user.toString()
    ).indexOf(req.user.id);

    post.GI_stasis.splice(removeIndex, 1);

    await post.save();

    res.json(post.GI_stasis);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
