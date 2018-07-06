const superagent = require('superagent')
const {asyncForEach, asyncMap, wait} = require('./mylib')

const rp = superagent.agent().redirects(20);

const newAgent = () => superagent.agent().redirects(20);

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

var val1 = ''
var val2 = ''
var val3 = ''
var val4 = ''
var val5 = ''
var val6 = ''
var val7 = ''
var val8 = ''
var val9 = ''
var html1 = ''
var html2 = ''
var html3 = ''
var html4 = ''
var html5 = ''
var html6 = ''
var html7 = ''
var html8 = ''
var html9 = ''

var main = async () => {

    // Retrive first page to get Sessions
    var [j, SSOArtID] = await newAgent().
    get(eproc.uri('opc')).
    set('Connection', 'keep-alive').
    then(response => {
        var path = response.res.req.path
        const SSOArtID = path.substring(path.length-14,)

        var preciousCookie = response.header['set-cookie'][0].substring(0,64);
        var restCookies = response.request.cookies.split(';');

        var j = new CookieJar(restCookies)
        j.add(preciousCookie)

        console.log(` -> Sessions got, cookies:\n${j.string}\n`);
        return [j, SSOArtID]
    })


    var neu = newAgent();

    // Perform Auth
    var _ = await neu.
    post('https://p2p.opuscapita.com/josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id' + SSOArtID).
    set('Cookie', j.string).
    set('Connection', 'keep-alive').
    send('login-form_hf_0=').
    send('username=' + eproc.login).
    send('passwordFormGoup%3Apassword=' + eproc.pass).
    send('language=en').
    then(response => {
        console.log(' -> Authenticated\n')

        return true
    })

    var productKey = 'lap001_910-001246'; // Passing search
    var shortDescription = 'USB Mouse';  // Passing search

    // Add to cart
    var _ = await neu.
    post(eproc.uri(`opc/add2Cart/addToCartSimple?isAddFromSearch=true`)).
    send('productKey=' + productKey).
    send('isExternal=false').
    send('shortDesc=' + shortDescription).
    send('quantity=1').
    then(response => {
        console.log(` -> Added to cart: '${shortDescription}' with product key: ${productKey}\n`)

        return true
    })

    // Getting cart info
    var [salesOrderName, domainObjectId, salesOrderId, salesOrderItemKey] = await neu.
    get(eproc.uri('opc/shoppingCart/index?backUrl=')).
    then(response => {
        var html = response.res.text.toString()
        var salesOrderName = html.match(/name="salesOrderName" value="([^"]+)"/)[1]
        var domainObjectId = html.match(/name="id" value="([^"]+)"/)[1]
        var salesOrderId = html.match(/name="salesOrderId" value="([^"]+)"/)[1]
        var salesOrderItemKey = html.match(/name="salesOrderItemKey" value="([^"]+)"/)[1]

        console.log(` -> Opened cart, gethered info:\nsalesOrderName:${salesOrderName}\ndomainObjectId:${domainObjectId}\nsalesOrderId:${salesOrderId}\nsalesOrderItemKey:${salesOrderItemKey}\n-------\n\n`)
        return [salesOrderName, domainObjectId, salesOrderId, salesOrderItemKey]
    })

    // Ordering
    var toSend = await neu.
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
        var toSend = response.res.text.toString().match(/value='([^']+)'/)[1]
        console.log(` -> Order made, response: ${toSend}\n`)

        return toSend
    })

    // Gathering checkout info
    var [shoppingCartName, itemKeys] = await neu.
    post(eproc.uri('opc/checkout/show')).
    send('customValidationResult=' + toSend).
    then(response => {
        var html = response.res.text.toString()

        var shoppingCartName = html.match(/name="shoppingCartName_0" value="([^"]+)"/)[1]
        var itemKeys = html.match(/name="itemKeys_0" value="([^"]+)"/)[1]

        console.log(` -> Checkout info obtained:\nshoppingCartName:${shoppingCartName}\nitemKeys:${itemKeys}\n-------\n\n`)
        return [shoppingCartName, itemKeys]
    })

    // Authenticating eProc
    var eprocAuthRequest = newAgent()
    var _ = await eprocAuthRequest.
    get(eproc.uri(`proc`)).
    set('Cookie',  j.string)
    .then(response => {
        var newCookies = response.request.cookies.split(';').filter(cookie => !cookie.includes('JSESSIONID'))

        j.add(newCookies)
        console.log(` -> Authentification successfull, obtained cookies: ${newCookies.join(';')}\n`)
        return true
    })

    // Confirming order
    var eprocRegisteredRequest = newAgent();
    var requisitionId = await eprocRegisteredRequest.
    post(eproc.uri('opc/checkout/confirm')).
    set('Cookie', j.string).
    send('shoppingCartName_0=' + shoppingCartName).
    send('itemKeys_0=' + itemKeys).
    send('quantity' + salesOrderItemKey + '=1').
    send('checkout: Place an Order').
    then(response => {
        var requisitionId = response.res.req.path.match(/salesOrderId=([^/]+)/)[1]

        console.log(` -> Order placed, requisitionId: ${requisitionId}\n`);
        return requisitionId
    })



    // https://p2p.opuscapita.com/proc/orderAssignmentSecurity/checkCustomerAssignment?id=1672&onConfirm=%2FrequisitionStatus%2FshowDetails%2F1672%3Fuser%3DbnpTester%26sorting%3Dfalse%26isApprover%3D&objectType=salesOrder
    // Check customer assignment
    var answer = await eprocRegisteredRequest.
    get(eproc.uri('proc/orderAssignmentSecurity/checkCustomerAssignment')).
    query({
        'id': domainObjectId,
        onConfirm: `/requisitionStatus/showDetails/${domainObjectId}?user=${eproc.login}&sorting=false&isApprover=`,
        objectType: 'salesOrder'
    }).
    then(response => {
        var answer = response.res.text.toString();
        console.log(` -> Assignment exist: ${answer.isValid}`);
        return JSON.parse(answer);
    })

    if (!answer.isValid) throw new Error(answer)


    // get POs - PO's appear on the page not immidiately, so it may require some time
    await wait(3);
    var uniquePOs = null
    retriesLeft = 10
    while (retriesLeft) {
        try {
            await wait(3);
            uniquePOs = await eprocRegisteredRequest.
            get(eproc.uri('proc' + answer.onConfirm)).
            then(async (response) => {
                var html = await response.res.text.toString()
                var uniquePOs = html.match(/<a href="\/proc\/[^"]+">\r\n\s+(PO\d{9})\r\n\s+<\/a>/g).map(result => result.match(/PO\d{9}/)[0]).filter((v, i, a) => a.indexOf(v) === i);

                console.log(` -> Got PO's ${uniquePOs.join(',')}`);
                return uniquePOs
            })
            retriesLeft = 0
        } catch(e){
            retriesLeft -= 1
            console.log(`\n -> Ooops! Couldn't get POs. Tries left ${retriesLeft}\n`)
        }
    }
    
    if (uniquePOs == null) throw new Error('Unique POs are null')

    // Get transferIds
    await wait(15)
    var transactionIds = null
    retriesLeft = 10
    

    transactionIds = await asyncMap(uniquePOs, async (poId) => {
        var transactionId = null
        retriesLeft = 10

        while (retriesLeft) {
            try {
                await wait(3);
                var transactionId = await eprocRegisteredRequest.
                get(eproc.uri('proc/docTransfer/list')).
                query({
                    channel: 'erp',
                    sentBy: 'POCmlToBnpTransferJob',
                    communicationInfo: `*${poId}*`,
                    _action_list: 'Search',
                    status: 'all',
                    documentId: '',
                    start: '',
                    end: '',
                    documentClass: ''
                }).
                then(response => {
                    var html = response.res.text.toString()
                    val1 = response
                    html2 = html
                    var transactionId = html.match(/PO\d{9} is ([0-9a-z-]+)<\/td>/)[1]
                    
                    console.log(` -> Got transactionId: ${transactionId}`)

                    return transactionId
                    //<\/td>\r\n\s+<td>  
                })

                return transactionId
            } catch(e){
                retriesLeft -=1
                console.log(`\n -> Ooops! Couldn't get transactionIds. Tries left ${retriesLeft}\n`)
            }
        }
        

    })



    console.log(`\n\n -> FINISHED! requisitionId: ${requisitionId}, uniquePOs : ${uniquePOs.join(',')}, transactionIds: ${transactionIds.join(',')}`)

}


(async () => await main())()
