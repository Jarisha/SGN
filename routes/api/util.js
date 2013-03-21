/****************************Utility functions****************************/
var request = require('request');
var url = require('url');

exports.validImg = function(req, res){
  request({ method: 'HEAD', url: req.body.url},
            function(err, response, body){
              if(err){
                return res.json({valid: false});
              }
              if(response.statusCode === 404){
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
//determine if youtube video is valid by analyzing url
//if valid, send back an <iframe> embed fragment, and image url
exports.validVideo = function(req, res){
  console.log(req.body);
  var embedHtml;
  var imgUrl;
  var youtubeId;
  request({ method: 'HEAD', url: req.body.url},
            function(err, response, body){
              if(err){
                return res.json({valid: false});
              }
              if(response.statusCode === 404){
                return res.json({valid: false});
              }
              if(response.statusCode === 200 && response.headers['content-type'].indexOf('text/html') !== -1){
                var urlObj = url.parse(req.body.url, true);
                if(urlObj.host !== 'youtu.be'){
                  return res.json({valid: false, error:'Not a youtube share link'});
                }
                var youtubeId = urlObj.pathname.split("/")[1];
                console.log(youtubeId);
                imgUrl = 'http://img.youtube.com/vi/'+ youtubeId +'/0.jpg';
                embedHtml = '<iframe width="200" height="200" src="http://www.youtube.com/embed/'+youtubeId+'" frameborder="0" allowfullscreen></iframe>';
                return res.json({valid: true, embed: embedHtml, url: imgUrl});
              }
              return res.json({valid: false});
            }
          );
}