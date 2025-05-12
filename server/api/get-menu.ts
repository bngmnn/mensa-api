import axios from 'axios';
import * as cheerio from 'cheerio';

type Menu = Meal[];
type Meal = {
    date: string;
    weekday: string;
    singlemeal: string;
    prices?: MealPrices;
    additives?: MealAdditives[];
}
type MealAdditives = {
    code?: string;
    description?: string;
}
type MealPrices = {
    student: number;
    employee: number;
    guest: number;
};

export default defineEventHandler(async (event) => {
    const route = "/speiseplan";
    const locationId = "164";
    const timespan = "this_week";

    const url = `https://www.stwhh.de/${route}?l=${locationId}&t=${timespan}`;
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const menu: Menu = []; // Define a structured type

        $('.tx-epwerkmenu-menu-location-container').each((_, locationElement) => {
            const locationElementId = $(locationElement).attr('data-location-id');
            if (locationId !== locationElementId) return;

            const timestampWrapper = $(locationElement).find('.tx-epwerkmenu-menu-timestamp-wrapper');
            timestampWrapper.each((_, element) => {
                // Iterate through each weekday heading
                const date = $(element).attr('data-timestamp')?.toString();
                
                const singlemeal = $(element).find('.singlemeal__headline').text().trim();
                const prices: MealPrices = {
                    student: 0,
                    employee: 0,
                    guest: 0,
                };

                const additivesHeadline = $(element).find('.dlist__title').filter((_,title) => $(title).text().trim().includes("Allergene"));
                const additivesString = additivesHeadline.siblings(".dlist__item").text().trim();
                const additives: MealAdditives[] = additivesString.split(/\s*,\s*/).map(item => {
                    const [code, description] = item.split(/\s*=\s*/);
                    if (!code || ! description) {
                        return;
                    }
                    return {
                      code: code?.trim(),
                      description: description?.trim()
                    };
                }).filter(additive => !!additive);
                
                $(element).find('.singlemeal__bottom .dlist .dlist__item').each((_, priceElement) => {
                    const text = $(priceElement).text().trim();
                    const priceText = $(priceElement).find('.singlemeal__info--semibold').text().trim();
                    const priceValue = parseFloat(priceText.replace(',','.'));
                    
                    if (text.includes("Studierende"))
                        prices.student = priceValue;
                    if (text.includes("Bedienstete"))
                        prices.employee = priceValue;
                    if (text.includes("Gäste"))
                        prices.guest = priceValue;
                });
                   
                if (date) {
                    const weekday = new Date(date).toLocaleDateString('de-DE', {
                        weekday: 'long',
                    });
                    
                    menu.push({
                        date,
                        singlemeal,
                        weekday,
                        prices,
                        additives,
                    })
                }
            });
        });
        

        return { menu };
    } catch (error) {
        console.error(error); // Log the error for debugging
        return { error: 'Failed to scrape the website.' };
    }
});
