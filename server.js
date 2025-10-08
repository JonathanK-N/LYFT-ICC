const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'dist')));

// Gérer les routes SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});