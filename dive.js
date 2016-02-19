var needle = require('needle');
var express = require('express')
  , cors = require('cors')
  , path = require('path')
  , fugu = express();
var bodyParser = require('body-parser');
var gd = require('easy-gd');
var replace = require("replace");
var randomString = require('random-string');
var fs = require('fs');
var mysql = require('mysql');
var moment = require('moment');

var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : 'mia_underwater'
});

db.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + db.threadId);
});


fugu.set('port', (process.env.PORT || 5000))
fugu.use(cors());
fugu.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
fugu.use(bodyParser.json({limit: '50mb'}));
fugu.use(express.static('/public'));
fugu.use(express.static(path.join(__dirname, '/public')));

var fugu_api_router = express.Router();

fugu.get('/', function(req, res) {
  res.json({ message: 'Was up' });
});

fugu_api_router.post('/create/user', function (req, res) {
  var UUID = req.body.UUID;
  var timestamp = moment().format('YY-MM-DD hh:mm:ss');

  db.query('SELECT * FROM users WHERE UUID=? LIMIT 1', [UUID], function(err, result) {
    if (result[0]) {
      var coje = {
        'status': 200,
        'data': {
          'user_id': result[0].id,
          'UUID': result[0].UUID
        }
      }

      res.json(coje);
    } else {
      db.query('INSERT INTO users SET ?', {UUID: UUID, created_at: timestamp, updated_at: timestamp}, function(err, result) {
        if (err) {
          var coje = {
            'status': 500,
            'data': {
              'error': err
            }
          }
        } else {
          var coje = {
            'status': 200,
            'data': {
              'user_id': result.insertId,
              'UUID': UUID
            }
          }
        }

        res.json(coje);
      });
    }
  });
});

fugu_api_router.post('/under', function (req, res) {
  // console.log(req.body);
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  var photo = req.body.photo;
  var user_id = req.body.user_id;
  var timestamp = moment().format('YY-MM-DD hh:mm:ss');

  needle.get('https://maps.googleapis.com/maps/api/elevation/json?locations='+latitude+','+longitude+'&key=AIzaSyCj44N7XnQUWo0EgS2tkW9qTSqSl-lMNxM', function(error, response) {
    // try {
      var elevation = parseInt(response.body.results[0].elevation);
      var under = 10 - elevation;

      var story_id = randomString({
        length: 15,
        numeric: true,
        letters: true,
        special: false
      });

      if (elevation > 10) {
        under = 'safe';
      }

      // create database entry

      // create image from base64
      var base64Data = photo.replace(/^data:image\/png;base64,/, "");

      fs.writeFile("public/"+story_id+".png", base64Data, 'base64', function(err) {
        if (err) {
          console.log(err);
        } else {
          var image, watermarked;
          image = gd.open("public/"+story_id+".png");
          console.log(image);
          watermarked = image.watermark('wave.png', {x: 0.2, y: -0.2});
          watermarked = watermarked.watermark('info.png', {x: 0.9, y: 0.9});
          watermarked.save("public/"+story_id+"_story.png");
          // watermarked.save("public/"+story_id+".png");
        }
      });

      var photo_original = "http://192.168.6.120:5000/"+story_id+".png";
      var photo_story = "http://192.168.6.120:5000/"+story_id+"_story.png";

      // save to database
      db.query('INSERT INTO stories SET ?', {user_id: user_id, story_id: story_id, elevation: elevation, under: under, latitude: latitude, longitude: longitude, photo_original: photo_original, photo_story: photo_story, created_at: timestamp, updated_at: timestamp}, function(err, result) {
        if (err) {
          var coje = {
            'status': 500,
            'data': {
              'error': err
            }
          }
        } else {
          var coje = {
            'status': 200,
            'data': {
              'elevation': elevation,
              'under': under,
              'photo': photo_story
            }
          }
        }

        res.json(coje);
      });

    // } catch (e) {
    //   var coje = {
    //     'status': 500,
    //     'data': {
    //       'error': e
    //     }
    //   }
    // } finally {

    // }

    // res.json(coje);
  });

});

fugu_api_router.get('/process/image', function(req, res) {

  // create database entry

  // create image from base64

  // watermark image

  var image, watermarked;

  image = gd.open('dan.jpg');

  watermarked = image.watermark('wave.png', {x: 0.5, y: -1});

  watermarked = watermarked.watermark('info.png', {x: 0.5, y: 0.5});

  watermarked.save('watermarked.jpg');

  // return json dump with data

  var coje = {
    'status': 200,
    'data': {
      'elevation': elevation,
      'under': under
    }
  };

  res.json(coje);
});

fugu.use('/api', fugu_api_router);

fugu.listen(fugu.get('port'), function() {
  console.log("MIA is running at localhost:" + fugu.get('port'))
})
