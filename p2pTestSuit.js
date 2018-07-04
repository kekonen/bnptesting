// const request = require('request-promise').defaults({ simple: false });//.debug=true
// var req = require('request');
const Promise = require('bluebird')
const superagent = require('superagent')
const request = superagent.agent()
// var tough = require('tough-cookie');


const eprocLogin = process.env.eprocLOGIN;
const eprocPass  = process.env.eprocPASS;


var eproc = {
    mask: 'https',
    subdomain: 'eproc',
    host: 'opuscapita.com',
    port: 443,
    login: eprocLogin,
    pass: eprocPass,
    uri: function(append){
        return `${this.mask}://${this.subdomain}.${this.host}${![80,443].includes(this.port)?':'+this.port:''}/${append?append:''}`
    }
}


// function redirectOn302(body, response, resolveWithFullResponse) {
//     if (response.statusCode === 302) {
//         // Set the new url (this is the options object)
//         console.log('\n\n\n\n\n\n\n\n\n\n\n\n-----\n\n\n\n\n\n\n\n\n\n\n\n\/ \/ \/ \/');
//         console.log(response);
//         console.log('/\ /\ /\ /\ /\ /\\n\n\n\n\n\n\n\n\n\n\n\n-----\n\n\n\n\n\n\n\n\n\n\n\n');
//         // this.url = response.['the redirect url somehow'];
//         return request({uri: response.request.uri.href, resolveWithFullResponse:true})//{[`lol${Math.random()*100|1}`]: }//request(options);
//     } else {
//         console.log('\n\n\n\n\n\n\n\n\n\n\n\n-----\n\n\n\n\n\n\n\n\n\n\n\n\/ \/ \/ \/\n\n\n\n\n\n\n\n\n\n\n\n\/ \/ \/ \/\n\n\n\n\n\n\n\n\n\n\n\n\/ \/ \/ \/\n\n\n\n\n\n\n\n\n\n\n\n\/ \/ \/ \/\n\n\n\n\n\n\n\n\n\n\n\n\/ \/ \/ \/');
//         return resolveWithFullResponse ? response : body;
//     }
// }


console.log(`
///////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////  Welcome to '${eproc.uri()}', login: '${eproc.login}', pass: '${eproc.pass}'
///////////////////////////////////////////////////////////////////////////////////////////////////////////\n\n
`)

// var j = request.jar()

// var optionsOne = {
//     uri: eproc.uri('opc'),
//     method: 'GET',
//     followAllRedirects: true,
//     followRedirect:true,
//     withCredentials: true,
//     jar:j
//     // transform: redirectOn302
// }

// var promiseAnswer = request(optionsOne)//.auth(eproc.login,eproc.pass, false)
// lol = promiseAnswer

// var answerBody = await promiseAnswer;
// var SSOArtID = promiseAnswer.uri.query.substring(9);

// var optionsTwo = {
//     uri: `https://eproc.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}`,
//     method: 'POST',
//     jar: j,
//     followAllRedirects: true,
//     followRedirect:true,
//     withCredentials: true,

// }

var lol = ''

async function main() {
    lol= await request.get(eproc.uri('opc'))

    
    // var optionsOne = {
    //     uri: eproc.uri('opc'),
    //     method: 'GET',
    //     followAllRedirects: false,
    //     followRedirect: false,
    //     transform: redirectOn302
    // }

    // const loginPage = await request.get(optionsOne)
    // var promiseAnswer = request(optionsOne)//.auth(eproc.login,eproc.pass, false)
    // lol = promiseAnswer
    // // console.log(lol)
    // var answerBody = await promiseAnswer;
    // console.log(promiseAnswer);
    // var SSOArtID = promiseAnswer.uri.query.substring(9);


    // let cookieX = new tough.Cookie({
    //     key: "some_key",
    //     value: "some_value",
    //     domain: eproc.domain(),
    //     httpOnly: true,
    //     maxAge: 31536000
    // });
    // var cookiejar = request.jar();
    // cookiejar.setCookie(cookieX, eproc.uri());
    //             // var mycookie = ``;
    //             // var j = req.jar();
    //             // var urlX = eproc.uri('opc');
    //             // var cookieX = req.cookie("" + mycookie);
    //             // j.setCookie(cookie, urlX);

    // var optionsTwo = {
    //     uri: `https://eproc.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}`,
    //     method: 'POST',
    //     jar: cookiejar

    // }

    // console.log(loginPage)
    return true
}

(async () => await main())()

// const loginPage = await request.get(optionsOne)




// var lol = 'kek'
// (async () => {lol = request.get(eproc.uri('opc'))})()