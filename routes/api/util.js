/****************************Utility functions****************************/
var url = require('url');
var request = require('request');
var util = require('../../utility');
var app = require('../../app');

exports.validImg = function(req, res){
  request({ method: 'HEAD', url: req.body.url},
            function(err, response, body){
              if(err){
                console.log('validImg error: ' + err);
                return res.json({valid: false});
              }
              if(response.statusCode === 404){
                console.log('image not found: ');
                return res.json({valid: false});
              }
              if(response.statusCode === 200 && (
                 response.headers['content-type'] === 'image/png' ||
                 response.headers['content-type'] === 'image/gif' ||
                 response.headers['content-type'] === 'image/jpeg')
                ){
                console.log(response.headers['content-type']);
                return res.json({valid: true, contentType: response.headers['content-type'] });
              }
              return res.json({valid: false});
            }
          );
}

//determine if youtube video is valid by doing HEAD request to URL
//if valid, send back an <iframe> embed fragment, and image url
exports.validVideo = function(req, res){
  console.log(req.body);
  var embedHtml;
  var imgUrl;
  var youtubeId;
  request({ method: 'HEAD', url: req.body.url},
            function(err, response, body){
              if(err){
                console.log('validVideo error: ' + err);
                return res.json({valid: false});
              }
              if(response.statusCode === 404){
                console.log('youtube video not found');
                return res.json({valid: false});
              }
              if(response.statusCode === 200 && response.headers['content-type'].indexOf('text/html') !== -1){
                var urlObj = url.parse(req.body.url, true);
                if(urlObj.host !== 'youtu.be'){
                  return res.json({valid: false, error:'Not a youtube share link'});
                }
                //extract ID, only works for newer youtube share links. TODO: Extract IDs for older youtube videos
                var youtubeId = urlObj.pathname.split("/")[1];
                imgUrl = 'http://img.youtube.com/vi/'+ youtubeId +'/0.jpg';
                embedHtml = '<iframe width="200" height="200" src="http://www.youtube.com/embed/'+youtubeId+'" frameborder="0" allowfullscreen></iframe>';
                return res.json({valid: true, embed: embedHtml, url: imgUrl});
              }
              //errlog.info('video not returned with 200 response code: ' + response);
              return res.json({valid: false});
            }
          );
}

/***** get all entries and convert them to new schema *****/
exports.reindexGamepins = function(req, res){
  console.log("reindex Gamepins");
  
}
exports.reindexUsers = function(req, res){
  console.log("reindex Users");
}

exports.reindexComments = function(req, res){
  console.log("reindex Comments");
}