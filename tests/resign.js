require('dotenv').config();
const { chromium, expect } = require('@playwright/test');
const axios = require('axios');
const fs = require('fs');
const path = require('path');


// Access the variables from process.env
const username = process.env.DBUSERNAME;
const password = process.env.DBPASSWORD;
const fileDownload = process.env.AWSURL;
const adminUserId = process.env.ADMINUSERID;



const selectors = {

    'userName' : `//input[@placeholder="Email / Emp ID"]`,
    'password' : `//input[@placeholder="Password"]`,
    'DashboardSelect' : '#UserLogin_redirectpage',
    'signInSubmit' : `//button[@id="login-submit"]`,
    'dropdown' : `#reasons_chosen a.chosen-single`,
    'dropdownOptions' : `#reasons_chosen .chosen-results li`,
    'dropdownIndex' : `data-option-array-index`,
    'date' : `//div[@class="input-group"]//input[@class="form-control date_picker hasDatepicker"]`,
    'comment' : `//textarea[@id='Separationnewlatest_resignation_comments']`,
    'uploadFile' : `#AddAttachmentWorkFlow_name`,
    'successNotification' : `//div[@name='employee_separation_show_banner_message_']`,
    'resignButton' : `input[value='RESIGN']`,
    'otherReasonText' : `//input[@id='Separationnewlatest_other_reason']`,
    'calender' : `//input[@id='Separationnewlatest_requested_last_day']`,
    'year' : `//select[@aria-label='Select year']`,
    'month' : `//select[@aria-label='Select month']`,
    'date' : `//a[normalize-space()='22']`,
    'desiredMonth' : `.ui-datepicker-month`,
    'desiredYear' : `.ui-datepicker-year`,
    'revokeButton' : `//input[@value="REVOKE"]`,
    'resubmitButton' : `//div//input[@value="RESUBMIT"]`,
    'revokeFormButton1' : `//button[normalize-space()='Revoke']`,
    'revokeFormButton2' : `.modal-body .revoke-form`,
    'revokeModal' : `.modal-body`,
    'shadowDom' : '#dbox-top-bar',
    'profileAvatar': `#dbox-top-bar .initials_avatar`,
    'switchToAdmin' : `#dbox-top-bar .user_menu_link`,
};


const urls = {

    'entry' : `https://cardekho.stage.darwinbox.io`,
    'dashboard' : `https://cardekho.stage.darwinbox.io/dashboard`,
    'login' : `https://cardekho.stage.darwinbox.io/user/login`,
    'otp' : `https://cardekho.stage.darwinbox.io/otpauth/index`, 
    'resign' : `https://cardekho.stage.darwinbox.io/separation/index/id`,
};

const values = {

    'loginTitle' : `rakesh3599_Valuekraft : Login`,
    'homePageTitle' : `rakesh3599_Valuekraft`,
    'resignSubmitNotification' : `Resignation Submitted Successfully`, 
    'comment' : `This is a comment`,
    'desiredOption' : `Not a listed reason`, 
    'fallbackOption' : `Other Reason`,
    'desiredMonth' : `Sep`,
    'desiredYear' : `2024`,
    'day' : `22`,
    'verifyResign' : `Your request is with Manager, waiting for Manager's Approval.`,
};


const revokeResign = async ( {page} ) => {

    try {
        //  revoke Resign for next run
        await page.waitForSelector(selectors.revokeButton);
        await page.click(selectors.revokeButton);
        // Wait for the modal to appear
        await page.waitForSelector(selectors.revokeModal);
        // Click the "Revoke" button in the modal to submit the form
        await page.click(selectors.revokeFormButton1);
        // Wait for the page to refresh
        await page.waitForLoadState("domcontentloaded");
        await page.waitForLoadState('load');
        await page.waitForSelector(selectors.resignButton);
    } catch {
        throw new Error("Resign already exists");
    }

    console.log("Revoked Resign Successfully")
};

const downloadFile = async (url, filePath) => {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};


