import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'

const app = express();
const PORT = 8000;
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db('togetherWe');
const eventsCollection = db.collection('events')
const eventsJoinedCollection = db.collection('joinedEvents')

app.get('/events', async(req,res)=>{
const events = await eventsCollection.find({}).toArray()
res.send(events)
})

app.post('/add-event', async(req,res)=>{
    const data = req.body;
    const result = await eventsCollection.insertOne(data);

    console.log(result);
    res.send(result);
})
app.get('/events/:id', async (req, res) => {
    const { id } = req.params;
    const destination = await eventsCollection.findOne({ _id: new ObjectId(id) });
    res.send(destination);
});

app.post('/joined', async (req, res) => {
    const data = req.body
    const result = await eventsJoinedCollection.insertOne(data)
    res.send(result)
})
app.get('/joined/:email', async (req, res) => {
    const { email } = req.params
    const result = await eventsJoinedCollection.find({ email: email }).toArray()
    res.send(result)
})
app.delete('/joined/:id', async(req,res)=>{
  const {id} = req.params
  const result = await eventsJoinedCollection.deleteOne({ _id:new ObjectId(id) })
  res.send(result)
})

app.get('/', (req, res) => {
    res.send({ message: 'server is running fine' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});