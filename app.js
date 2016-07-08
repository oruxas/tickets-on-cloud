/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var shortid = require('shortid');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

//--------------------------------------
// Let's go
//--------------------------------------

// create app
var app = express();

// setup app environment
app.set('port', process.env.PORT || 3000); //sets port approperate to environment (3000 for localhost)
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // for parsing application/json

app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// for development only
if ('development' == app.get('env')) {
	app.use(errorHandler());
}

var db; // data base variable
var cloudant // instance of cloudant 
var dbCredentials = {
	dbName : 'my_sample_db'
};

// instantiate database (by default to db variable)
initDBConnection();

//--------------------------------------
// Utilities
//--------------------------------------
function initDBConnection() {
	
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		// Pattern match to find the first instance of a Cloudant service in
		// VCAP_SERVICES. If you know your service key, you can access the
		// service credentials directly by using the vcapServices object.
		for(var vcapService in vcapServices){
			if(vcapService.match(/cloudant/i)){
				dbCredentials.host = vcapServices[vcapService][0].credentials.host;
				dbCredentials.port = vcapServices[vcapService][0].credentials.port;
				dbCredentials.user = vcapServices[vcapService][0].credentials.username;
				dbCredentials.password = vcapServices[vcapService][0].credentials.password;
				dbCredentials.url = vcapServices[vcapService][0].credentials.url;
				
				// Initialize cloudant library with my account. 
				cloudant = require('cloudant')(dbCredentials.url);
				
				// check if DB exists if not create
				cloudant.db.create(dbCredentials.dbName, function (err, res) {
					if (err) { console.log('could not create db ', err); }
				});
				// use existing data base
				db = cloudant.db.use(dbCredentials.dbName);
				break;
			}
		}
		if(db==null){
			console.warn('Could not find Cloudant credentials in VCAP_SERVICES environment variable - data will be unavailable to the UI');
		}
	} else{
		// For running this app locally you can get your Cloudant credentials 
		// from Bluemix (VCAP_SERVICES in "cf env" output or the Environment 
		// Variables section for an app in the Bluemix console dashboard).
		// Alternately you could point to a local database here instead of a 
		// Bluemix service.
		dbCredentials.host = "1b2002ce-86d2-485d-8544-8b1176d03e78-bluemix.cloudant.com";
		dbCredentials.port = 443;
		dbCredentials.user = "1b2002ce-86d2-485d-8544-8b1176d03e78-bluemix";
		dbCredentials.password = "3b640e2414f4458b0cae634db288bcc6ae6636d513306ff6a0f7a8b4147df8ec";
		dbCredentials.url = "https://1b2002ce-86d2-485d-8544-8b1176d03e78-bluemix:3b640e2414f4458b0cae634db288bcc6ae6636d513306ff6a0f7a8b4147df8ec@1b2002ce-86d2-485d-8544-8b1176d03e78-bluemix.cloudant.com";
		
		cloudant = require('cloudant')(dbCredentials.url);
		
		// use existing data base
		db = cloudant.db.use(dbCredentials.dbName);

		if (db==null){
			console.warn('VCAP_SERVICES environment variable not set - data will be unavailable to the UI');
		}else{
			console.warn('DB status: connected to ' + dbCredentials.dbName);
		}
	}

	cloudant.db.list(function(err, allDbs) {
		console.log('All my databases: %s', allDbs.join(', '))
	});
};

function createResponseData(id, name, ticketData, attachments) {
	var responseData = {
		id : id,
		name : name,
		ticketData : ticketData,
		attachments : []
	};

	attachments.forEach (function(item, index) {
		var attachmentData = {
			content_type : item.type,
			key : item.key,
			url : '/api/tickets/attach?id=' + id + '&key=' + item.key
		};
		responseData.attachements.push(attachmentData);
	});
	
	return responseData;
};

// Routing
app.get('/', function(req, res){
	res.send('index.html');
});

app.get('/api/test/server', function(req, res){
	res.send('Tessstiiing')
	res.end();
}); 

app.post('/api/new-ticket/submit', function(req, res){
	console.log('[Server]: request data:'+ JSON.stringify(req.body));
	var ticket = req.body;
	// add unique id
	ticket.id = shortid.generate();
	// Push Ticket data to DB
	var docName = 'Ticket';
	var docDesc = 'A sample ticket';
	db.insert({
		name: docName,
		value : docDesc,
		data : ticket
	},'', function(err, doc) {
		if (err) {
			console.log('[DB error]: ' + err);
		} else {
			console.log('[DB]: document inserted -> ' + JSON.stringify(doc));
			res.send('Your ticket has been submited.'); // better to use Post/Redirect/Get pattern
		}
	});// End document insert
});

app.get('/api/fetch/tickets', function(req, res){
	
	var docList = []; 
	var count = 0;
	// Query all documents from DB
	console.log('[DB]: listing all documents...');
	db.list(function(err, body){
		if (err) {
			console.log('[DB error] ' + err);
		} 
		else {
			var len = body.rows.length;
			console.log('[DB]: Success! Total of docs -> ' + len);
			if (len == 0) {
				res.send('No tickets found.');
			} else {
				// Fetch data of all Tickets
				body.rows.forEach(function(document) {
					db.get(document.id, { revs_info: false }, function(err, doc) {
						if (err) {
							console.log('[DB error]: ' + err);
						} else {

							if (doc['_attachments']) {

								var attachments = [];
								for(var attribute in doc['_attachments']){
								
									if(doc['_attachments'][attribute] && doc['_attachments'][attribute]['content_type']) {
										attachments.push({"key": attribute, "type": doc['_attachments'][attribute]['content_type']});
									}
									console.log(attribute+": "+JSON.stringify(doc['_attachments'][attribute]));
								}
							
								var responseData = createResponseData(
									doc._id,
									doc.name,
									doc.data,
									attachments);
							} else {
								var responseData = createResponseData(
									doc._id,
									doc.name,
									doc.data,
									[]);
							}

							docList.push(responseData);
							count++;
							if (count >= len) {
								res.write(JSON.stringify(docList));
								console.log('[Server]: ending response...');
								res.end();
							}	
						}// end else
					});// end db.get
				});// end forEach
			}// end else
		}// end else
	});// end db.list
});// end app.get


app.listen(app.get('port'), '0.0.0.0', function() {
	console.log('Express app listening on port ' + app.get('port'));
});

