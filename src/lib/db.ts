import { MongoClient, Db } from "mongodb";

// Cache the MongoClient across hot-reloads in development to prevent
// creating new connections on every request.
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI env var");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise as Promise<MongoClient>;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  const resolvedDbName = dbName ?? process.env.DB_NAME;
  return resolvedDbName ? client.db(resolvedDbName) : client.db();
}


