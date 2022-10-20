const speedTest = require('speedtest-net');
const { InfluxDB, Point } = require('@influxdata/influxdb-client')

//import token, org, bucket, url from .env file
require('dotenv').config()


// You can generate an API token from the "API Tokens Tab" in the UI
const token = process.env.INFLUXDB_TOKEN;
const org = process.env.INFLUXDB_ORG
const bucket = process.env.INFLUXDB_BUCKET

const client = new InfluxDB({ url: process.env.InfluxDB_URL, token: token })

const writeApi = client.getWriteApi(org, bucket);

async function runspeedtest() {
	try {
		await speedTest({ acceptLicense: true, acceptGdpr: true }).then(async s => {

			// console.log(s);
			download = JSON.parse(s.download.bandwidth);
			upload = JSON.parse(s.upload.bandwidth);
			ping = JSON.parse(s.ping.latency);
			resultid = s.result.id;
			// console.log(download, upload, ping);
			await writeData(download, upload, ping, resultid)

		}).catch(e => {
			console.error(e);
		});

	} catch (err) {
		console.log(err.message);
	} finally {
		process.exit(0);
	}
}

async function writeData(download, upload, ping, resultid) {
	writeApi.useDefaultTags({ host: 'speedtest' })
	const point1 = new Point('speed-test')
		.timestamp(new Date())
		.intField('download', download)
		.intField('upload', upload)
		.floatField('ping', ping)
		.stringField('resultid', resultid)

	writeApi.writePoint(point1)

	try {
		await writeApi.close()
		console.log('FINISHED - ' + new Date().toISOString())
		process.exit(0)

	} catch (e) {
		console.error(e)
		if (e instanceof HttpError && e.statusCode === 401) {
			console.log('InfluxDB database doesnt exist - please create one.')
		}
		console.log('\nFinished ERROR')
	}
}

runspeedtest();


process.on('exit', function (code) {
    return console.log(`Process to exit with code ${code}`);
});