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
    'shadowDom' : '#dbox-top-bar',
    'profileAvatar': `#dbox-top-bar .initials_avatar`,
    'switchToAdmin' : `#dbox-top-bar .user_menu_link`,
    'selectBusinessUnitDropdown' : `#RequestRequisition_bu_id_chosen`,
    "nextClick":"//span[text()='Next']",
    'additionalRolesAndResponsibilities' : `Please add the additional roles and responsibilities of the candidates you want to hire for this role`,
    'additionalSkills' : `Please Add the additional skills of the candidates you want to hire for this role`,
    'nextButton1': `//button[@name='next_raise_requisition_basic']`,
    'nextButton2' : `//button[@name='next_raise_requisition_job']`,
    'nextButton3' : `//button[@name='next_raise_requisition_position']`,
    'newPositions' : `//input[@id='RequestRequisition_no_of_employees_new']`,
    'replacementPositions' : `//input[@id='RequestRequisition_no_of_employees_replacement']`,
    "Expfromclick":"(//input[@class='search'])[5]", 
    "Expto":"(//input[@class='search'])[6]",
    "Exp_month":"//div[text()='months']",
    "selectcurrency":"(//input[@class='search'])[7]",
    "salaryRange_MIN":"//input[@id='RequestRequisition_salary_min']",
    "salaryRange_Max":"//input[@id='RequestRequisition_salary_max']",
    "salary_TimeFrame":"(//input[@class='search'])[8]",
    "calendar_click":"//input[@id='RequestRequisition_recruitment_start_date']",
    "current_Month":'//select[@class="ui-datepicker-month"]//option[@selected="selected"]',
    "current_Year":'//select[@class="ui-datepicker-year"]//option[@selected="selected"]',
};


const urls = {

    'entry' : `https://cardekho.stage.darwinbox.io`,
    'dashboard' : `https://cardekho.stage.darwinbox.io/dashboard`,
    'login' : `https://cardekho.stage.darwinbox.io/user/login`,
    'otp' : `https://cardekho.stage.darwinbox.io/otpauth/index`, 
    'requisition' : `https://cardekho.stage.darwinbox.io/recruitment/recruitment/requestedrequisition`,
    

};

const values = {

    'loginTitle' : `rakesh3599_Valuekraft : Login`,
    'homePageTitle' : `rakesh3599_Valuekraft`,
    'selectCompany' : `Girnar Insurance Brokers Private Limited`,
    'selectBusineesUnit' : `Insurance.`,
    'selectDepartemt' : `Insurance_Admin (5_8)`,
    'selectDesignation' : `Assistant Manager-Financial Analysis (5_22_86_137_1375_1414_1569)`,
    'Exp_from':'3',
    'Exp_to':'5',
    'Currency':'INR',
    'salary_min':'1000',
    'salary_max':'10000',
    'salary_time':'Monthly',
    'desired_date':'22',
    'desired_month':'Dec',
    'desired_year':'2025',
    'additionalRolesAndResponsibilitiesText' : `Hello`,
    'additionalSkillsText' : `Hello`,
    'newPoitions' : 1,
    'replacementPositions' : 0 ,
    'LocationNewPosition' : `Abhor, Punjab, India (702_I)`,
    'EmployeeTypeNewPosition' : `Contract`,
    'replacementForId' : `10010019`,
    'replacementForName' : `Abhinav Faujdar (10010019)`,
    'requestrequisitionComment' : `Automation Activity`,
    'requestRequisitionAssetRequirements' : `Automation Activity`,

};



