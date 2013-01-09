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

describe("Parsnip HTTP Parsing Test Suite", function() {
    var should = require('should');
    var fs = require('fs');
    var parsnip = require('../index.js');


    var test_file_contents;
    
    before(function(done){
        test_file_contents = fs.readFileSync('test/raw_http_res.txt');
        done();
    });

    it("should handle passing a String instead of a Buffer as first argument.", function(done) {
        var result = parsnip.chop(test_file_contents.toString(), 200);

        result.should.not.be.an.instanceOf(Error);
        result.should.have.property('headers');
        result.should.have.property('body');

        var obj = JSON.parse(result.body);
        obj.should.have.property('hey', 5);

        result.headers.should.have.property('content-type', 'text/plain');
        result.headers.should.have.property('content-length', '9');

        done();
    });

    it("should parse HTTP response into Javascript object.", function(done) {
        var result = parsnip.parse(test_file_contents, 200);

        result.should.not.be.an.instanceOf(Error);
        result.should.have.property('headers');
        result.should.have.property('body');

        var obj = JSON.parse(result.body);
        obj.should.have.property('hey', 5);

        result.headers.should.have.property('content-type', 'text/plain');
        result.headers.should.have.property('content-length', '9');

        done();
    });

    it("should work using the '.chop()' alias too.", function(done) {
        var result = parsnip.chop(test_file_contents, 200);

        result.should.not.be.an.instanceOf(Error);
        result.should.have.property('headers');
        result.should.have.property('body');

        var obj = JSON.parse(result.body);
        obj.should.have.property('hey', 5);

        result.headers.should.have.property('content-type', 'text/plain');
        result.headers.should.have.property('content-length', '9');

        done();
    });
});
