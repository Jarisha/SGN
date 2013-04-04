/* Configuration for services running on dev machine, should not change */
//Riak
exports.db_host = '10.1.10.23';
exports.db_port = 8100;

//Rackspace CDN Url
exports.CDN = 'http://1d0cd4fe9d04a622c153-67a9c5f20077a0cbea40c22fb907467d.r89.cf1.rackcdn.com';
//Redis
exports.redis_host = '10.1.10.23'
//Nodeflake
exports.nodeflake_host = '10.1.10.23';

/* Configuration for running Quyay web server, use localhost for development on
 *  personal computer.
 */
//Dev
exports.dev_host = 'localhost';
exports.dev_port = '80';
exports.dev_Fb_ID = "387033471379256";
exports.dev_Fb_Secret = "5481010ba4013aa2b1629de5f08b3a6b";
//path to temp folder where files/images are downloaded to
exports.temp_path = "C:/Users/Tony/AppData/Local/Temp/";

//Tony
exports.tony_host = 'localhost';
exports.tony_port = '443';
exports.tony_Fb_ID = "313249415456863";
exports.tony_Fb_Secret = "cabb1ae80788c824000f0745a98575e4";

/********************** Production Configuration *********************************/

//Riak
exports.production_db_host = '127.0.0.1';
exports.production_db_port = 8098;

//TODO: Facebook ID + Secret

//Configure tmp path to save tmp files before uploading to rackspace
exports.temp_path = "/tmp/";

//Web server hostname;
exports.production_host = "www.quyay.com";

//Rackspace CDN Url
exports.production_CDN = 'http://1d0cd4fe9d04a622c153-67a9c5f20077a0cbea40c22fb907467d.r89.cf1.rackcdn.com';
//Redis
exports.production_redis_host = 'redis1.quyay.com';
//Nodeflake
exports.production_nodeflake_host = '127.0.0.1';