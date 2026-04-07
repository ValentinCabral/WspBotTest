const http = require('http');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => app(req, res));

server.listen(PORT, () => {
  console.log(`B2B Wholesale SaaS running on port ${PORT}`);
});
