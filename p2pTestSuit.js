const superagent = require('superagent')
const {asyncMap, wait, retry} = require('./mylib')


const newAgent = () => superagent.agent().redirects(20);



const eprocLogin = process.env.P2PLOGIN;
const eprocPass  = process.env.P2PPASS;
const stageAdminLogin = process.env.STAGEADMINLOGIN;
const stageAdminPass  = process.env.STAGEADMINPASS;
const stageSupplierLogin = process.env.STAGESUPPLIERLOGIN;
const stageSupplierPass  = process.env.STAGESUPPLIERPASS;

class AccessConfig {
    constructor(init) {
        this.scheme = init.scheme?init.scheme: 'https'
        this.subdomain = init.subdomain?init.subdomain: 'stage.businessnetwork'
        this.host = init.host?init.host: 'opuscapita.com'
        this.port = init.port?init.port: 443
        this.login = init.login?init.login: 'test' 
        this.pass = init.pass?init.pass: 'test' 
        this.language = init.language?init.language: 'en'
    }

    uri(append){
        if (append && append[0] == '/') append = append.substring(1)
        return `${this.scheme}://${this.subdomain}.${this.host}${![80,443].includes(this.port)?':'+this.port:''}/${append?append:''}`
    }
}

var eproc = new AccessConfig({
    scheme: 'https',
    subdomain: 'p2p',
    host: 'opuscapita.com',
    port: 443,
    login: eprocLogin,
    pass: eprocPass,
    language: 'en'
})

var stageAdmin = new AccessConfig({
    scheme: 'https',
    subdomain: 'stage.businessnetwork',
    host: 'opuscapita.com',
    port: 443,
    login: stageAdminLogin,
    pass: stageAdminPass,
    language: 'en'
})

var stageSupplier = new AccessConfig({
    scheme: 'https',
    subdomain: 'stage.businessnetwork',
    host: 'opuscapita.com',
    port: 443,
    login: stageSupplierLogin,
    pass: stageSupplierPass,
    language: 'en'
})


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


var createOrderEProc = async (eproc) => {
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
    send('language=' + eproc.language).
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



    // Check customer assignment
    var answer = await eprocRegisteredRequest.
    get(eproc.uri('proc/orderAssignmentSecurity/checkCustomerAssignment')).
    query({
        'id': domainObjectId,
        onConfirm: `/requisitionStatus/showDetails/${domainObjectId}?user=${eproc.login}&sorting=false&isApprover=`,
        objectType: 'salesOrder'
    }).
    then(response => {
        var answer = JSON.parse(response.res.text.toString());
        console.log(` -> Assignment exist: ${answer.isValid}`);
        return answer;
    })

    if (!answer.isValid) throw new Error(answer)


    // get POs - PO's appear on the page not immidiately, so it may require some time
    var uniquePOs = await retry(async () => {
        return await eprocRegisteredRequest.
            get(eproc.uri('proc' + answer.onConfirm)).
            then(async (response) => {
                var html = await response.res.text.toString()
                var uniquePOs = html.match(/<a href="\/proc\/[^"]+">\r\n\s+(PO\d{9})\r\n\s+<\/a>/g).map(result => result.match(/PO\d{9}/)[0]).filter((v, i, a) => a.indexOf(v) === i);

                console.log(` -> Got POs ${uniquePOs.join(',')}`);
                return uniquePOs
            })
    },
        {
            attempts:10,
            waitBetween:3,
            waitBefore:3
        }
    )
    
    if (!uniquePOs) throw new Error('Unique POs are null')

    // Get transferIds
    var transactionIds = await asyncMap(uniquePOs, async (poId) => {
        return await retry(async () => {
            return await eprocRegisteredRequest.
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
        }, {
            attempts:10, 
            waitBetween:4, 
            waitBefore:15
        })
    })



    console.log(`\n\n -> FINISHED! requisitionId: ${requisitionId} , uniquePOs : ${uniquePOs.join(',')} , transactionIds: ${transactionIds.join(',')}`)
    return [requisitionId, uniquePOs, transactionIds]
}


