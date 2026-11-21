import { z } from "zod";

export const schema = z
  .object({
    title: z.string().trim().min(1).max(120),
    nodes: z
      .array(
        z.object({
          id: z.string().regex(/^[\w-]+$/),
          label: z.string().trim().min(1).max(60),
          summary: z.string().trim().min(1),
          keyTakeaways: z.array(z.string().trim().min(1)).length(3),
          level: z.union([z.literal(0), z.literal(1), z.literal(2)]),
        }),
      )
      .min(2)
      .max(40),
    edges: z.array(z.object({ source: z.string(), target: z.string() })),
  })
  .superRefine((map, ctx) => {
    const levels = new Map(map.nodes.map((n) => [n.id, n.level]));
    const targets = new Set(map.edges.map((e) => e.target));
    if (
      levels.size !== map.nodes.length ||
      map.nodes.filter((n) => !n.level).length !== 1 ||
      targets.size !== map.nodes.length - 1 ||
      targets.size !== map.edges.length ||
      map.edges.some(
        (e) =>
          !levels.has(e.source) ||
          levels.get(e.target) !== levels.get(e.source)! + 1,
      )
    )
      ctx.addIssue({ code: "custom", message: "Expected a rooted tree" });
  });
export type MindMap = z.infer<typeof schema>;
const topics = [
  [
    "How the Internet Works",
    "The internet connects independent networks so devices can exchange data.",
    "Devices send packets",
    "Routers connect networks",
    "Protocols keep devices compatible",
  ],
  [
    "Addressing",
    "Network addresses help devices find one another.",
    "IP identifies destinations",
    "Names help humans",
    "DNS connects names to addresses",
  ],
  [
    "Data in transit",
    "Messages travel across networks in small pieces.",
    "Packets share links",
    "Routes can change",
    "Transport protocols manage delivery",
  ],
  [
    "Web services",
    "Browsers request resources from remote servers.",
    "URLs identify resources",
    "HTTP carries requests",
    "Encryption protects traffic",
  ],
  [
    "IP addresses",
    "IP addresses identify network interfaces.",
    "IPv4 uses 32 bits",
    "IPv6 uses 128 bits",
    "Addresses can change",
  ],
  [
    "Domain names",
    "DNS resolves readable names into network records.",
    "Resolvers answer queries",
    "Caches reduce delay",
    "Records expire",
  ],
  [
    "Packets",
    "Packets carry pieces of a message across links.",
    "Headers guide delivery",
    "Payloads carry data",
    "Packets can arrive out of order",
  ],
  [
    "Routers",
    "Routers forward packets toward their destinations.",
    "Tables describe routes",
    "Each hop forwards traffic",
    "Multiple networks cooperate",
  ],
  [
    "HTTP requests",
    "Browsers use HTTP to exchange messages with servers.",
    "Methods express intent",
    "Status codes describe outcomes",
    "Bodies carry content",
  ],
  [
    "HTTPS",
    "TLS protects HTTP traffic between endpoints.",
    "Encryption hides content",
    "Certificates authenticate servers",
    "Integrity checks detect changes",
  ],
];
export const demo: MindMap = {
  title: topics[0][0],
  nodes: topics.map(([label, summary, ...keyTakeaways], i) => ({
    id: String(i),
    label,
    summary,
    keyTakeaways,
    level: i === 0 ? 0 : i < 4 ? 1 : 2,
  })),
  edges: topics
    .slice(1)
    .map((_, i) => ({
      source: String(i < 3 ? 0 : 1 + Math.floor((i - 3) / 2)),
      target: String(i + 1),
    })),
};
