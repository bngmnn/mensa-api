import { defineEventHandler } from 'h3';
import * as fs from 'fs';
import * as path from 'path';

export default defineEventHandler(async (event) => {
    const filePath = path.resolve('./static/menu.json');

    try {
        const jsonData = fs.readFileSync(filePath, 'utf-8');
        const menuData = JSON.parse(jsonData);
        return { menu: menuData.menu };
    } catch (error) {
        console.error("Error reading menu data:", error);
        return { error: 'Failed to fetch menu.' };
    }
});
