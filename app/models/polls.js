'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Poll = new Schema({
  creator_id: String,
  question: String,
  votes: {type: Number, default: 0},
  options: [
    {
      name: String,
      votes: {type: Number, default: 0}
    }
  ]
})

module.exports = mongoose.model('Poll', Poll)
