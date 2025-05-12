import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function fetchMenu() {
    const route = "/speiseplan";
    const locationId = "164";
    const timespan = "this_week";

    const url = `https://www.stwhh.de/${route}?l=${locationId}&t=${timespan}`;
    
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const menu: any[] = []; // Define a structured type if needed

        $('.tx-epwerkmenu-menu-location-container').each((_, locationElement) => {
            const locationElementId = $(locationElement).attr('data-location-id');
            if (locationId !== locationElementId) return;

            const timestampWrapper = $(locationElement).find('.tx-epwerkmenu-menu-timestamp-wrapper');
            timestampWrapper.each((_, element) => {
                const date = $(element).attr('data-timestamp')?.toString();
                
                const singlemeal = $(element).find('.singlemeal__headline').text().trim();
                const prices: any = {
                    student: 0,
                    employee: 0,
                    guest: 0,
                };

                const additivesHeadline = $(element).find('.dlist__title').filter((_, title) => $(title).text().trim().includes("Allergene"));
                const additivesString = additivesHeadline.siblings(".dlist__item").text().trim();
                const additives: any[] = additivesString.split(/\s*,\s*/).map(item => {
                    const [code, description] = item.split(/\s*=\s*/);
                    if (!code || !description) {
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
                    const priceValue = parseFloat(priceText.replace(',', '.'));

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
                    });
                }
            });
        });

        // Write the menu to a JSON file
        const outputPath = path.resolve('./static/menu.json');
        fs.writeFileSync(outputPath, JSON.stringify({ menu }, null, 2));
        console.log("Menu data updated successfully.");
    } catch (error) {
        console.error("Error fetching menu:", error);
    }
}

// Execute fetchMenu when the script runs directly
if (require.main === module) {
    fetchMenu().catch(console.error);
}

export default fetchMenu;