(async () => {
    
    const filePath = path.resolve(__dirname, 'downloaded-file.pdf');

    // Download the file
    try {
        await downloadFile(fileDownload, filePath);
        console.log('File downloaded successfully.');

        // Check if the file was actually downloaded
        if (!fs.existsSync(filePath)) {
            throw new Error('File download failed.');
        }
    } catch (error) {
        console.error('Error downloading the file:', error.message);
        return;
    }

    const browser = await chromium.launch({ headless: false }); // headless false to allow OTP entry
    const page = await browser.newPage();


    // Login and OTP
    await page.goto(urls.entry);
    await page.waitForSelector(selectors.userName);
    await page.fill(selectors.userName, username);
    await page.fill(selectors.password, password);
    await page.selectOption(selectors.DashboardSelect, { value: 'dashboard' });     //Select dashboard redirect page on login
    await page.locator(selectors.signInSubmit).click();
    await page.waitForURL(urls.otp);

    //ENTER OTP

    // Wait for Dashboard page to open
    try {
        await page.waitForURL(urls.dashboard, { timeout: 100000 });
        await expect(page).toHaveTitle(values.homePageTitle);
    } catch{
        throw new Error("Home page not found!")
    }  
 
    // Wait for the shadow host element to be visible
    await page.waitForSelector(selectors.shadowDom);
 
    await page.locator(selectors.profileAvatar).first().click();

    // Wait for the dropdown to be visible
    const switched = await page.locator(selectors.switchToAdmin).first().textContent();
    console.log(switched);
    if(switched == 'Switch to Admin'){
        await page.locator(selectors.switchToAdmin).first().click();
    }
    await page.waitForLoadState('load');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForTimeout(5000);
    // Go to Resign Page via url redirect
    await page.goto(`${urls.resign}/${adminUserId}`);
    await page.waitForURL(`${urls.resign}/${adminUserId}`);
    await expect(page).toHaveTitle(values.homePageTitle);

    const revokeButtonElement  = await page.$(selectors.revokeButton);
    if(revokeButtonElement) {
        console.log('Resign already exists.');
        await revokeResign( {page} );   //Remove if next run is not required and exit code
    }

    // Fill possible feilds
    
    await page.setInputFiles(selectors.uploadFile, filePath);  // Upload File in attachment

    await page.fill(selectors.comment, values.comment);   // Insert comment if any

    //Select dropdown option
    await page.waitForSelector(selectors.dropdown);
    await page.click(selectors.dropdown);       // Open the Chosen dropdown

    await page.waitForSelector('ul.chosen-results', { state: 'visible' });  // Wait for the dropdown options to be visible

    // Extract all option texts and their data-option-array-index values
    const options = await page.evaluate(() => {
        const optionElements = document.querySelectorAll('ul.chosen-results li.active-result');
        return Array.from(optionElements).map(option => ({
            text: option.textContent.trim(),
            index: option.getAttribute('data-option-array-index')
        }));
    });

    // Find the desired option's index
    const option = options.find(opt => opt.text === values.desiredOption);
    const indexToSelect = option ? option.index : options.find(opt => opt.text === values.fallbackOption)?.index;

    // Handle case where neither the desired option nor the fallback option is found
    if (!indexToSelect) {
        throw new Error('Neither desired option nor fallback option found');
    }

    // Select the dropdown option
    await page.click(`//ul[@class="chosen-results"]//li[@data-option-array-index="${indexToSelect}"]`);

    // Select other reason
    await page.waitForSelector(selectors.otherReasonText);
    await page.fill(selectors.otherReasonText, values.comment);

    //Fill date
    await page.click(selectors.calender);
    await page.selectOption(selectors.desiredMonth, { label: values.desiredMonth });    // Select the desired month
    await page.selectOption(selectors.desiredYear, { label: values.desiredYear });    // Select the desired year
    await page.click(`//a[normalize-space()='${values.day}']`);       // Select the desired date

    try {
        // Setup dialog listener before clicking the Resign button
        page.on('dialog', async dialog => {
            if (dialog.type() === 'confirm') {
                console.log('Confirmation dialog appeared');
                console.log('Message:', dialog.message());
                
                await dialog.accept();
                console.log("Dialog box handled");
    
                await page.waitForLoadState('load');
                await page.waitForLoadState('domcontentloaded');
            }
        });
    
        // Wait for and click the resign button
        await page.waitForSelector(selectors.resignButton);
        await page.click(selectors.resignButton); 
        console.log("Resign button clicked");

        //Verify resign
        await page.waitForSelector(selectors.successNotification);
        
    } catch {
        throw new Error('Resign Failed. Please try again.');
    }

    //Revoke resign for next run
    await revokeResign( {page} );   //Remove if next run is not required

    console.log("RESIGNED SUCCESSFULLY");
    await browser.close();
})();