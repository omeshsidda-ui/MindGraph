import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import "@xyflow/react/dist/style.css";
import "./style.css";
export const metadata = {
  title: "MindGraph",
  description: "Explore a topic as an interactive mind map.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
