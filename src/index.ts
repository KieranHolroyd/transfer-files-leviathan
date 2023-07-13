import fastify, { FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
  fastify({ logger: true });

server.register(import("@fastify/view"), {
  engine: {
    twig: require("twig"),
  },
});

server.get("/", async (request, reply) => {
  return reply.view("/src/views/index.twig", {});
});

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
