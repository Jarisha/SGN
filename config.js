/* Shared Config */
exports.CDN = 'http://1d0cd4fe9d04a622c153-67a9c5f20077a0cbea40c22fb907467d.r89.cf1.rackcdn.com';

/* Dev Config */
//Riak
exports.dev_db_host = '10.1.10.23';
exports.dev_db_port = 8100;
exports.dev_ssl_path = 'C:/node/Q_SSL/';

exports.dev_temp_path = "C:/Users/Tony/AppData/Local/Temp/";
exports.dev_host = 'localhost';
exports.dev_redis_host = '10.1.10.23'
exports.dev_nodeflake_host = '10.1.10.23';
exports.dev_port = '80';


/*exports.dev_Fb_ID = "387033471379256";
exports.dev_Fb_Secret = "5481010ba4013aa2b1629de5f08b3a6b";
exports.tony_host = 'localhost';
exports.tony_Fb_ID = "313249415456863";
exports.tony_Fb_Secret = "cabb1ae80788c824000f0745a98575e4";*/

/* Production Config */
//Riak
exports.production_db_host = '127.0.0.1';
exports.production_db_port = 8098;
exports.produection_ssl_path = '/var/lib/quyay/';

exports.production_temp_path = '/tmp';
exports.production_host = "www.quyay.com";
exports.production_redis_host = 'redis1.quyay.com';
exports.production_nodeflake_host = '127.0.0.1';
exports.production_port = '80';