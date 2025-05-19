import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { b } from '../../baml_client';
import { BamlStream, Image } from '@boundaryml/baml';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.BAML_SERVER_PORT || 3002;

app.use(cors());
app.use(express.json());

// Optional override for static args such as example data.
// This is useful for where you want to test with example data
// without having to pass args through the UI. E.g. large data
// files. 
const staticArgs: Record<string, unknown> = {
  ExtractResume: `
    Jof Arnold
    github@jofarnold.com

    Experience:
    - Engineering manager at Tipalti
    - Lead engineer at XYZ
    - Research engineer space vehicles at MAI
    - Nuclear robotics engineer at Magnox

    Skills:
    - TypeScript
    - React
  `
};

function coerceToArgArray(raw: unknown): unknown[] {
  if (raw === undefined || raw === null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function parseArgs(raw: unknown): unknown[] {
  if (!raw) return [];
  try {
    if (Array.isArray(raw)) return raw;
    return JSON.parse(raw as string);
  } catch {
    return [raw];
  }
}

/* ------------------------------- SSE helper ------------------------------- */
type AnyBamlStream = BamlStream<unknown, unknown>;
type BamlStreamFn = (...args: unknown[]) => AnyBamlStream;
interface BamlStreamClientInterface {
  [key: string]: BamlStreamFn;
}

async function sseHandler(
  req: Request,
  res: Response,
  fn: string,
  args: unknown[],
) {
  // First check if b.stream exists and if the function exists on it
  if (!b.stream || typeof b.stream[fn as keyof typeof b.stream] !== 'function') {
    res.status(404).json({ error: `Function ${fn} not found.` });
    return;
  }

  let closed = false;
  req.on('close', () => (closed = true));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  const hb = setInterval(() => {
    if (closed) return clearInterval(hb);
    res.write(': ping\n\n');
  }, 15_000);

  try {
    const callArgs =
      staticArgs[fn] !== undefined
        ? coerceToArgArray(staticArgs[fn])
        : coerceToArgArray(args);

    // Cast b.stream to our interface to make TypeScript happy
    const streamClient = b.stream as unknown as BamlStreamClientInterface;
    const stream: AnyBamlStream = streamClient[fn](...callArgs);

    for await (const partial of stream) {
      if (closed) break;
      res.write('event: partial\n');
      res.write(`data: ${JSON.stringify(partial)}\n\n`);
    }

    // Check if stream has getFinalResponse method
    interface StreamWithFinal extends AnyBamlStream {
      getFinalResponse(): Promise<unknown>;
    }

    if (!closed && typeof (stream as StreamWithFinal).getFinalResponse === 'function') {
      const final = await (stream as StreamWithFinal).getFinalResponse();
      res.write('event: final\n');
      res.write(`data: ${JSON.stringify(final)}\n\n`);
    }
  } catch (err) {
    if (!res.writableEnded) {
      res.write('event: error\n');
      res.write(
        `data: ${JSON.stringify({ message: (err as Error).message })}\n\n`,
      );
    }
  } finally {
    clearInterval(hb);
    if (!res.writableEnded) res.end();
  }
}

app.post('/baml/stream/:fn', (req, res) => {
  sseHandler(req, res, req.params.fn, req.body.args || []);
});
app.get('/baml/stream/:fn', (req, res) => {
  sseHandler(req, res, req.params.fn, parseArgs(req.query.args));
});

app.listen(port, () =>
  console.log(`BAML server listening on http://localhost:${port}`),
);