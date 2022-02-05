const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const user = require('./routes/user-route');
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const databaseURL = "mongodb+srv://osmanmaltiti:heroo1088@quil.iwpbl.mongodb.net/quilDB?retryWrites=true&w=majority" 

mongoose.connect(databaseURL);

app.use(express.json());
app.use('/user', user);

app.get('/', (req, res) => {
  res.send("Hello there Maltiti")
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
