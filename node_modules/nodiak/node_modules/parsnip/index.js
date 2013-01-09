// (The MIT License)

// Copyright (c) 2012 Nathan Aschbacher
// Copyright (c) 2012 Nathan LaFreniere

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// 'Software'), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var STATUS_CODES = require('http').STATUS_CODES;
var HTTPParser = process.binding('http_parser').HTTPParser;

function parse(faux_http, code) {
    var parser = new HTTPParser(HTTPParser.RESPONSE);
    var faux_response;

    faux_http = Buffer.isBuffer(faux_http) ? faux_http : new Buffer(faux_http);

    if(code !== undefined) {
        var h_buff = new Buffer("HTTP/1.1 "+code+" "+STATUS_CODES[code]+"\r\n");
        faux_http = Buffer.concat([h_buff, faux_http], h_buff.length + faux_http.length)
    }
    
    parser.onHeadersComplete = function(data) {
         faux_response = data;
         faux_response.headers = processHeaders(data.headers);
    };

    parser.onBody = function(buffer, head_len, body_len) {
        faux_response.body = buffer.slice(head_len);
    };

    parser.execute(faux_http, 0, faux_http.length);
    var parser_error = parser.finish();
    parser = null;

    if(parser_error) {
        return parser_error;
    }
    else if(faux_response === undefined) {
        var err = new Error("Parse Error");
        err.code = 'INVALID_HTTP_INPUT';
        err.bytesParsed = 0;

        return err;
    }
    else {
        return faux_response;
    }
}

function processHeaders(header_array) {
    var header_collection = {};
    for(var i = 0, length = header_array.length; i < length; i+=2) {
        header_collection[header_array[i].toLowerCase()] = header_array[i+1];
    }
    return header_collection;
}

exports.parse = parse;
exports.chop = exports.parse;