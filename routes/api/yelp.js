const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const yelp = require('yelp-fusion');
const yelp_key =
  'aFy5gH0vOtETj9aB326Ghikuv3bbAH4MkTMHu53hsRM6HEcp7svgcqmzoRea7rAoKKCOZWa_h09AdFM98Mc7B78E-54MCuw5R_D5xKRDoI8vcC9stgh-13sggSpQXXYx';
const client = yelp.client(yelp_key);

//@route    POST api/yelp/search
//@desc     post yelp search
//@acess    Public
router.post(
  '/search',
  [
    check('location', 'location is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { term, location, categories, limit } = req.body;

    const searchRequest = {};
    searchRequest.limit = 10;

    if (term) searchRequest.term = term;
    if (limit) searchRequest.limit = parseInt(limit);
    if (categories) {
      searchRequest.categories = categories
        .split(',')
        .map(category => category.trim());
    }

    searchRequest.location = location;

    //response result
    try {
      const response = await client.search(searchRequest);
      const Results = response.jsonBody.businesses;
      const FilterResults = Results.map(item => ({
        id: item.id,
        name: item.name,
        image_url: item.image_url,
        rating: item.rating,
        display_phone: item.display_phone,
        distance: item.distance,
        location: item.location.display_address.join(),
        is_closed: item.is_closed
      }));

      res.json({
        yelps: FilterResults
      });
    } catch (err) {
      return res.status(500).send('Yelp Server Error');
    }
  }
);

//@route    GET api/yelp/reviews
//@desc     Get reviews from Yelp
//@acess    Public
router.get('/reviews/:id', async (req, res) => {
  try {
    const response = await client.reviews(req.params.id);
    res.json(
      response.jsonBody.reviews.map(item => ({
        text: item.text,
        rating: item.rating,
        time_created: item.time_created
      }))
    );
  } catch (err) {
    return res.status(500).send('Yelp Server Error');
  }
});

module.exports = router;
