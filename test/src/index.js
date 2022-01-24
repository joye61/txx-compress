import "./index.css";
import React from "react";
import ReactDOM from "react-dom";
import { compress } from "txx-compress";

function App() {
  return (
    <div>
      <input
        type="file"
        onChange={async (event) => {
          const file = event.target.files[0];
          await compress(file);
        }}
      />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
