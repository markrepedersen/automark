import {GoogleMainPage} from "../src/pages/GoogleMainPage";
import {Chrome} from "../src/lib/utils/browsers/chrome";

describe('Google Search Spec', function () {
    const chrome: Chrome = new Chrome();

    it('should be able to search', async function () {
        const homePage: GoogleMainPage = new GoogleMainPage(chrome);
        await homePage.search('hello');
    });
});