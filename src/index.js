const superagent = require('superagent')
const assert = require('assert')
const {asyncMap, wait, retry, deepEqual} = require('./lib/mylib')


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
        this.port = init.port?init.port: init.scheme=='https'?443:80
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
    login: eprocLogin,
    pass: eprocPass,
})

var stageAdmin = new AccessConfig({
    scheme: 'https',
    subdomain: 'stage.businessnetwork',
    login: stageAdminLogin,
    pass: stageAdminPass,
})

var stageSupplier = new AccessConfig({
    scheme: 'https',
    subdomain: 'stage.businessnetwork',
    login: stageSupplierLogin,
    pass: stageSupplierPass,
})

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
    try {
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
    } catch(e){
        throw new Error(`Couldn't make the first request to '${eproc.uri('opc')}' -> ` + e)
    }
    



    try {
        // Perform Auth

        var neu = newAgent();
        
        var _ = await neu.
        post(eproc.uri('josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id' + SSOArtID)).
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
    } catch(e){
        throw new Error(`Couldn't authentificate '${eproc.uri('josso/IDBUS-UI/IDP/SSO/LOGIN/SIMPLE?-1.IFormSubmitListener-signIn-signInForm&SSOArt=id' + SSOArtID)}' -> ` + e)
    }
    

    var productKey = 'lap001_910-001246'; // Passing search
    var shortDescription = 'USB Mouse';  // Passing search


    try {
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
    } catch(e){
        throw new Error(`Couldn't add to cart '${eproc.uri(`opc/add2Cart/addToCartSimple?isAddFromSearch=true`)}' -> ` + e)
    }
    


    try {
        // Getting cart info
        var [salesOrderName, domainObjectId, salesOrderId, salesOrderItemKey] = await neu.
        get(eproc.uri('opc/shoppingCart/index?backUrl=')).
        then(response => {
            var html = response.res.text.toString()
            var salesOrderName = html.match(/name="salesOrderName" value="([^"]+)"/)[1]
            var domainObjectId = html.match(/name="id" value="([^"]+)"/)[1]
            var salesOrderId = html.match(/name="salesOrderId" value="([^"]+)"/)[1]
            var salesOrderItemKey = html.match(/name="salesOrderItemKey" value="([^"]+)"/)[1]

            console.log(` -> Opened cart, gethered info:\nsalesOrderName:${salesOrderName}\ndomainObjectId:${domainObjectId}\nsalesOrderId:${salesOrderId}\nsalesOrderItemKey:${salesOrderItemKey}\n\n\n`)
            return [salesOrderName, domainObjectId, salesOrderId, salesOrderItemKey]
        })
    } catch(e){
        throw new Error(`Couldn't get cart info '${eproc.uri('opc/shoppingCart/index?backUrl=')}' -> ` + e)
    }
    


    try {
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
    } catch(e){
        throw new Error(`Couldn't make an order '${eproc.uri('opc/shoppingCart/order')}' -> ` + e)
    }
    


    try {
        // Gathering checkout info
        var [shoppingCartName, itemKeys] = await neu.
        post(eproc.uri('opc/checkout/show')).
        send('customValidationResult=' + toSend).
        then(response => {
            var html = response.res.text.toString()

            var shoppingCartName = html.match(/name="shoppingCartName_0" value="([^"]+)"/)[1]
            var itemKeys = html.match(/name="itemKeys_0" value="([^"]+)"/)[1]

            console.log(` -> Checkout info obtained:\nshoppingCartName:${shoppingCartName}\nitemKeys:${itemKeys}\n\n\n`)
            return [shoppingCartName, itemKeys]
        })
    } catch(e){
        throw new Error(`Couldn't get checkout info '${eproc.uri('opc/checkout/show')}' -> ` + e)
    }



    try {
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
    } catch(e){
        throw new Error(`Couldn't authentificate eproc '${eproc.uri('proc')}' -> ` + e)
    }
    


    try {
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
    } catch(e){
        throw new Error(`Couldn't confirm the order '${eproc.uri('opc/checkout/confirm')}' -> ` + e)
    }
    



    try {
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
    } catch(e){
        throw new Error(`Couldn't check customer assignment response '${eproc.uri('proc/orderAssignmentSecurity/checkCustomerAssignment')}' -> ` + e)
    }
    

    if (!answer.isValid) throw new Error(`Customer assignment is not valid: ${JSON.stringify(answer)}`)



    try {
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
    } catch(e){
        throw new Error(`Couldn't get POs '${eproc.uri('proc' + answer.onConfirm)}' -> ` + e)
    }
    
    
    if (!uniquePOs) throw new Error(`Unique POs are not found, uniquePOs: '${uniquePOs}'`)


    try {
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
    } catch(e){
        throw new Error(`Couldn't get transferIds '${eproc.uri('proc/docTransfer/list')}' -> ` + e)
    }
    
    if (!transactionIds) throw new Error(`TransactionIds are not found, transactionIds: '${transactionIds}'`)



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
    var updatedPO = Object.assign({}, POdata)
    var update = {
        type: 'orderConfirmation',
        versionNumber: 'v2',
        status: 'confirmed',
        changedBy: 'BNP tester',
        changedOn: (new Date()).toISOString(),
    }

    Object.assign(updatedPO, update)

    var answer = await stage.agent.put(stage.uri(`sales-order/api/sales-orders/hard001/${updatedPO.customerId}/${updatedPO.orderNumber}`))
    .set('Content-Type', 'application/json')
    .send(JSON.stringify(updatedPO))
    .then(response => response.body)
    return answer['salesOrder'];
}

