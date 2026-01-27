
const query = 'uberlândia';
const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;

console.log('Fetching:', url);

fetch(url)
    .then(res => res.json())
    .then(data => {
        console.log('Raw results:', JSON.stringify(data, null, 2));
        if (data.results) {
            const filtered = data.results.filter(item => item.country_code === 'BR');
            console.log('Filtered (BR):', filtered.length);
        }
    })
    .catch(err => console.error(err));
