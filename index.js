// sudo npm install puppeteer --unsafe-perm=true --allow-root
// sudo npm start

const pupp = require('puppeteer');

const Promise = require('bluebird')
const {promisify} = require('util');


var bnp = {
    mask: 'http',
    host: 'localhost',
    port: 8080,
    url: function(append){
        return `${this.mask}://${this.host}:${this.port}/${append?append:''}`
    }
}

const authPage = {
    loginSelector: `input[name='login']`,
    passwordSelector: `input[name='password']`,
    loginButtonSelector: `input[name='submit']`
}

const multiSelectors = {
    mainDropdown: `.button--with-dropdown > button:nth-child(1)`,
    langSelector: `.oc-menu-select > select.select`
}

const onboardingCampaignsPage = {
    selectorToWait: `input[name='login']`,
    passwordSelector: `input[name='password']`,
    loginButtonSelector: `input[name='submit']`,
    createCampaignSelector: `.form-submit > button:nth-child(2)`
}

const createCampaign = {
    page1: {
        campaignIdSelector: `div.form-horizontal > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > input:nth-child(1)`,
        descriptionSelector: `div.form-horizontal > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > input:nth-child(1)`,
        genericCampaignSelector: `div.col-sm-1:nth-child(3) > input:nth-child(1)`,
        continue: `#campaign > div:nth-child(3) > button:nth-child(2)`
    },
    page2: {
        continue: '#inchannelSelection > div:nth-child(3) > button:nth-child(2)'
    }
}

const campaign = {
    id: 'kekcamp'
}

const keychain = {
    testCustomer: {
        email: 'john.doe@ncc.com',
        password: 'test'
    }
}



var main = async () => {
    

    const browser = await pupp.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    // pageOnce = Promise.promisify(page.once);

    await page.goto(bnp.url('onboarding')); // open bnp

    var tryCatcher = async (name, callback, ...options) => {
        try{
            console.log(`Stating ${name}...`)
            var result = await callback(...(options?options:[]));
            console.log(`... finished ${name}`)

        } catch(e){
            console.log(`... failed ${name}`, e)
        }
        if (result) return result
    }

    var findOnPage = async (type, contents) => {
        const elements = await page.$x(`//${type}[contains(text(), '${contents}')]`);
        if (elements.length > 0) {
            // console.log('Found!-->', elements);
            return elements
        } 
        return false
    }

    var login = async (login, password) => {
        await page.type(authPage.loginSelector, login)
        await page.type(authPage.passwordSelector, password)
        await page.click(authPage.loginButtonSelector)
        return true
    }

    var specialClick = (selector) => page.$eval(selector, el => el.click())

    var langChange = async (lang) => {
        await page.waitForSelector(multiSelectors.mainDropdown)
        // var lol = await page.click(multiSelectors.mainDropdown, {button: 'right'})
        await specialClick(multiSelectors.mainDropdown)
        // await page.$eval(multiSelectors.mainDropdown, el => el.click());
        // await page.click(multiSelectors.mainDropdown)
        await page.waitForSelector(multiSelectors.langSelector)
        await page.select(multiSelectors.langSelector, lang)
        return true
    }

    var openCreateCampaign = async () => {
        await page.waitForSelector(onboardingCampaignsPage.createCampaignSelector)
        await specialClick(onboardingCampaignsPage.createCampaignSelector)
        // await page.click(onboardingCampaignsPage.createCampaignSelector)
        return true
    }

    var fillPage1 = async (campaignId, genericCampaign) => {
        await page.waitFor(5000);
        await page.waitForSelector(createCampaign.page1.campaignIdSelector)
        await page.type(createCampaign.page1.campaignIdSelector, campaignId)
        await page.type(createCampaign.page1.descriptionSelector, 'random smth')
        if (genericCampaign) await page.click(createCampaign.page1.genericCampaignSelector)
        // await navigationPromise;
        await page.click(createCampaign.page1.continue)
        return true
    }

    var fillPage2 = async (setup) => {
        await page.waitFor(1000);
        await page.waitForSelector(createCampaign.page2.continue)
        // var checkbox = await findOnPage('label', 'Invoice Sending')
        // console.log('checkbox-->', checkbox);
        // await checkbox[0].click()
        for(const setting of setup) {
            await findOnPage('label', setting.toClick).then(async (checkbox) => {
                if (checkbox) return checkbox[0].click().then(async (res) => {
                    if ('inside' in setting) {
                        await page.waitFor(4000)
                        for(const option of setting.inside){
                            let checkbox = await findOnPage('label', option)
                            if (checkbox) await checkbox[0].click()
                        }
                        // smth.inside.forEach(async (option) => {
                        //     let checkbox = await findOnPage('label', option)
                        //     if (checkbox) await checkbox[0].click()
                        // })
                    }
                })
            })
        }
        
        await page.click(createCampaign.page2.continue)

        return true
    }

    await tryCatcher('Login', login, keychain.testCustomer.email, keychain.testCustomer.password);
    await tryCatcher('Open create campaign', openCreateCampaign)
    await tryCatcher('Fill page 1', fillPage1, campaign.id + ((Math.random()*1000)|1).toString(), false)
    await tryCatcher('Fill page 2', fillPage2, [{toClick:'Invoice Sending', inside:['E-invoice']}, {toClick:'Catalog Provision'}])


    // await tryCatcher('Language change', langChange, 'Englisch')

    // try {
    //     console.log('Stating Language change ...')
        
    // } catch(e){
    //     console.log('Language change Failed!', e)
    // }
    

    
    
    // var switchLanguage = async () => {
    //     // const result = await page.evaluate(x => {
    //     //     return Promise.resolve(8 * x);
    //     //   }, 7);
    //     console.log('lol!')
    //     // await page.type(authPage.loginSelector,    keychain.testCustomer.email)
    //     // await page.type(authPage.passwordSelector, keychain.testCustomer.password)
    //     await page.click(multiSelectors.mainDropdown)
    // }

    // page.once('load', switchLanguage)//.then(() => console.log('lol!!')).catch(e => console.log('error->',e))




    await page.screenshot({path: bnp.host+'.png'});

    //await browser.close();
}

main();