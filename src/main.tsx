import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./style.css";
class Boundary extends React.Component<
  React.PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal">
        <h1>The signal was interrupted.</h1>
        <p>Your last saved checkpoint is safe.</p>
        <button onClick={() => location.reload()}>Reload game</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>,
);
