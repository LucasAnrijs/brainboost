const express = require('express');
console.log('Express required!');
const app = express();
console.log('App created!');
app.get('/', (req, res) => res.send('Hello!'));
app.listen(3000, () => console.log('Minimal server running!'));