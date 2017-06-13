var express = require('express');
var router = express.Router();
var Char = require('../models/char');


/* GET Character Selection page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
  res.render('char_select', {title: 'Warmains'});
});

/* --------- CREATE NEW CHARACTER ---------
*  Creates a new character, storing it in the database in char collection.
*/
router.post('/', function(req, res, next) {
    var name = req.body.Name.toLowerCase();
    var char_class = req.body.pickclass.toLowerCase();
    var description = req.body.description.toLowerCase();

    // Making user enters information about the character.
    req.checkBody('Name', 'Enter a name for your character.').notEmpty();
    req.checkBody('Name',
    "Only use letters aA-zZ for your character's name please.").isAlpha();
    req.checkBody('Name',
    'Name must be between 2 and 12 characters long.').isLength({min:2, max:12});
    req.checkBody('pickclass',
    'Must choose a class.').isLength({min:1, max: undefined});
    req.checkBody('description',
    'Description cannot be longer than 255 characters.').isLength({min:0, max:255});

    var errors = req.validationErrors();

    if(errors){
        console.log(errors);
        res.render('char_select', {
            errors:errors
        });
    } else {

      Char.find({username: req.user.username, name: name},
        function (err, result) {
          if (err) {
            console.log(err);
            return res.status(500).send();
          }
          // user already has a character with that name
          if (result.length > 0) {
            //console.log(result);
            req.flash('error_msg', 'Already have a character named ' + name + '.');
            res.redirect('/character');
          } else {
            // Creates a new character and saves it.
            var newChar = new Char({
                username: req.user.username,
                name: name,
                class: char_class,
                description: description
            });
            Char.saveChar(newChar, function(err, char) {
                if(err) throw err;
                console.log(char);
            });

            req.flash('success_msg', name + ' created!');
            res.redirect('/character');
          }
        });
    }
});

/* GET Character Edit page. */
router.get('/profile/:username/:char', function(req, res) {
  res.render('char_edit', {
    title: 'Warmains - ' + req.params.char,
    char: req.params.char,
    username: req.params.username
  });
});

// Function to make sure user is logged in before viewing a page.
function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error_msg', 'You must be logged in first.');
        res.redirect('/');
    }
}

// Retrieve characters of logged in user from database.
// Primarily used for the character selection page.
router.get("/findall/", function(req, res) {
  console.log("Find all characters for current user.");
    Char.find({username: req.user.username},
        function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).send();
            }
            res.send(result);
            return res.status(200);
        });
});

/* --------- DELETE SELECTED CHARACTER ---------
 *  Delete the selected character in character selected page.
 */
router.post('/delete', function(req, res) {
  var uname = req.user.username;
  var char = req.body.char;

  Char.findOneAndRemove({username: uname, name: char}, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send();
    }
    req.flash('success_msg', char + ' has been deleted.');
    return res.redirect('/character');
  });
});

// Find a specific character using user's account name and name of character.
router.get("/findchar/", function(req, res) {
  Char.find({username: req.query.username, name: req.query.charname},
    function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).send();
      }
      res.send(result);
      return res.status(200);
    });
});

// Save an item to character in database.
router.post('/saveChar', function(req, res) {
  var charname = req.body.charname,
      user = req.user.username,
      char_post = req.body.char,
      gems_post = req.body.gems,
      enchants_post = req.body.enchants,
      talents_post = req.body.talents,
      points_post = req.body.points,
      glyphs_post = req.body.glyphs,
      spec = req.body.spec;

  Char.findOne({username: user, name: charname},
    function (err, char_db) {
      if (err) {
        console.log(err);
        return res.status(500).send();
      }
      // Loop through each slot and store in db
      for (var slot in char_post) {
        var item = char_post[slot],
            gems = gems_post[slot],
            enchant = enchants_post[slot],
            slot1 = slot.toLowerCase();
        char_db[slot1].item = item;
        char_db[slot1].gems = gems;
        char_db[slot1].enchant = enchant;
        char_db.spec = spec;
        char_db.talents = talents_post;
        char_db.points = points_post;
        char_db.glyphs = glyphs_post;
      }
      char_db.save(function(err) {
          if (err) throw err;
      });
    });
});

module.exports = router;
