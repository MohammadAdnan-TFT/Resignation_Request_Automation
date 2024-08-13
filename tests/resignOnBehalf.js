require('dotenv').config();
const { chromium, expect } = require('@playwright/test');
const axios = require('axios');
const fs = require('fs');
const path = require('path');


// Access the variables from process.env
const username = process.env.DBUSERNAME;
const password = process.env.DBPASSWORD;
const fileDownload = process.env.AWSURL;
const userId = process.env.USERID;


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
    'calenderRequestedLastDay' : `//input[@id='Separationnewlatest_requested_last_day']`,
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
    'calenderProposedLastDay' : `//input[@id='Separationnewlatest_manager_proposed_last_day']`,
    'ProposedRecoveryDays' : `//input[@id='Separationnewlatest_manager_proposed_recovery_days']`,
    'ProposedRecoveryDaysReason' : `//input[@id='Separationnewlatest_reason_for_proposed_recovery_days']`,
    'FinalRecoveryDays' : `//input[@id='Separationnewlatest_final_recovery_days']`,
    'FinalRecoveryDaysReason' : `//input[@id='Separationnewlatest_final_recovery_days_reason']`,
    'secondAttachment' : `(//input[@id='AddAttachmentWorkFlow_name'])[2]`,
    'checkbox' : `input[name="Separationnewlatest[is_blacklisted]"]`,
    'ResignOnBehalf' : `input[value='RESIGN ON BEHALF']`,
    'noticePeriodRecoveryDays' : `//input[@id='Separationnewlatest_recovery_days']`,
    'doNotRehireComment' : `//textarea[@id='Separationnewlatest_is_blacklisted_comment']`,
    'seperationOtherReason' : `//input[@id='Separationnewlatest_admin_other_reason']`,
    'seperationTypeDropdown' : `select[name="Separationnewlatest[admin_separation_type]"]`,
    'selectReasonDropdown': `.input-group`,
    'selectReasonDropdownOptions' : `#Separationnewlatest_admin_separation_reason_death_type_chosen .chosen-drop .chosen-results .active-result.group-option`
    
    
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
    'proposedRecoveryDays' : '2',
    'proposedRecoveryReason' : `No proposedrecoveryReason`,
    'finalRecoveryDays' : '2',
    'finalRecoveryReason' : `No finalRecoveryReason`,
    'noticePeriodRecoverDays' : `10`,
    'doNotRehireComment' : `Do not`,
    'otherReasonForSeperation' : `No reasoon`,
    'seperationType' : `Death`,


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
        await page.waitForSelector(selectors.ResignOnBehalf);
    } catch {
        throw new Error("Resign already exists");
    }

    console.log("Revoke Resigned Successfully")
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
    if(switched == 'Switch to Admin'){
        await page.locator(selectors.switchToAdmin).first().click();
    }
    await page.waitForLoadState('load');
    // await page.waitForLoadState('domcontentloaded');

    await page.waitForTimeout(5000);
    // Go to Resign Page via url redirect
    await page.goto(`${urls.resign}/${userId}`);
    await page.waitForURL(`${urls.resign}/${userId}`);
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

    // Select the dropdown option
    await page.click(`//ul[@class="chosen-results"]//li[@data-option-array-index="${indexToSelect}"]`);

    // Select other reason
    await page.waitForSelector(selectors.otherReasonText);
    await page.fill(selectors.otherReasonText, values.comment);

    //Fill requested last day
    await page.click(selectors.calenderRequestedLastDay);
    await page.selectOption(selectors.desiredMonth, { label: values.desiredMonth });    // Select the desired month
    await page.selectOption(selectors.desiredYear, { label: values.desiredYear });    // Select the desired year
    await page.click(`//a[normalize-space()='${values.day}']`);       // Select the desired date


    //Fill proposed last day
    await page.click(selectors.calenderProposedLastDay);
    await page.selectOption(selectors.desiredMonth, { label: values.desiredMonth });    // Select the desired month
    await page.selectOption(selectors.desiredYear, { label: values.desiredYear });    // Select the desired year
    await page.click(`//a[normalize-space()='${values.day}']`);       // Select the desired date


    //fill notice period revovery days
    await page.click(selectors.noticePeriodRecoveryDays);
    await page.keyboard.press('Backspace');
    await page.fill(selectors.noticePeriodRecoveryDays, values.noticePeriodRecoverDays);

    //fill proposed recovery days
    await page.click(selectors.ProposedRecoveryDays);
    await page.keyboard.press('Backspace');
    await page.fill(selectors.ProposedRecoveryDays, values.proposedRecoveryDays);
    await page.fill(selectors.ProposedRecoveryDaysReason, values.proposedRecoveryReason);

    //fill final recovery days
    await page.click(selectors.FinalRecoveryDays);
    await page.keyboard.press('Backspace');
    await page.fill(selectors.FinalRecoveryDays, values.finalRecoveryDays);
    await page.fill(selectors.FinalRecoveryDaysReason, values.finalRecoveryReason);

    // Get the dropdown element
    const dropdown = await page.$(selectors.seperationTypeDropdown);

    // Get all available options from the dropdown
    const seperationOptions = await dropdown.$$eval('option', elements => elements.map(option => ({
        value: option.value,
        text: option.textContent.trim()
    })));

    // Find the option value that matches the desired text
    const matchingOption = seperationOptions.find(option => option.text.toLowerCase() === values.seperationType.toLowerCase());

    if (matchingOption) {
        // Select the option if it exists
        await page.selectOption(selectors.seperationTypeDropdown, matchingOption.value);
    } else {
        console.log(`Option "${values.seperationType}" not found in the dropdown.`);
    }


    // Open the Chosen dropdown
    await page.waitForSelector(`${selectors.selectReasonDropdown} #${values.seperationType}`);
    await page.click(`${selectors.selectReasonDropdown} #${values.seperationType}`);
    await page.waitForTimeout(5000);


    // Wait for the dropdown options to be visible
    await page.waitForSelector(selectors.selectReasonDropdownOptions, { state: 'visible' });

    // Locate all elements matching the selector
    const elements = await page.$$(selectors.selectReasonDropdownOptions);

    let optionMatched = false;

    for (let element of elements) {
        //Extract text from each element
        const elementText = await element.textContent();

        //Check if the text matches any of the given options
        if ((values.seperationType).includes(elementText.trim())) {
            optionMatched = true;
            await element.click(); // Click the matching option
            break; 
        }
    }

    //If no option matches, select "Other Reason"
    if (!optionMatched) {
        for (let element of elements) {
            const elementText = await element.textContent();
            if (elementText.trim() === values.fallbackOption) {
                await element.click();
                break;
            }
        }

        await page.waitForSelector(selectors.seperationOtherReason);
        await page.fill(selectors.seperationOtherReason, values.otherReasonForSeperation)
    }

    //checkbox donot rehire
    await page.check(selectors.checkbox);
    await page.locator(selectors.doNotRehireComment).fill(values.doNotRehireComment);

    //file upload  2
    await page.setInputFiles(selectors.secondAttachment, filePath);  // Upload File in attachment

    await page.waitForTimeout(5000);
    try {
        // Ensure dialog listener is set up before clicking the button
        page.on('dialog', async dialog => {
            if (dialog.type() === 'confirm') {
                console.log('Confirmation dialog appeared');
                console.log('Message:', dialog.message());
                
                // Accept the dialog (click 'Okay')
                await dialog.accept();
                console.log("Dialog box handled");
    
                // Wait for the page to refresh or navigate
                // await page.waitForLoadState('networkidle');
                await page.waitForLoadState('load');
                await page.waitForLoadState('domcontentloaded');
            }
        });
    
        // Wait for and click the resign button
        await page.waitForSelector(selectors.ResignOnBehalf)
        await page.click(selectors.ResignOnBehalf);
        await page.waitForTimeout(5000);


    } catch (error) {
        console.error('Error in resigning:', error.message);
    }

    await page.waitForSelector(selectors.revokeButton);
    console.log('RESIGN ON BEHALF SUCCESSFULL');
    await browser.close();
})();