var loginStage = async (config) => {

    console.log(` -> Starting Login to '${config.uri()}' as '${config.login}'\n`)
    
    var testcall = async (config, request) => {
        var response = null;
    
        try {
            response = await request.get('https://stage.businessnetwork.opuscapita.com/sales-order/api/sales-orders/hard001?orderNumber=%PO180000349%').redirects(0);
        } catch(err) {
            console.error("BNP Login Failed: error in get testcall: ", err);
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
        let interactionId = interactionURL.substring(interactionURL.lastIndexOf('/')+1, interactionURL.length);
    
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
    await logon(config, agent)
    .then( async () => await testcall(config, agent));

    return agent;
}


var main = async () => {
    console.log(`////////////  Welcome to '${eproc.uri()}', login: '${eproc.login}', pass: '${eproc.pass}'\n\n\n`)

    // try {

    // } catch(e){

    // }

    // var [requisitionId, uniquePOs, transactionIds] = await createOrderEProc(eproc);
    try{
        var [requisitionId, uniquePOs, transactionIds] = await createOrderEProc(eproc);
    } catch(e){
        console.error(`Couldn't create an order:`, e)
        throw e
    }

    try{
        stageAdmin.agent = await loginStage(stageAdmin);
    } catch(e){
        console.error(`Couldn't login on stage as admin '${stageAdmin.login}'`, e)
        throw e
    }

    try{
        stageSupplier.agent = await loginStage(stageSupplier);
    } catch(e){
        console.error(`Couldn't login on stage as supplier '${stageSupplier.login}'`, e)
        throw e
    }

    var TIDInfoResults = await asyncMap(transactionIds, transactionId => {
        try{
            return checkTIDinTNT(stageAdmin, transactionId)
        } catch(e){
            console.error(`Couldn't get TID info from stage`)
            throw e
        }
    })

    // Test TransactionIds
    TIDInfoResults.forEach(TIDInfo => {
        if ( // Add checks for SENT
            TIDInfo.eventCode != 'RECEIVED' ||
            TIDInfo.product != 'Sirius'
        ) throw new Error('TransactionId tests not passed!')
    })


    var POInfoResults = await asyncMap(uniquePOs, uniquePO => {
        try{
            return retry(checkSalesOrderPO, 
                {
                    options: [stageSupplier, uniquePO],
                    attempts: 10,
                    waitBetween: 3,
                    waitBefore: 8
                }
            )
        } catch(e){
            console.error(`Couldn't get POInfo info from stage`)
            throw e
        }
    })
    
    // Test uniquePOs
    POInfoResults.forEach(POInfo => {
        if (
            !uniquePOs.includes(POInfo.orderNumber) ||
            POInfo.type != 'order'                  ||
            POInfo.versionNumber != 'v1'            ||
            POInfo.status != 'ordered'
        ) throw new Error('PO result tests not passed!')
    })


    var newPOInfoResults = await asyncMap(POInfoResults, POInfo => {
        try{
            return confirmPO(stageSupplier, POInfo)
        } catch(e){
            console.error(`Couldn't confirm PO info from stage`)
            throw e
        }
    })
    
    newPOInfoResults.forEach(newPOInfo => {
        if (
            newPOInfo.type != 'orderConfirmation'   ||
            newPOInfo.versionNumber != 'v2'         ||
            newPOInfo.status != 'confirmed'
        ) throw new Error(`Confirmed PO's tests failed!`)
    })

    

    var delVals = po => {
        var r = Object.assign({}, po);
        ['id', 'versionNumber', 'status', 'type', 'changedBy', 'changedOn'].forEach(k => delete r[k]);
        r.SalesOrderItems.forEach(i => {delete i.id; delete i.salesOrderId});
        return r
    }

    // Test new (confirmed) POs are corresponding to original POs
    newPOInfoResults.forEach((newPOInfo, i) => {
        if (!deepEqual(delVals(POInfoResults[i]), delVals(newPOInfo))) throw new Error(`PO and new PO are not equal`)
    })

    


    console.log(`requisitionId: `, requisitionId, `\n\n\n`)
    console.log(`TIDInfoResults: `, TIDInfoResults, `\n\n\n`)
    console.log(`POInfoResults: `, POInfoResults, `\n\n\n`)
    console.log(`newPOInfoResults: `, newPOInfoResults , `\n\n\n`)

}


(async () => await main())()

