var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  hasher: function(str, colName) {
    //var hash =
    bcrypt.hash(str, 8, function(err, hash) {
      model.set(colName, hash);
    });
  },

  initialize: function() {
    var that = this;
    this.on('creating', function(model, attrs, options) {
      that.hasher(that.model.get('username'), 'code1');
      that.hasher(that.model.get('password'), 'code2');
    });
  }
});

module.exports = User;

      // get clarification on how to get and set password and hash
      // var vod = bcrypt.createHash('vod12');
      // vod.update(model.get('username'));
      // model.set('code', vod.digest('hex').slice(0,5));