// (async () => await createOrderProc(eproc))()

var checkTIDinTNT = async (stage, transactionId) => {
    var answer = await stage.agent.get(stage.uri(`tnt/api/events/${transactionId}`)).then(response => response.body)
    return answer[0];
}

var checkSalesOrderPO = async (stage, PO) => {
    var {customerId, orderNumber} = await stage.agent.get(stage.uri(`sales-order/api/sales-orders/hard001?orderNumber=%${PO}%`)).then(response => response.body[0])

    var answer = await stage.agent.get(stage.uri(`sales-order/api/sales-orders/hard001/${customerId}/${orderNumber}`))
    .then(async (response) => await response.body)
    return answer['salesOrder'];
}

var confirmPO = async (stage, POdata) => {
    var update = {
        type: 'orderConfirmation',
        versionNumber: 'v2',
        status: 'confirmed',
        changedBy: 'BNP tester',
        changedOn: (new Date()).toISOString(),
    }

    Object.assign(POdata, update)

    var answer = await stage.agent.put(stage.uri(`sales-order/api/sales-orders/hard001/${POdata.customerId}/${POdata.orderNumber}`))
    .set('Content-Type', 'application/json')
    .send(JSON.stringify(POdata))
    .then(response => response.body)
    return answer['salesOrder'];
}

var loginStage = async (config) => {

    console.log(' -> Starting Login ' + config.uri())
    
    var testcall = async (config, request) => {
        var response = null;
    
        try {
            response = await request.get('https://stage.businessnetwork.opuscapita.com/sales-order/api/sales-orders/hard001?orderNumber=%PO180000349%').redirects(10);
            return true;
        } catch(err) {
            console.error("error in get testcall: ", err);
            throw err;
        }
    }
    
    var logon = async (config, request) => {
        let response = null;
    
        try {
            response = await request.get(config.uri('bnp')).redirects(1).ok(res => res.status == 302);
        }catch(err) {
            console.error("error in get /bnp: ", err);
            throw err;
        }
    
        let interactionURL = response.headers.location;
        console.log("interactionURL: ", interactionURL);
    
    
        let interactionId = interactionURL.substring(interactionURL.lastIndexOf('/')+1, interactionURL.length);
        console.log("interactionId: ", interactionId);
    
        try {
            response = await request.post(config.uri(interactionURL + "/login"))
                .send('uuid=' + interactionId)
                .send('lang=' + config.languageId)
                .send('login=' + config.login)
                .send('password=' + config.pass)
                .send('submit=Sign-in')
                .redirects(10)
            return request
        }catch(err) {
            console.error("error in POST " + config.uri(interactionURL + "/login: ") , err);
            throw err;
        }
    
    }

    let agent = superagent.agent(); // to persist cookies across calls
    var confirmed = await logon(config, agent)
    .then( async () => {return await testcall(config, agent)} );


    if (confirmed) return agent;
    return false

}


var main = async () => {
    // var [requisitionId, uniquePOs, transactionIds] = await createOrderEProc(eproc);
    var [requisitionId, uniquePOs, transactionIds] = await createOrderEProc(eproc);

    stageAdmin.agent = await loginStage(stageAdmin);
    stageSupplier.agent = await loginStage(stageSupplier);

    var tidinfo = await checkTIDinTNT(stageAdmin, transactionIds[0])

    var POinfo = await retry(checkSalesOrderPO, 
        {
            options: [stageSupplier, uniquePOs[0]],
            attempts: 10,
            waitBetween: 3,
            waitBefore: 8
        }
    )

    var newSO = await confirmPO(stageSupplier, POinfo)

    console.log(`requisitionId: `, requisitionId, `\n\n\n`)
    console.log(`tidinfo: `, tidinfo, `\n\n\n`)
    console.log(`POinfo: `, POinfo, `\n\n\n`)
    console.log(`newSO: `, newSO , `\n\n\n`)

}


(async () => await main())()

