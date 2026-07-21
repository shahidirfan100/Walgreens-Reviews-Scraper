import { Impit } from 'impit';
const impit = new Impit({ browser: 'chrome', ignoreTlsErrors: true });
async function main() {
    const url =
        'https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product';
    const resp = await impit.fetch(url);
    console.log('Status:', resp.status);
    const text = await resp.text();
    console.log('Body length:', text.length);
    const patterns = [
        'productId',
        'skuId',
        'upc',
        'bazaarvoice',
        'Bazaarvoice',
        'passkey',
        'Passkey',
        '__NEXT_DATA__',
        'bv_product',
        'bv.passkey',
        'displaycode',
    ];
    for (const p of patterns) {
        const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const m = text.match(re);
        if (m) {
            const start = Math.max(0, m.index - 20);
            const end = Math.min(text.length, m.index + 80);
            console.log(p + ':', JSON.stringify(text.substring(start, end)));
        }
    }
}
main().catch((e) => console.error('Error:', e.message));
