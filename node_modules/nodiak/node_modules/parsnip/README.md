## Overview

This project was born out of a desire to have a stable, reliable, and fast HTTP parser available for ad-hoc use.

Parsnip uses the same native C parser that node.js's HTTP module does.

## Installation

    $ npm install parsnip

## Usage
####Parsnip.parse( *raw_http_data, [http_code]* )

Given the following raw_http_data (as String of Buffer):

```
HTTP/1.1 200 OK
Date: Mon, 19 Jul 2004 16:18:20 GMT
Server: Apache
Last-Modified: Sat, 10 Jul 2004 17:29:19 GMT
ETag: "1d0325-2470-40f0276f"
Content-Length: 9
Connection: close
Content-Type: text/plain

{"hey":5}
```

You can parse it using:

```
var parsnip = require('parsnip');

var all_parsed = parsnip.parse(raw_http_data);
console.log(all_parsed);
```

>```
{
    headers: {
        date: 'Mon, 19 Jul 2004 16:18:20 GMT',
        server: 'Apache',
        'last-modified': 'Sat, 10 Jul 2004 17:29:19 GMT',
        etag: '"1d0325-2470-40f0276f"',
        'content-length': '9',
        connection: 'close',
        'content-type': 'text/plain'
    },
    statusCode: 200,
    versionMajor: 1,
    versionMinor: 1,
    shouldKeepAlive: false,
    upgrade: false,
    body: < Buffer 7b 22 68 65 79 22 3a 35 7d 0d 0a >
}
>```

Additionally, the optional `http_code` parameter is for the case when your `http_raw_data` does not include a first protocol line, such as `HTTP/1.1 200 OK`.  

By passing in an `http_code` value the proper protocol line will be added to the beginning of the `http_raw_data` before parsing begins.  If you set `http_code` to `404` the line `HTTP/1.1 404 Object Not Found` would be inserted at the beginning of your `http_raw_data` value.  

This can be useful when using parsnip to process _'multipart/mixed'_ segments where each segment is missing the protocol line at the start.

>***NOTE:***  `Parsnip.chop()` is a usable alias for `Parsnip.parse()`.  Why?  Because it amuses me.  `:-P` 

## Tests

The test suite can be run by simply:

    $ cd /path/to/parsnip
    $ npm install -d
    $ npm test

## License

(The MIT License)

Copyright (c) 2012 Nathan Aschbacher

Copyright (c) 2012 Nathan LaFreniere

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the 'Software'), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.