import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import { createRemoteJWKSet, jwtVerify } from 'jose';

const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL, {
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 60_000,
    serverSelectionTimeoutMS: 8_000,
    connectTimeoutMS: 8_000,
    waitQueueTimeoutMS: 10_000,
    appName: 'togetherwe-server',
});

const db = client.db('togetherWe');
const eventsCollection = db.collection('events')
const eventsJoinedCollection = db.collection('joinedEvents')

let connectionPromise = null;
let indexesPromise = null;

function ensureIndexes() {
    if (!indexesPromise) {
        indexesPromise = Promise.all([
            eventsCollection.createIndex({ date: 1 }),
            eventsCollection.createIndex({ email: 1 }),
            eventsJoinedCollection.createIndex({ email: 1 }),
        ]).catch((err) => {
            indexesPromise = null;
            console.error('Index creation failed:', err.message);
        });
    }
    return indexesPromise;
}

export async function connectToMongoDB() {
    if (!connectionPromise) {
        connectionPromise = client.connect()
            .then(async (connectedClient) => {
                console.log("You successfully connected to MongoDB!");
                await ensureIndexes();
                return connectedClient;
            })
            .catch((err) => {
                connectionPromise = null;
                console.error('MongoDB connection failed:', err.message);
                throw err;
            });
    }
    return connectionPromise;
}

const ensureDb = async (req, res, next) => {
    try {
        await connectToMongoDB();
        next();
    } catch (err) {
        next(err);
    }
};

let JWKS = null;
try {
    if (process.env.CLIENT_URL) {
        JWKS = createRemoteJWKSet(
            new URL('/api/auth/jwks', process.env.CLIENT_URL),
            {
                timeoutDuration: 5_000,
                cooldownDuration: 30_000,
                cacheMaxAge: 600_000,
            }
        );
    } else {
        console.error('CLIENT_URL is not set; authenticated routes will fail');
    }
} catch (err) {
    console.error('Invalid CLIENT_URL; authenticated routes will fail:', err.message);
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const [scheme, token] = authHeader ? authHeader.split(" ") : []

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ msg: "Unauthorized", message: "Unauthorized" })
  }
  if (!JWKS) {
    return res.status(503).json({
      msg: "Auth is not configured",
      message: "Auth is not configured",
    })
  }

 try{
   await jwtVerify(token, JWKS)

   next()
 } catch(error){
   console.error('JWT verification failed:', error.code || error.message)
   const status = String(error.code || '').startsWith('ERR_JWKS') ? 503 : 401
   return res.status(status).json({
     msg: status === 503 ? "Auth temporarily unavailable" : "Unauthorized",
     message: status === 503 ? "Auth temporarily unavailable" : "Unauthorized",
   })
 }
}

function getTodayInDhaka() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const value = (type) => parts.find((part) => part.type === type)?.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
}

function toObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : null;
}

app.get('/events', ensureDb, async (req, res) => {
    const today = getTodayInDhaka();

    const events = await eventsCollection
        .find({ date: { $gte: today } })
        .sort({ date: 1 })
        .toArray();

    res.json(events);
});

app.post('/add-event',verifyToken, ensureDb, async(req,res)=>{
    const { _id, ...data } = req.body || {};

    if (!data.title || !data.date) {
        return res.status(400).json({ message: "Title and date are required" });
    }

    const result = await eventsCollection.insertOne(data);

    console.log('Event created:', result.insertedId);
    res.json(result);
})
app.get('/events/:id', ensureDb, async (req, res) => {
    const _id = toObjectId(req.params.id);

    if (!_id) {
        return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await eventsCollection.findOne({ _id });

    if (!event) {
        return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
});

app.post('/joined',verifyToken, ensureDb, async (req, res) => {
    const { _id, ...data } = req.body || {};

    if (!data.email || !data.id) {
        return res.status(400).json({ message: "Email and event id are required" });
    }

    const result = await eventsJoinedCollection.insertOne(data)
    res.json(result)
})
app.get('/joined/:email',verifyToken, ensureDb, async (req, res) => {
    const { email } = req.params
    const result = await eventsJoinedCollection.find({ email: email }).toArray()
    res.json(result)
})
app.delete('/joined/:id', verifyToken, ensureDb, async(req,res)=>{
  const _id = toObjectId(req.params.id)

  if (!_id) {
    return res.status(400).json({ message: "Invalid joined event id" })
  }

  const result = await eventsJoinedCollection.deleteOne({ _id })
  res.json(result)
})
app.get("/events/user/:email",verifyToken, ensureDb, async (req, res) => {
    try {
        const { email } = req.params;
        const result = await eventsCollection.find({ email }).toArray();
        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Failed to fetch events" });
    }
})
app.delete('/events/:id',verifyToken, ensureDb, async (req, res) => {
    const _id = toObjectId(req.params.id)

    if (!_id) {
        return res.status(400).json({ message: "Invalid event id" })
    }

    const result = await eventsCollection.deleteOne({ _id })
    res.json(result)
})

app.patch('/events/:id',verifyToken, ensureDb, async (req, res) => {
  const _id = toObjectId(req.params.id);

  if (!_id) {
    return res.status(400).json({ message: "Invalid event id" });
  }

  const { _id: ignored, ...updatedData } = req.body || {};

  if (Object.keys(updatedData).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const result = await eventsCollection.updateOne({ _id }, { $set: updatedData });
  res.json(result);
});

app.get('/featured', ensureDb, async (req, res) => {
    const today = getTodayInDhaka();

    const featured = await eventsCollection
        .find({ date: { $gte: today } })
        .sort({ date: 1 })
        .limit(6)
        .toArray();

    res.json(featured);
});

app.get('/', (req, res) => {
    res.json({ message: 'server is running fine' });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON body' });
    }

    console.error(`${req.method} ${req.originalUrl} failed:`, err.message);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: status >= 500 ? 'Internal server error' : err.message,
    });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app
