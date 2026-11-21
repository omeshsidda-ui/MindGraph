"use client";
import { useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  getViewportForBounds,
} from "@xyflow/react";
import {
  Network,
  Globe,
  Layers,
  Waypoints,
  FileText,
  Radio,
  Box,
  Route,
  Link2,
  Lock,
  Type,
  Video,
  Sparkles,
  Download,
  Copy,
  X,
  FlaskConical,
  Workflow,
} from "lucide-react";
import { toPng } from "html-to-image";
import { demo, type MindMap } from "../lib/map";
const icons = [
  Globe,
  Waypoints,
  Radio,
  Layers,
  Network,
  Link2,
  Box,
  Route,
  FileText,
  Lock,
];
type Item = MindMap["nodes"][number];
function Card({ data }: { data: { item: Item; index: number } }) {
  const { item, index } = data,
    Icon = icons[index % icons.length];
  return (
    <div className={"card level" + item.level}>
      <Handle type="target" position={Position.Left} />
      <div className="tag">
        <Icon size={14} />
        {["Central topic", "Branch", "Concept"][item.level]}
      </div>
      <strong>{item.label}</strong>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { card: Card };
function layout(map: MindMap) {
  let row = 0;
  const positions = new Map<string, number>();
  function place(item: Item): number {
    const children = map.edges
      .filter((e) => e.source === item.id)
      .map((e) => map.nodes.find((n) => n.id === e.target)!);
    const ys = children.map(place);
    const y = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 : row++ * 135;
    positions.set(item.id, y);
    return y;
  }
  place(map.nodes.find((n) => n.level === 0)!);
  return map.nodes.map((item, index) => ({
    id: item.id,
    type: "card",
    position: { x: item.level * 310, y: positions.get(item.id)! },
    data: { item, index },
  }));
}
const modes = ["Topic", "YouTube URL", "Paste Notes"];
function Studio() {
  const [map, setMap] = useState(demo),
    [mode, setMode] = useState(0),
    [values, setValues] = useState(["", "", ""]),
    [selected, select] = useState<Item | null>(null),
    [showDemo, setShowDemo] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const flow = useReactFlow(),
    canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => void flow.fitView({ padding: 0.15 }), 60);
    return () => clearTimeout(timer);
  }, [map, flow]);
  function loadDemo() {
    setMap(demo);
    select(null);
    setShowDemo(false);
    setStatus("Demo loaded.");
    void flow.fitView();
  }
  async function generate() {
    setBusy(true);
    setShowDemo(false);
    setStatus("");
    try {
      const res = await fetch("/api/generate-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: modes[mode], input: values[mode] }),
      });
      setShowDemo(res.status === 503);
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      setMap(data);
      select(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    try {
      const el = canvas.current!.querySelector<HTMLElement>(
        ".react-flow__viewport",
      )!;
      const bounds = flow.getNodesBounds(flow.getNodes()),
        width = Math.ceil(bounds.width + 100),
        height = Math.ceil(bounds.height + 100);
      const p = getViewportForBounds(bounds, width, height, 1, 1, 0);
      const href = await toPng(el, {
        width,
        height,
        pixelRatio: 2,
        backgroundColor: "#fafafa",
        style: {
          width: width + "px",
          height: height + "px",
          transform: "translate(" + p.x + "px," + p.y + "px) scale(1)",
        },
      });
      const a = document.createElement("a");
      a.href = href;
      a.download = map.title + ".png";
      a.click();
      setStatus("PNG downloaded.");
    } catch {
      setStatus("PNG export failed. Please try again.");
    }
  }
  async function copy() {
    const lines = ["# " + map.title];
    function visit(n: Item) {
      lines.push("", "  ".repeat(n.level) + "- " + n.label + " — " + n.summary);
      map.edges
        .filter((e) => e.source === n.id)
        .forEach((e) => visit(map.nodes.find((x) => x.id === e.target)!));
    }
    visit(map.nodes.find((n) => !n.level)!);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus("Markdown outline copied.");
    } catch {
      setStatus("Clipboard access is unavailable.");
    }
  }
  return (
    <>
      <header>
        <span className="brand">
          <Workflow /> MindGraph
        </span>
        <button disabled={busy} onClick={loadDemo}>
          <FlaskConical /> Try Demo
        </button>
      </header>
      <main>
        <h1>Map workspace</h1>
        <section className="composer">
          <nav aria-label="Input type">
            {modes.map((name, i) => {
              const Icon = [Type, Video, FileText][i];
              return (
                <button
                  key={name}
                  aria-pressed={mode === i}
                  onClick={() => setMode(i)}
                >
                  <Icon />
                  {name}
                </button>
              );
            })}
          </nav>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void generate();
            }}
          >
            <textarea
              aria-label={modes[mode]}
              rows={mode === 2 ? 3 : 1}
              maxLength={32000}
              required
              placeholder={
                [
                  "Enter a topic to map…",
                  "Paste a YouTube video URL…",
                  "Paste your notes or article text…",
                ][mode]
              }
              value={values[mode]}
              onChange={(e) =>
                setValues(
                  values.map((v, i) => (i === mode ? e.target.value : v)),
                )
              }
            />
            <button className="primary" disabled={busy || !values[mode].trim()}>
              <Sparkles />
              {busy ? "Generating…" : "Generate map"}
            </button>
          </form>
        </section>
        <p role="status">{status}</p>
        {showDemo && <button onClick={loadDemo}>Load Demo Map</button>}
        <section className="board">
          <div className="toolbar">
            <div>
              <small>MIND MAP</small>
              <h2>{map.title}</h2>
            </div>
            <div className="actions">
              <button onClick={download}>
                <Download /> Download PNG
              </button>
              <button onClick={copy}>
                <Copy /> Copy Markdown Outline
              </button>
            </div>
          </div>
          <div className="canvas" ref={canvas}>
            <ReactFlow
              nodes={layout(map)}
              edges={map.edges.map((e) => ({
                ...e,
                id: JSON.stringify([e.source, e.target]),
                type: "smoothstep",
                style: { stroke: "#aaa5de", strokeWidth: 2 },
              }))}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              nodesConnectable={false}
              nodesDraggable={false}
              onNodeClick={(_, n) => select(n.data.item)}
              onPaneClick={() => select(null)}
            >
              <Background color="#d4d4df" gap={18} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
            {selected && (
              <aside>
                <button
                  className="close"
                  aria-label="Close details"
                  onClick={() => select(null)}
                >
                  <X />
                </button>
                <small>NODE DETAILS</small>
                <h2>{selected.label}</h2>
                <p>{selected.summary}</p>
                <h3>Key takeaways</h3>
                <ul>
                  {selected.keyTakeaways.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
          <footer>
            {map.nodes.length} nodes <span>·</span> {map.edges.length}{" "}
            connections
          </footer>
        </section>
      </main>
    </>
  );
}
export default function Page() {
  return (
    <ReactFlowProvider>
      <Studio />
    </ReactFlowProvider>
  );
}
