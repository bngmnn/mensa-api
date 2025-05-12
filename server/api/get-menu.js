const axios = require('axios');
const cheerio = require('cheerio');

async function fetchHTML(url) {
    const { data } = await axios.get(url);
    return data;
}

async function parseMealsForLocation($, locationElement) {
    const menu = [];
    const timestampWrapper = $(locationElement).find('.tx-epwerkmenu-menu-timestamp-wrapper');

    for (const element of timestampWrapper.toArray()) {
        const meal = await extractMealData($, element);
        if (meal) menu.push(meal);
    }

    return menu;
}

async function extractMealData($, element) {
    const date = $(element).attr('data-timestamp')?.toString();
    const singlemeal = $(element).find('.singlemeal__headline').text().trim();
    const prices = extractPrices($, element);
    const additives = extractAdditives($, element);

    if (!date || !singlemeal) return null; // Return null if data is incomplete

    const weekday = new Date(date).toLocaleDateString('de-DE', { weekday: 'long' });

    return { date, singlemeal, weekday, prices, additives };
}

function extractPrices($, element) {
    const prices = { student: 0, employee: 0, guest: 0 };

    $(element).find('.singlemeal__bottom .dlist .dlist__item').each((_, priceElement) => {
        const text = $(priceElement).text().trim();
        const priceText = $(priceElement).find('.singlemeal__info--semibold').text().trim();
        const priceValue = parseFloat(priceText.replace(',', '.'));

        if (text.includes("Studierende")) prices.student = priceValue;
        if (text.includes("Bedienstete")) prices.employee = priceValue;
        if (text.includes("Gäste")) prices.guest = priceValue;
    });

    return prices;
}

function extractAdditives($, element) {
    const additivesHeadline = $(element).find('.dlist__title').filter((_, title) => $(title).text().trim().includes("Allergene"));
    const additivesString = additivesHeadline.siblings(".dlist__item").text().trim();

    return additivesString.split(/\s*,\s*/).map(item => {
        const [code, description] = item.split(/\s*=\s*/);
        return code && description ? { code: code.trim(), description: description.trim() } : null;
    }).filter(additive => additive);
}

async function main() {
    const route = "/speiseplan";
    const locationId = "164";
    const timespan = "this_week";
    const url = `https://www.stwhh.de/${route}?l=${locationId}&t=${timespan}`;

    try {
        const htmlData = await fetchHTML(url);
        const $ = cheerio.load(htmlData);

        const menu = [];

        $('.tx-epwerkmenu-menu-location-container').each((_, locationElement) => {
            const locationElementId = $(locationElement).attr('data-location-id');
            if (locationId !== locationElementId) return;

            parseMealsForLocation($, locationElement)
                .then(meals => {
                    menu.push(...meals);
                });
        });

        // Optionally, you may want to wait for async operations to complete if more complex logic is involved
        console.log({ menu }); // Output the results

    } catch (error) {
        console.error('Failed to scrape the website.', error);
    }
}

// Execute the main function
main();
