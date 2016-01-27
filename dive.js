var needle = require('needle');
var express = require('express')
  , cors = require('cors')
  , fugu = express();
var bodyParser = require('body-parser');
fugu.set('port', (process.env.PORT || 5000))
fugu.use(cors());
fugu.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
fugu.use(bodyParser.json({limit: '50mb'}));
var fugu_api_router = express.Router();

fugu.get('/', function(req, res) {
  res.json({ message: 'Was up' });
});

fugu_api_router.post('/under', function (req, res) {
  console.log(req.body);
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  var photo = req.body.photo;

  needle.get('https://maps.googleapis.com/maps/api/elevation/json?locations='+latitude+','+longitude+'&key=AIzaSyCj44N7XnQUWo0EgS2tkW9qTSqSl-lMNxM', function(error, response) {
    try {
      var elevation = parseInt(response.body.results[0].elevation);
      var under = 10 - elevation;

      // create database entry

      // create image from base64

      // watermark image

      var coje = {
        'status': 200,
        'data': {
          'elevation': elevation,
          'under': under,
          'photo': 'photo'
        }
      }
    } catch (e) {
      var coje = {
        'status': 500,
        'data': {
          'error': e
        }
      }
    } finally {

    }

    res.json(coje);
  });

});

fugu_api_router.get('/process/image', function(req, res) {

  // create database entry

  // create image from base64

  // watermark image

  var image, watermarked;

  image = gd.open('dan.jpg');

  watermarked = image.watermark('wave.png', {x: 0.5, y: -1});

  watermarked = watermarked.watermark('info.png', {x: 1, y: 1});

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
  console.log("Node app is running at localhost:" + fugu.get('port'))
})
