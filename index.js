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

app.get('/events', async (req, res) => {
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Dhaka'
    });

    const events = await eventsCollection
        .find({ date: { $gte: today } })
        .sort({ date: 1 })
        .toArray();

    res.send(events);
});

app.post('/add-event', async(req,res)=>{
    const data = req.body;
    const result = await eventsCollection.insertOne(data);

    console.log(result);
    res.send(result);
})
app.get('/events/:id', async (req, res) => {
    const { id } = req.params;
    const events = await eventsCollection.findOne({ _id: new ObjectId(id) });
    res.send(events);
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
app.get("/events/user/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const result = await eventsCollection.find({ email }).toArray();
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch events" });
    }
})
app.delete('/events/:id', async (req, res) => {
    const { id } = req.params
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) })
    res.send(result)
})

app.patch('/events/:id', async (req, res) => {
  const {id}= req.params;
  const updatedData = req.body;
  const result = await eventsCollection.updateOne({ _id:new ObjectId(id) }, { $set: updatedData });
  res.send(result);
});

app.get('/featured', async (req, res) => {
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Dhaka'
    });

    const featured = await eventsCollection
        .find({ date: { $gte: today } })
        .sort({ date: 1 })
        .limit(6)
        .toArray();

    res.send(featured);
});

app.get('/', (req, res) => {
    res.send({ message: 'server is running fine' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});