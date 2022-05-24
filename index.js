const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.69otv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  console.log('db id connected');
  // perform actions on the collection object
  client.close();
});



app.get('/', (req, res) => {
    res.send('Repair.BD is running')
  })
  
  app.listen(port, () => {
    console.log(`Repair.BD App listening on port ${port}`)
  })