const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },

  pets: [
    {
      petName: {
        type: String,
        required: true
      },
      gender: {
        type: String
      },
      age: {
        type: String
      },
      weight: {
        type: String
      },
      breed: {
        type: String,
        default: 'unknown'
      },
      spayed_neutered: {
        type: String,
        default: 'No'
      }
    }
  ],

  zipcode: {
    type: Number,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  history: [
    {
      pet: {
        type: String,
        required: true
      },
      weight: {
        type: String
      },
      hospital: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      zipcode: {
        type: String,
        required: true
      },
      reasonForHospital: {
        type: String,
        required: true
      },
      visitTime: {
        type: String
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
