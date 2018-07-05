// const request = require('request-promise').defaults({ simple: false });//.debug=true
// var req = require('request');
// const Promise = require('bluebird')
const superagent = require('superagent')

const rp = superagent.agent().redirects(20);

const newAgent = () => superagent.agent().redirects(20);

const request = superagent.agent().redirects(20)
// var tough = require('tough-cookie');


const eprocLogin = 'Peter.Bedarf' //process.env.P2PLOGIN;
const eprocPass  = 'Peter.Bedarf' //process.env.P2PPASS;


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

class CookieJar{
    constructor(cookies){
        this.cookies = {}
        this.add(cookies)
        // this.cookie_str_splitter = /[:](?=\s*[a-zA-Z0-9_\-]+\s*[=])/g
    }

    add(cookies){
        var typee = typeof(cookies)
        if (typee == 'object') {
            if (Array.isArray(cookies)) {
                cookies.forEach(cookie => {
                    console.log('->',cookie)
                    var [cookieName, cookieValue] = cookie.split('=')
                    this.cookies[cookieName] = cookieValue
                })
            } else {
                Object.keys(cookies).forEach(cookieName => {
                    this.cookies[cookieName] = cookies[cookieName]
                })
            }
            
        } else if (typee == 'string'){
            this.add(cookies.split(';'))
        }
    }

    get string(){
        return Object.entries(this.cookies).map(entry => entry.join('=')).join(';')
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
var hui = ''
var chlen = ''
var pizda = ''
var kakashka = ''
var govno = ''
var shluha = ''

// Retrive first page to get Sessions
var req = newAgent().get(eproc.uri('opc')).
set('Connection', 'keep-alive').
then(response => {
        kek = response;
        var path = response.res.req.path
        const SSOArtID = path.substring(path.length-14,)

        var preciousCookie = response.header['set-cookie'][0].substring(0,64);
        var restCookies = response.request.cookies.split(';');

        var j = new CookieJar(restCookies)
        j.add(preciousCookie)

        // console.log('=======================================================>',SSOArtID, eproc.login,eproc.pass);
        // console.log('=======================================================>',path);
        // console.log('=======================================================>',`https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}`);
        // console.log('cookie =========================>', response.header['set-cookie'][0].substring(0,64));

        // https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?SSOArt=id4255FF912F78FA
        // https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id${SSOArtID}
        // response.redirects[4]

        // request.jar.setCookie()
        // console.log('request ============> ', request.jar.getCookies());
        // set('Cookie', response.header['set-cookie'][0].substring(0,64)). // .substring(0,64) 65

        // request.jar.setCookie(preciousCookie,eproc.host, '/')
        var neu = newAgent();

        // Perform Auth
        neu.
        post('https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id'+SSOArtID).
        set('Cookie', j.string).
        set('Connection', 'keep-alive').
        send('login-form_hf_0=').
        send('username=Peter.Bedarf').
        send('passwordFormGoup%3Apassword=Peter.Bedarf').
        send('language=en').
        then(response => {
            lol = response;
            // console.log(response)

            var preciousCookies = response.request.cookies
            j.add(preciousCookie)

            // Add to cart
            neu.
            post(eproc.uri(`opc/add2Cart/addToCartSimple?isAddFromSearch=true`)).
            send('productKey=lap001_910-001246').
            send('isExternal=false').
            send('shortDesc=USB Mouse').
            send('quantity=1').
            then(response => {
                hui = response
                neu.
                get(eproc.uri('opc/shoppingCart/index?backUrl=')).
                then(response => {
                    chlen=response
                    var html = response.res.text.toString()
                    var salesOrderName = html.match(/name="salesOrderName" value="([^"]+)"/)[1]
                    var domainObjectId = html.match(/name="id" value="([^"]+)"/)[1]
                    var salesOrderId = html.match(/name="salesOrderId" value="([^"]+)"/)[1]
                    var salesOrderItemKey = html.match(/name="salesOrderItemKey" value="([^"]+)"/)[1]

                    console.log('CHLEN---------------------------------')
                    console.log('opc/shoppingCart/order')
                    console.log('salesOrderName=' + salesOrderName)
                    console.log('id=' + domainObjectId)
                    console.log('salesOrderId=' + salesOrderId)
                    console.log('productKey=' + 'lap001_910-001246')
                    console.log('salesOrderItemKey=' + salesOrderItemKey)
                    console.log('quantity' + salesOrderItemKey + '=1')


                    neu.
                    post(eproc.uri('opc/shoppingCart/order')).
                    send('salesOrderName=' + salesOrderName).
                    send('id=' + domainObjectId).
                    send('salesOrderId=' + salesOrderId).
                    send('productKey=' + 'lap001_910-001246').
                    send('salesOrderItemKey=' + salesOrderItemKey).
                    send('quantity' + salesOrderItemKey + '=1').
                    send('_isService=').
                    send('backUrl=').
                    send('hasShoppingCartErrors=false').
                    send('shortDesc=USB Mouse').
                    send('itemId=').
                    then(response => {
                        pizda = response

                        var toSend = response.res.text.toString().match(/value='([^']+)'/)[1]
                        
                        neu.
                        post(eproc.uri('opc/checkout/show')).
                        send('customValidationResult='+toSend).
                        then(response => {

                            var html = response.res.text.toString()

                            // <input type="hidden" name="shoppingCartName_0" value="Cart(2018-07-05)" id="shoppingCartName_0" />
                            // <input type="hidden" name="itemKeys_0" value="1859,1863" id="itemKeys_0" />

                            var shoppingCartName = html.match(/name="shoppingCartName_0" value="([^"]+)"/)[1]
                            var itemKeys = html.match(/name="itemKeys_0" value="([^"]+)"/)[1]


                            console.log('Govno---------------------------------')
                            console.log('shoppingCartName_0=' + shoppingCartName)
                            console.log('itemKeys_0=' + itemKeys)
                            console.log('quantity' + salesOrderItemKey + '=1')
                            console.log('checkout: Place an Order')

                            govno = html

                            var eprocRequest = newAgent()
                            eprocRequest.
                            get(eproc.uri(`proc`)).
                            set('Cookie',  j.string)
                            .then(response => {
                                shluha = response
                                var newCookies = response.request.cookies.split(';').filter(cookie => !cookie.includes('JSESSIONID'))

                                j.add(newCookies)
                                console.log(j)

                                enchancedRequest = newAgent();

                                enchancedRequest.
                                post(eproc.uri('opc/checkout/confirm')).
                                set('Cookie', j.string).
                                send('shoppingCartName_0=' + shoppingCartName).
                                send('itemKeys_0=' + itemKeys).
                                send('quantity' + salesOrderItemKey + '=1').
                                send('checkout: Place an Order').
                                then(response => {
                                    kakashka = response
                                })

                            })

                            // neu.
                            // get(eproc.uri(`proc/approvalWorkflow/startWorkflow/${domainObjectId}`)).
                            // then(response => {
                            //     shluha = response
                            //     coolLink = response.redirects[0]
                            //     newCookieValue = coolLink.substring(coolLink.length-32)
                            //     anotherCookieDirty = response.header['set-cookie'][0]
                            //     another.clean

                            //     neu.
                            //     post(eproc.uri('opc/checkout/confirm')).
                            //     send('shoppingCartName_0=' + shoppingCartName).
                            //     send('itemKeys_0=' + itemKeys).
                            //     send('quantity' + salesOrderItemKey + '=1').
                            //     send('checkout: Place an Order').
                            //     then(response => {
                            //         kakashka = response
                            //     })
                            // })

                            
                        })


                        
                    })
                })
            })

        })
        
    })

