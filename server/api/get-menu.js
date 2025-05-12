import axios from 'axios';
import * as cheerio from 'cheerio';

export default defineEventHandler(async (event) => {
    const route = "/speiseplan";
    const locationId = "164";
    const timespan = "this_week";
    const url = `https://www.stwhh.de/${route}?l=${locationId}&t=${timespan}`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const menu = [];

        // Optimize the DOM querying to a specific element directly
        const locationElement = $(`.tx-epwerkmenu-menu-location-container[data-location-id="${locationId}"]`);
        
        if (!locationElement.length) {
            return { menu: [] }; // Return empty if location not found
        }

        // Process only the relevant elements
        locationElement.find('.tx-epwerkmenu-menu-timestamp-wrapper').each((_, element) => {
            const date = $(element).attr('data-timestamp');
            const singlemeal = $(element).find('.singlemeal__headline').text().trim();
            const prices = { student: 0, employee: 0, guest: 0 };
            const additives = [];

            // Additional logic...
            // This part may need refactoring to improve performance

            if (date) {
                const weekday = new Date(date).toLocaleDateString('de-DE', { weekday: 'long' });
                menu.push({ date, singlemeal, weekday, prices, additives });
            }
        });

        return { menu };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to scrape the website.' };
    }
});
