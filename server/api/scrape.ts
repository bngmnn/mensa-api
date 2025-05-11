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

        const menuData: { [key: string]: string[] } = {}; // Define a structured type

        $('.tx-epwerkmenu-menu-location-container').each((_, locationElement) => {
            const locationElementId = $(locationElement).attr('data-location-id');
            if (locationId !== locationElementId) return;

            const timestampWrapper = $(locationElement).find('.tx-epwerkmenu-menu-timestamp-wrapper');
            timestampWrapper.each((_, element) => {
                // Iterate through each weekday heading
                const timestamp = $(element).attr('data-timestamp');
                const singlemeal = $(element).find('.singlemeal__headline').text().trim();
    
                console.log(timestamp + ": " + singlemeal);

                
            });

        });
        

        return { menuData };
    } catch (error) {
        console.error(error); // Log the error for debugging
        return { error: 'Failed to scrape the website.' };
    }
});
