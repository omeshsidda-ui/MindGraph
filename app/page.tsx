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
  ArrowRight,
  ListTree,
  GitFork,
  Download,
  Copy,
  X,
  Play,
  Workflow,
  Plus,
  ChevronRight,
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
        {item.level === 0 && "Central topic"}
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
    const y = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 : row++ * 99;
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
    composer = useRef<HTMLDialogElement>(null),
    canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => void flow.fitView({ padding: 0.15 }), 60);
    return () => clearTimeout(timer);
  }, [map, flow]);
  const [view, setView] = useState<"map" | "outline" | null>(null);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const sync = () => setPhone(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const outline = (view ?? (phone ? "outline" : "map")) === "outline";
  useEffect(() => {
    if (!outline) {
      const timer = setTimeout(() => void flow.fitView({ padding: 0.12 }), 100);
      return () => clearTimeout(timer);
    }
  }, [outline, flow]);
  useEffect(() => {
    if (!selected) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") select(null);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [selected]);
  function outlineRow(item: Item): React.ReactNode {
    return (
      <li key={item.id}>
        <button onClick={() => select(item)}>
          <span className={"dot d" + item.level} />
          {item.label}
          <ArrowRight />
        </button>
        <ul>
          {map.edges
            .filter((e) => e.source === item.id)
            .map((e) => outlineRow(map.nodes.find((n) => n.id === e.target)!))}
        </ul>
      </li>
    );
  }
  function loadDemo() {
    composer.current?.close();
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
      composer.current?.close();
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
        <div className="identity">
          <span className="brand">
            <Workflow /> MindGraph
          </span>
          <span className="crumb">
            <ChevronRight /> Workspace
          </span>
        </div>
        <div className="header-actions">
          <button disabled={busy} onClick={loadDemo}>
            <Play /> Try Demo
          </button>
          <button
            className="new"
            onClick={() => {
              select(null);
              setStatus("");
              setShowDemo(false);
              composer.current?.showModal();
            }}
          >
            <Plus />
            New map
          </button>
        </div>
      </header>
      <main>
        <div className="workspace">
          <dialog ref={composer} aria-labelledby="create-title">
            <div className="dialoghead">
              <h2 id="create-title">New map</h2>
              <button
                className="close"
                aria-label="Close composer"
                onClick={() => composer.current?.close()}
              >
                <X />
              </button>
            </div>

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
                <button
                  className="primary"
                  disabled={busy || !values[mode].trim()}
                >
                  <ArrowRight />
                  {busy ? "Generating…" : "Generate map"}
                </button>
              </form>
            </section>
            <p role="status">{status}</p>
            {showDemo && <button onClick={loadDemo}>Load Demo Map</button>}
          </dialog>
          <section className="board">
            <div className="toolbar">
              <div className="document-icon">
                <Workflow />
              </div>
              <div>
                <h1>{map.title}</h1>
                <small>
                  {map.nodes.length} nodes · {map.edges.length} connections
                </small>
              </div>
              <div className="actions">
                <button
                  aria-label="Download PNG"
                  title="Download PNG"
                  onClick={download}
                >
                  <Download /> <span>PNG</span>
                </button>
                <button
                  aria-label="Copy Markdown Outline"
                  title="Copy Markdown Outline"
                  onClick={copy}
                >
                  <Copy /> <span>Markdown</span>
                </button>
              </div>
            </div>
            <p className="feedback" role="status">
              {composer.current?.open ? "" : status}
            </p>
            <div className="views">
              <button aria-pressed={!outline} onClick={() => setView("map")}>
                <GitFork />
                Map
              </button>
              <button aria-pressed={outline} onClick={() => setView("outline")}>
                <ListTree />
                Outline
              </button>
            </div>
            <div
              className={"canvas " + (outline ? "reading" : "")}
              ref={canvas}
            >
              <div className="graph-layer" inert={outline}>
                <ReactFlow
                  nodes={layout(map)}
                  edges={map.edges.map((e) => ({
                    ...e,
                    id: JSON.stringify([e.source, e.target]),
                    type: "default",
                    style: { stroke: "#aaa6c4", strokeWidth: 2 },
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
              </div>
              {outline && (
                <div className="reader">
                  <ul>{outlineRow(map.nodes.find((n) => n.level === 0)!)}</ul>
                </div>
              )}
              {selected && (
                <aside aria-label="Node details">
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
          </section>
        </div>
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
