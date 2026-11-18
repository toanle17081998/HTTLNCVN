import cluster from "node:cluster";
import { availableParallelism } from "node:os";

const requestedWorkers = Number.parseInt(process.env.API_WORKERS ?? "", 10);
const workers = Number.isInteger(requestedWorkers) && requestedWorkers > 0
  ? requestedWorkers
  : Math.min(availableParallelism(), 4);

if (cluster.isPrimary) {
  for (let index = 0; index < workers; index += 1) cluster.fork();
  cluster.on("exit", (worker) => {
    if (!worker.exitedAfterDisconnect) cluster.fork();
  });
} else {
  await import("../apps/api/dist/main.js");
}

