// const request = require('request-promise').defaults({ simple: false });//.debug=true
// var req = require('request');
// const Promise = require('bluebird')
const superagent = require('superagent')

const request = superagent.agent().redirects(20)
// var tough = require('tough-cookie');


const eprocLogin = process.env.P2PLOGIN;
const eprocPass  = process.env.P2PPASS;


var eproc = {
    mask: 'https',
    subdomain: 'p2p',
    host: 'opuscapita.com',
    port: 443,
    login: eprocLogin,
    pass: eprocPass,
    uri: function(append){
        return `${this.mask}://${this.subdomain}.${this.host}${![80,443].includes(this.port)?':'+this.port:''}/${append?append:''}`
    }
}



console.log(`
///////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////  Welcome to '${eproc.uri()}', login: '${eproc.login}', pass: '${eproc.pass}'
///////////////////////////////////////////////////////////////////////////////////////////////////////////\n\n
`)


//     uri: `https://eproc.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}`,

var kek = ''
var lol = ''

var req = request.get(eproc.uri('opc')).
set('Connection', 'keep-alive').
then(response => {
        kek = response;
        var path = response.res.req.path
        const SSOArtID = path.substring(path.length-14,)

        console.log('=======================================================>',SSOArtID, eproc.login,eproc.pass);
        console.log('=======================================================>',path);
        console.log('=======================================================>',`https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}`);
        console.log('cookie =========================>', response.header['set-cookie'][0].substring(0,64));

        // https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?SSOArt=id4255FF912F78FA
        // https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}
        // response.redirects[4]

        request = request.jar.setCookie(response.header['set-cookie'][0].substring(0,64))
        console.log('request ============> ', request);
        // set('Cookie', response.header['set-cookie'][0].substring(0,64)). // .substring(0,64) 65


        request.post('https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id'+SSOArtID).
        set('Connection', 'keep-alive').
        send('login-form_hf_0=').
        send('username=Peter.Bedarf').
        send('passwordFormGoup%3Apassword=Peter.Bedarf').
        send('language=en').
        then(response => {
            lol = response;
        })
        
    })

// async function main() {
//     request.get(eproc.uri('opc'))
//     .set('Connection', 'keep-alive')
//     .then(response => {
//         kek = response;
//         var path = response.res.req.path
//         const SSOArtID = path.substring(path.length-14,)

//         console.log('=======================================================>',SSOArtID, eproc.login,eproc.pass);
//         console.log('=======================================================>',path);
//         console.log('=======================================================>',`https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}`);

//         // https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?SSOArt=id4255FF912F78FA
//         // https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}
//         // response.redirects[4]
//         request.post('https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id'+SSOArtID)
//         .set('Connection', 'keep-alive')
//         .send('login-form_hf_0=')
//         .send('username=Peter.Bedarf')
//         .send('passwordFormGoup%3Apassword=Peter.Bedarf')
//         .send('language=en')
//         // .send({
//         //     language: 'en',
//         //     username: eproc.login,
//         //     'passwordFormGoup%3Apassword': eproc.pass //%3A
//         // })
//         .then(response => {
//             lol = response;
//         })
        
//     })

    
//     return true
// }

// (async () => await main())()

// IDAU_TC_STATE=id-0c070134-b7c8-485c-a1b3-032b0de8d632; IDAU_SP-OPC-1547548472_STATE=id-22cc7d3a-94e5-4264-867d-8f29f0a8effc; IDAU_PROXY-IDP_STATE=id-8ac8c216-aee6-4978-a806-d10a497467b1; IDAU_PROXY-SP_STATE=id-880d6307-e357-49a1-8450-2955941aeab0; IDAU_IDP_STATE=id-1713b717-8eea-429c-891e-fc44a9590c40; JSESSIONID=id-53a2c9cc-5eca-4f8d-ad75-b3e0493e4de5.idbus-web-001; LANGUAGE_COOKIE_KEY=en



