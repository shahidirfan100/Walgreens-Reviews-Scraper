import { Impit } from 'impit';
const impit = new Impit({ browser: 'chrome', ignoreTlsErrors: true });
async function main() {
    // Try different possible product IDs for this URL
    const candidates = [
        'prod6177789', // from URL
        'prod6177789'.replace('prod', ''), // numeric only
        '07214001407', // UPC found in page
        '6177789', // numeric suffix only
    ];

    for (const pid of candidates) {
        try {
            const url =
                'https://api.bazaarvoice.com/data/batch.json?passkey=tpcm2y0z48bicyt0z3et5n2xf&apiversion=5.5&displaycode=2001-en_us&resource.q0=reviews&filter.q0=productid:eq:' +
                pid +
                '&limit.q0=3&offset.q0=0&sort.q0=submissiontime:desc';
            const resp = await impit.fetch(url, { timeout: 15000 });
            const txt = await resp.text();
            const data = JSON.parse(txt);
            const total = data.BatchedResults?.q0?.TotalResults || 0;
            const results = data.BatchedResults?.q0?.Results || [];
            console.log('ID=' + pid + ': total=' + total + ' results=' + results.length);
            if (results.length > 0) {
                const r = results[0];
                console.log(
                    '  Title=',
                    r.Title,
                    '| Text=',
                    r.ReviewText ? r.ReviewText.substring(0, 40) : 'null',
                    '| Nickname=',
                    r.UserNickname,
                );
            }
        } catch (e) {
            console.log('ID=' + pid + ': ERROR ' + e.message.substring(0, 60));
        }
    }
}
main();