(async () => {


    const browser = await chromium.launch({ headless: false }); 
    const page = await browser.newPage();


    // Login and OTP
    await page.goto(urls.entry);
    await page.waitForSelector(selectors.userName);
    await page.fill(selectors.userName, username);
    await page.fill(selectors.password, password);
    await page.selectOption(selectors.DashboardSelect, { value: 'dashboard' }); 
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

    //go to requisition
    await page.waitForTimeout(5000);
    await page.goto(urls.requisition);
    await page.waitForURL(urls.requisition);
    await expect(page).toHaveTitle(values.homePageTitle);

//BASIC DETAILS
    // select company
    try{    
        await page.locator(`//div[@class='form-control ui searchabledropdown search db-dropdown selection']`).click();
        await page.getByTitle(values.selectCompany).click();
        await page.waitForTimeout(2000);
    } catch{ console.log("Error in selecting Company. Company name do not exists"); }


    //select Businedd Unit
    try{
        await page.locator(selectors.selectBusinessUnitDropdown).click();
        for (const row of await page.getByRole('listitem').all()) {
            const text = await row.textContent(); 
            if (text.trim() === values.selectBusineesUnit.trim()) { 
                await row.click(); 
                break;
            }
        }
    } catch{ console.log("Error in selecting Businedd Unit. Business unit do not exists"); }

    //select Department
    try{
        await page.locator(`//div[@id="RequestRequisition_department_id_chosen" and @class="chosen-container chosen-container-single"] `).click();
        for (const row of await page.getByRole('listitem').all()) {
            const text = await row.textContent();
            if (text.trim() === values.selectDepartemt.trim()) { 
                await row.click(); 
                break;
            }
        }
    } catch{ console.log("Error in selecting Department Name. Department name do not exists"); }

    await page.waitForTimeout(2000);

    //select Designation
    try{
        await page.locator(`//div[@class="ui search searchabledropdown db-dropdown selection required-error-border"]`).click();
        await page.getByTitle(values.selectDesignation).click();
        await page.waitForTimeout(2000);
    } catch{ console.log("Error in selecting Designation name. Designation name do not exists"); }

    //click nex button
    await page.locator(selectors.nextButton1).click();
    await page.waitForTimeout(2000);

//JOB DETAILS    
    //fill details
    await page.locator(selectors.Expfromclick).fill(values.Exp_from);
    await page.locator(selectors.Expto).fill(values.Exp_to);
    await page.locator(selectors.selectcurrency).fill(values.Currency);
    await page.locator(selectors.selectcurrency).press('Enter');
    await page.locator(selectors.salaryRange_MIN).fill(values.salary_min);
    await page.locator(selectors.salaryRange_Max).fill(values.salary_max);
    await page.locator(selectors.salary_TimeFrame).fill(values.salary_time);
    await page.locator(selectors.calendar_click).click();

    // handle calander 
    let date = values.desired_date;
    let month = values.desired_month;
    let year = values.desired_year;

    while(true){
        let current_month=await page.locator(selectors.current_Month).textContent();
        let current_year=await page.locator(selectors.current_Year).textContent();

        if(year==current_year && month==current_month){
          break;
        }

        await page.locator(selectors.nextClick).click();
    }
    await page.locator(`//td[@data-handler='selectDay']//a[text()='${date}']`).click();


//POSITION SELECTION
    // fill details
    await page.getByPlaceholder(selectors.additionalRolesAndResponsibilities).fill(values.additionalRolesAndResponsibilitiesText);
    await page.getByPlaceholder(selectors.additionalSkills).fill(values.additionalSkillsText);
    await page.locator(selectors.nextButton2).click();
    await page.waitForTimeout(2000);

    // fill number of new positions and number of replacement positions
    await page.locator(selectors.newPositions).fill(values.newPoitions.toString());
    await page.locator(selectors.replacementPositions).click();
    await page.keyboard.press('Backspace');
    await page.fill(selectors.replacementPositions, values.replacementPositions.toString());
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    //handle Matrix for new position
    try{
        for(let i = 0; i < values.newPoitions; i++) {

            if(i === 1) {

                await page.locator(`//select[@name='matrix[1][location]']/following-sibling::div[@class='text']`).click();
                await page.getByTitle(values.LocationNewPosition, { exact : true }).nth(1).click();
                await page.locator(`//select[@name='matrix[1][emp_type]']/following-sibling::div[@class='text']`).click();
                await page.keyboard.press('Enter');
                await page.click(`//select[@name='matrix[2][location]']/following-sibling::div[@class='text']`);
                await page.locator(`//select[@name='matrix[1][emp_type]']/following-sibling::div[@class='text']`).click();
                await page.getByTitle(values.EmployeeTypeNewPosition, { exact : true }).nth(1).click();
            } else {

                await page.locator(`//select[@name='matrix[${i}][location]']/following-sibling::div[@class='text']`).click();
                await page.getByTitle(values.LocationNewPosition).nth(i).click();
                await page.locator(`//select[@name='matrix[${i}][emp_type]']/following-sibling::div[@class='text']`).click();
                await page.getByTitle(values.EmployeeTypeNewPosition).nth(i).click();
            }
        }
    } catch {
        console.log("Error in filling new Position. One of the feild do not exists")
    }

    // handle matrix for replacement positions
    const it = (values.newPoitions) + (values.replacementPositions);
    try {
        for(let i = values.newPoitions, j = 0; i < it; i++) {
            await page.locator(`//select[@name='matrix[${i}][rep_for]']/following-sibling::div[@class='text']`).click();
            await page.waitForTimeout(1000);
            await page.locator(`//select[@name='matrix[${i}][rep_for]']/following-sibling::input`).fill(values.replacementForId);
            await page.waitForTimeout(1000);
            await page.keyboard.press("Enter");
            await page.waitForTimeout(1000);
            await page.getByTitle(values.replacementForName).nth(j++).click();
            await page.waitForTimeout(1000);
            // await page.locator(`//select[@name='matrix[${i}][emp_type]']/following-sibling::div[@class='text']`).click();
            // await page.getByTitle(values.EmployeeTypeNewPosition).nth(i).click();
            await page.locator(`//select[@name='matrix[${i}][location]']/following-sibling::div[@class='text']`).click();
            await page.getByTitle(values.LocationNewPosition).nth(i).click();
        }
    } catch {
        console.log("Error in filling replacement Position. One of the feild do not exists")
    }

    //click next button
    await page.locator("//button[@id='btn-primary-tab3']").click()

//OTHER DEATILS
    // others details section
    await page.locator("//textarea[@id='RequestRequisition_comments']").fill(values.requestrequisitionComment)
    await page.locator("//textarea[@id='RequestRequisition_asset_requirements']").fill(values.requestRequisitionAssetRequirements)
    await page.locator("//button[@id='btn-primary-tab4']").click()
 

    try {
        // Click the submit button
        await page.locator('//input[@value="SUBMIT"]').click();

        // Wait for the page to load or check for errors
        try {
            await page.waitForEvent('load', { timeout: 5000 });
        } catch (loadError) {
            console.warn('Page did not load within the expected time.');
        }

        // Check for the success message
        const successMessageLocator = page.locator("(//span[normalize-space()='Requisition submitted successfully'])[1]");
        if (await successMessageLocator.count() > 0) {
            await expect(successMessageLocator).toHaveText('Requisition submitted successfully');
            console.log('Requisition submitted successfully.');
        } else {
            throw new Error('Requisition failed.');
        }
    } catch (error) {
        // error message and list of validation errors
        const errorMessageLocator = page.locator('//div[@class="errors-header"]');
        const errorListLocator = page.locator('//ol[@class="validation-errors"]/li');

        if (await errorMessageLocator.count() > 0) {
            const errorMessage = await errorMessageLocator.textContent();
            const errorList = await errorListLocator.allTextContents();

            console.error('An error occurred during submission:');
            console.error('Error Message:', errorMessage.trim());
            console.error('Error List:', errorList);
        } else {
            console.error('An unknown error occurred:', error.message);
        }

        throw error;
    }

    await page.waitForTimeout(3000);
    await browser.close();
})();