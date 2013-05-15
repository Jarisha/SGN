/* Shared Config */
exports.CDN = 'http://1d0cd4fe9d04a622c153-67a9c5f20077a0cbea40c22fb907467d.r89.cf1.rackcdn.com';

/* Dev Config */
//Riak
exports.dev_db_host = '10.1.10.38';
exports.dev_db_port = 8100;
//exports.dev_ssl_path = 'C:/node/Q_SSL/';

exports.dev_temp_path = 'C:/Users/Tony/AppData/Local/Temp/';
exports.dev_log_path = 'C:/node/Q_LOG/';
exports.dev_host = 'localhost';
exports.dev_redis_host = '10.1.10.38';
exports.dev_nodeflake_host = '10.1.10.38';
exports.dev_port = '80';

/* Staging Config */
exports.staging_db_host = '127.0.0.1';
exports.staging_db_port = 8098;
exports.staging_ssl_path = '/var/lib/quyay/';

exports.staging_temp_path = '/tmp';
exports.staging_log_path = '/var/log/quyay/';
exports.staging_host = "api1.example.com";
exports.staging_redis_host = 'puppet.example.com';
exports.staging_nodeflake_host = '127.0.0.1';
exports.staging_port = '80';

/* Production Config */
//Riak
exports.production_db_host = '127.0.0.1';
exports.production_db_port = 8098;
exports.production_ssl_path = '/var/lib/quyay/';

exports.production_temp_path = '/tmp';
exports.production_log_path = '/var/log/quyay/';
exports.production_host = "www.quyay.com";
exports.production_redis_host = 'redis1.quyay.com';
exports.production_nodeflake_host = '127.0.0.1';
exports.production_port = '80';