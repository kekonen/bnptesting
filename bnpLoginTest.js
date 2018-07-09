const superagent = require ('superagent');
const assert = require('assert');

const config = {
    host: "stage.businessnetwork.opuscapita.com",
    port: 443,
    scheme: "https",
    username: "scott.tiger@example.com",
    password: "test",
    languageId: "en"
}

run();

function run() {
    let agent = superagent.agent(); // to persist cookies across calls
    login(config, agent)
    .then( () => testcall(config, agent) );
}

function getBaseURL(config) {
  return config.scheme + "://" + config.host + ":" + config.port;
}

async function testcall(config, request) {
    let response = null;

    try {
        response = await request.get("https://schindler-test.opuscapita.com/ssm/standardWorkflow?customerId=schindler-SCH-PO5400").redirects(0).ok(res => res.status == 200);
        console.log("testcall result: ", response.body);
    }
    catch(err) {
        console.error("error in get testcall: ", err);
        throw err;
    }
}

async function login(config, request) {

    let response = null;

    try {
        response = await request.get(getBaseURL(config) + "/bnp").redirects(1).ok(res => res.status == 302);
    }
    catch(err) {
        console.error("error in get /bnp: ", err);
        throw err;
    }

    let interactionURL = response.headers.location;
    console.log("interactionURL: ", interactionURL);


    let interactionId = interactionURL.substring(interactionURL.lastIndexOf('/')+1, interactionURL.length);
    console.log("interactionId: ", interactionId);

    try {
        response = await request.post(getBaseURL(config) + interactionURL + "/login")
            .send('uuid=' + interactionId)
            .send('lang=' + config.languageId)
            .send('login=' + config.username)
            .send('password=' + config.password)
            .send('submit=Sign-in')
            .redirects(2)
            .ok(res => res.status == 302);
        console.log("response after login: ", response.headers.location);
    }
    catch(err) {
        console.error("error in POST " + getBaseURL(config) + interactionURL + "/login", err);
        throw err;
    }



}