const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Craft Collective API listening on port ${PORT}`);
});
